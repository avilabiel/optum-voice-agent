import { inngest } from "../client";
import { listTurnsForSession, saveAuditFinding } from "@/db/queries";
import { auditTurn } from "@/evaluation/judges";
import type { TurnAuditResult } from "@/evaluation/judge-schemas";
import type { TranscriptLine } from "@/evaluation/transcript";
import { log } from "@/observability/logger";

type LoadedTurns = {
  transcript: TranscriptLine[];
  assistantTurns: Array<{ id: string; text: string; positionInTranscript: number }>;
};

export const turnsAuditFn = inngest.createFunction(
  {
    id: "turns-audit",
    name: "Turns audit",
    idempotency: "event.data.sessionId",
  },
  { event: "call.completed" },
  async ({ event, step }) => {
    const { sessionId } = event.data;

    const loaded: LoadedTurns = await step.run("load-turns", async () => {
      return loadTurnsForAudit(sessionId);
    });

    for (const turn of loaded.assistantTurns) {
      const finding = await step.run(`audit-turn-${turn.id}`, async () => {
        const upToTurn = loaded.transcript.slice(0, turn.positionInTranscript + 1);
        return auditTurn({
          sessionId,
          turnId: turn.id,
          turnText: turn.text,
          transcriptUpToTurn: upToTurn,
        });
      });

      await step.run(`persist-audit-${turn.id}`, async () => {
        await persistFindings(turn.id, finding);
      });
    }

    log.info("turns-audit completed", { sessionId, evaluated: loaded.assistantTurns.length });
    return { ok: true, evaluated: loaded.assistantTurns.length };
  },
);

async function loadTurnsForAudit(sessionId: string): Promise<LoadedTurns> {
  const rows = await listTurnsForSession(sessionId);
  const transcript: TranscriptLine[] = rows.map((r) => ({ role: r.role, text: r.text }));

  const assistantTurns: LoadedTurns["assistantTurns"] = [];
  rows.forEach((row, index) => {
    if (row.role === "assistant") {
      assistantTurns.push({ id: row.id, text: row.text, positionInTranscript: index });
    }
  });

  return { transcript, assistantTurns };
}

async function persistFindings(turnId: string, result: TurnAuditResult): Promise<void> {
  if (result.violations.length === 0) {
    await persistPass(turnId);
    return;
  }
  for (const v of result.violations) {
    await saveAuditFinding({
      turnId,
      pillar: v.pillar,
      passed: false,
      severity: v.severity,
      explanation: v.explanation,
    });
  }
}

async function persistPass(turnId: string): Promise<void> {
  const pillars = ["medical_advice", "off_script", "inaccurate_record", "missed_escalation"] as const;
  for (const pillar of pillars) {
    await saveAuditFinding({
      turnId,
      pillar,
      passed: true,
      severity: null,
      explanation: "No violation detected.",
    });
  }
}
