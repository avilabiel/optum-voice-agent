import { and, asc, eq, desc, sql } from "drizzle-orm";
import { db } from "./client";
import {
  auditFindings,
  callbackTickets,
  callSessions,
  members,
  tenants,
  triageResults,
  turns,
  type CallbackTicket,
  type Member,
} from "./schema";

export async function findOrCreateTenant(name: string): Promise<string> {
  const existing = await db().select().from(tenants).where(eq(tenants.name, name)).limit(1);
  const first = existing[0];
  if (first) return first.id;

  const inserted = await db().insert(tenants).values({ name }).returning({ id: tenants.id });
  const row = inserted[0];
  if (!row) throw new Error("Failed to insert tenant");
  return row.id;
}

export async function listMembersByPriority(tenantId: string): Promise<Member[]> {
  return db()
    .select()
    .from(members)
    .where(eq(members.tenantId, tenantId))
    .orderBy(desc(members.priorityScore));
}

export async function findMemberById(memberId: string): Promise<Member | null> {
  const rows = await db().select().from(members).where(eq(members.id, memberId)).limit(1);
  return rows[0] ?? null;
}

export async function findSessionByVapiCallId(vapiCallId: string) {
  const rows = await db()
    .select()
    .from(callSessions)
    .where(eq(callSessions.vapiCallId, vapiCallId))
    .limit(1);
  return rows[0] ?? null;
}

export async function startCallSession(input: {
  tenantId: string;
  memberId: string;
  vapiCallId: string;
}) {
  const inserted = await db()
    .insert(callSessions)
    .values({
      tenantId: input.tenantId,
      memberId: input.memberId,
      vapiCallId: input.vapiCallId,
      status: "in_progress",
    })
    .onConflictDoNothing({ target: callSessions.vapiCallId })
    .returning();

  if (inserted[0]) return inserted[0];
  const existing = await findSessionByVapiCallId(input.vapiCallId);
  if (!existing) throw new Error("Failed to start or find call session");
  return existing;
}

export async function appendTurn(input: {
  sessionId: string;
  turnIndex: number;
  role: "assistant" | "user";
  text: string;
}) {
  const inserted = await db().insert(turns).values(input).returning();
  const row = inserted[0];
  if (!row) throw new Error("Failed to insert turn");
  return row;
}

export async function listTurnsForSession(sessionId: string) {
  return db()
    .select()
    .from(turns)
    .where(eq(turns.sessionId, sessionId))
    .orderBy(turns.turnIndex);
}

export async function finalizeSession(input: {
  sessionId: string;
  recordingUrl: string | null;
  summary: string | null;
}) {
  await db()
    .update(callSessions)
    .set({
      status: "completed",
      endedAt: new Date(),
      recordingUrl: input.recordingUrl,
      summary: input.summary,
    })
    .where(eq(callSessions.id, input.sessionId));
}

export async function saveTriageResult(input: {
  sessionId: string;
  memberId: string;
  priorityScore: number;
  rationale: string;
  flags: string[];
}) {
  const score = input.priorityScore.toFixed(3);

  await db().insert(triageResults).values({
    sessionId: input.sessionId,
    memberId: input.memberId,
    priorityScore: score,
    rationale: input.rationale,
    flags: input.flags,
  });

  await db()
    .update(members)
    .set({
      priorityScore: score,
      priorityRationale: input.rationale,
      flags: input.flags,
      lastCallAt: new Date(),
    })
    .where(eq(members.id, input.memberId));
}

export async function saveAuditFinding(input: {
  turnId: string;
  pillar: "medical_advice" | "off_script" | "inaccurate_record" | "missed_escalation";
  passed: boolean;
  severity: "low" | "medium" | "high" | null;
  explanation: string;
}) {
  await db().insert(auditFindings).values({
    turnId: input.turnId,
    pillar: input.pillar,
    passed: input.passed,
    severity: input.severity,
    explanation: input.explanation,
  });
}

export async function countMembers(tenantId: string): Promise<number> {
  const rows = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(members)
    .where(eq(members.tenantId, tenantId));
  return rows[0]?.count ?? 0;
}

export async function deleteAllMembersForTenant(tenantId: string) {
  await db().delete(members).where(eq(members.tenantId, tenantId));
}

export async function findMemberByExternalId(tenantId: string, externalId: string) {
  const rows = await db()
    .select()
    .from(members)
    .where(and(eq(members.tenantId, tenantId), eq(members.externalId, externalId)))
    .limit(1);
  return rows[0] ?? null;
}

export type CreateCallbackTicketInput = {
  tenantId: string;
  memberId: string;
  sourceCallId: string;
  origin: "member_requested" | "system_initiated";
  topic: string;
  reason: string | null;
  triggeredSection: string | null;
  priorityScore: number | null;
  slaTier: "urgent_24h" | "priority_72h" | "routine_1w" | null;
  dueAt: Date | null;
  vapiToolCallId: string | null;
};

export async function createCallbackTicket(
  input: CreateCallbackTicketInput,
): Promise<CallbackTicket | null> {
  const inserted = await db()
    .insert(callbackTickets)
    .values({
      tenantId: input.tenantId,
      memberId: input.memberId,
      sourceCallId: input.sourceCallId,
      origin: input.origin,
      topic: input.topic,
      reason: input.reason,
      triggeredSection: input.triggeredSection,
      priorityScore: input.priorityScore !== null ? input.priorityScore.toFixed(3) : null,
      slaTier: input.slaTier,
      dueAt: input.dueAt,
      vapiToolCallId: input.vapiToolCallId,
    })
    .onConflictDoNothing({
      target: [callbackTickets.sourceCallId, callbackTickets.origin],
    })
    .returning();
  return inserted[0] ?? null;
}

export type TicketWithMember = CallbackTicket & {
  memberFirstName: string;
  memberLastName: string;
  memberExternalId: string;
};

export async function listOpenTickets(tenantId: string): Promise<TicketWithMember[]> {
  const rows = await db()
    .select({
      ticket: callbackTickets,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberExternalId: members.externalId,
    })
    .from(callbackTickets)
    .innerJoin(members, eq(members.id, callbackTickets.memberId))
    .where(
      and(eq(callbackTickets.tenantId, tenantId), eq(callbackTickets.status, "open")),
    )
    .orderBy(asc(callbackTickets.dueAt));

  return rows.map((row) => ({
    ...row.ticket,
    memberFirstName: row.memberFirstName,
    memberLastName: row.memberLastName,
    memberExternalId: row.memberExternalId,
  }));
}
