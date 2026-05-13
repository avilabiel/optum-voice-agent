import { inngest } from "../client";
import {
  createCallbackTicket,
  findMemberById,
  listTurnsForSession,
  saveTriageResult,
} from "@/db/queries";
import { triagePatient } from "@/evaluation/judges";
import type { TranscriptLine } from "@/evaluation/transcript";
import { log } from "@/observability/logger";
import { buildSystemTicketInput } from "./build-ticket";

export const patientTriageFn = inngest.createFunction(
  {
    id: "patient-triage",
    name: "Patient triage",
    idempotency: "event.data.sessionId",
  },
  { event: "call.completed" },
  async ({ event, step }) => {
    const { sessionId, memberId } = event.data;

    const transcript = await step.run("load-transcript", async () => {
      return loadTranscript(sessionId);
    });

    const member = await step.run("load-member", async () => {
      const m = await findMemberById(memberId);
      if (!m) throw new Error(`Member ${memberId} not found`);
      return { firstName: m.firstName, tenantId: m.tenantId };
    });

    const result = await step.run("run-triage-llm", async () => {
      return triagePatient({
        sessionId,
        memberFirstName: member.firstName,
        transcript,
      });
    });

    await step.run("persist-result", async () => {
      await saveTriageResult({
        sessionId,
        memberId,
        priorityScore: result.priority_score,
        rationale: result.rationale,
        flags: result.flags,
      });
    });

    await step.run("maybe-create-ticket", async () => {
      await maybeCreateSystemTicket({
        tenantId: member.tenantId,
        memberId,
        sessionId,
        outcome: {
          priorityScore: result.priority_score,
          rationale: result.rationale,
          flags: result.flags,
        },
      });
    });

    log.info("patient-triage completed", {
      sessionId,
      memberId,
      priorityScore: result.priority_score,
      flags: result.flags,
    });

    return { ok: true, priorityScore: result.priority_score };
  },
);

async function loadTranscript(sessionId: string): Promise<TranscriptLine[]> {
  const rows = await listTurnsForSession(sessionId);
  return rows.map((r) => ({ role: r.role, text: r.text }));
}

type MaybeCreateInput = {
  tenantId: string;
  memberId: string;
  sessionId: string;
  outcome: { priorityScore: number; rationale: string; flags: string[] };
};

async function maybeCreateSystemTicket(input: MaybeCreateInput): Promise<void> {
  const ticketInput = buildSystemTicketInput(input.outcome, {
    tenantId: input.tenantId,
    memberId: input.memberId,
    sourceCallId: input.sessionId,
  });

  if (!ticketInput) {
    log.info("triage below ticket threshold — skipping ticket", {
      sessionId: input.sessionId,
      priorityScore: input.outcome.priorityScore,
    });
    return;
  }

  const ticket = await createCallbackTicket(ticketInput);
  if (!ticket) {
    log.info("ticket already exists for this call — skipping", {
      sessionId: input.sessionId,
    });
    return;
  }

  log.info("system-initiated ticket created", {
    sessionId: input.sessionId,
    ticketId: ticket.id,
    slaTier: ticket.slaTier,
    dueAt: ticket.dueAt?.toISOString(),
  });
}
