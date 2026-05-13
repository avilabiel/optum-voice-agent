import { inngest } from "@/inngest/client";
import {
  appendTurn,
  findMemberByExternalId,
  findOrCreateTenant,
  findSessionByVapiCallId,
  finalizeSession,
  startCallSession,
} from "@/db/queries";
import { db } from "@/db/client";
import { callSessions } from "@/db/schema";
import { sql } from "drizzle-orm";
import { env } from "@/env";
import { log } from "@/observability/logger";
import type { ParsedWebhook } from "@/vapi/webhook-parsing";

export async function handleParsedWebhook(parsed: ParsedWebhook): Promise<void> {
  if (parsed.kind === "ignored") return;

  if (parsed.kind === "transcript") {
    await recordTranscriptTurn(parsed);
    return;
  }

  if (parsed.kind === "end_of_call") {
    await recordEndOfCall(parsed);
    return;
  }

  if (parsed.kind === "tool_call") {
    log.info("vapi tool call", {
      callId: parsed.callId,
      tool: parsed.toolName,
      arguments: parsed.arguments,
    });
    return;
  }
}

async function recordTranscriptTurn(
  parsed: Extract<ParsedWebhook, { kind: "transcript" }>,
): Promise<void> {
  const session = await findSessionByVapiCallId(parsed.callId);
  if (!session) {
    log.warn("dropping transcript for unknown call", { callId: parsed.callId });
    return;
  }

  const turnIndex = await nextTurnIndex(session.id);
  await appendTurn({
    sessionId: session.id,
    turnIndex,
    role: parsed.role,
    text: parsed.text,
  });
}

async function nextTurnIndex(sessionId: string): Promise<number> {
  const rows = await db().execute<{ next: number }>(sql`
    select coalesce(max(turn_index), -1) + 1 as next
    from turns
    where session_id = ${sessionId}
  `);
  const first = rows.rows[0];
  return first?.next ?? 0;
}

async function recordEndOfCall(
  parsed: Extract<ParsedWebhook, { kind: "end_of_call" }>,
): Promise<void> {
  const session = await findSessionByVapiCallId(parsed.callId);
  if (!session) {
    log.warn("end-of-call for unknown call", { callId: parsed.callId });
    return;
  }

  await finalizeSession({
    sessionId: session.id,
    recordingUrl: parsed.recordingUrl,
    summary: parsed.summary,
  });

  await inngest.send({
    id: `call-completed-${session.id}`,
    name: "call.completed",
    data: {
      sessionId: session.id,
      memberId: session.memberId,
      vapiCallId: parsed.callId,
    },
  });
}

export async function ensureSessionForOutboundCall(input: {
  vapiCallId: string;
  memberId: string;
}) {
  const tenantId = await findOrCreateTenant(env().DEMO_TENANT_NAME);
  return startCallSession({
    tenantId,
    memberId: input.memberId,
    vapiCallId: input.vapiCallId,
  });
}

export async function adoptInboundCallIfPossible(input: {
  vapiCallId: string;
  customerNumber: string | undefined;
}): Promise<void> {
  if (!input.customerNumber) return;
  const existing = await findSessionByVapiCallId(input.vapiCallId);
  if (existing) return;

  const tenantId = await findOrCreateTenant(env().DEMO_TENANT_NAME);
  const member = await findMemberByExternalId(tenantId, input.customerNumber);
  if (!member) return;

  await startCallSession({
    tenantId,
    memberId: member.id,
    vapiCallId: input.vapiCallId,
  });
}

export { callSessions };
