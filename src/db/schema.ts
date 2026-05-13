import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    externalId: text("external_id").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    priorityScore: numeric("priority_score", { precision: 4, scale: 3 }).default("0").notNull(),
    priorityRationale: text("priority_rationale"),
    flags: jsonb("flags").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    lastCallAt: timestamp("last_call_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byPriority: index("members_priority_idx").on(t.tenantId, t.priorityScore),
    byExternal: uniqueIndex("members_external_idx").on(t.tenantId, t.externalId),
  }),
);

export const callSessions = pgTable(
  "call_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    memberId: uuid("member_id").notNull().references(() => members.id),
    vapiCallId: text("vapi_call_id").notNull(),
    status: text("status", { enum: ["in_progress", "completed", "failed"] }).notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    recordingUrl: text("recording_url"),
    summary: text("summary"),
  },
  (t) => ({
    byVapiCall: uniqueIndex("call_sessions_vapi_idx").on(t.vapiCallId),
  }),
);

export const turns = pgTable(
  "turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => callSessions.id),
    turnIndex: integer("turn_index").notNull(),
    role: text("role", { enum: ["assistant", "user"] }).notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bySession: index("turns_session_idx").on(t.sessionId, t.turnIndex),
  }),
);

export const auditFindings = pgTable("audit_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  turnId: uuid("turn_id").notNull().references(() => turns.id),
  pillar: text("pillar", {
    enum: ["medical_advice", "off_script", "inaccurate_record", "missed_escalation"],
  }).notNull(),
  passed: boolean("passed").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const triageResults = pgTable("triage_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => callSessions.id),
  memberId: uuid("member_id").notNull().references(() => members.id),
  priorityScore: numeric("priority_score", { precision: 4, scale: 3 }).notNull(),
  rationale: text("rationale").notNull(),
  flags: jsonb("flags").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const callbackTickets = pgTable(
  "callback_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    memberId: uuid("member_id").notNull().references(() => members.id),
    sourceCallId: uuid("source_call_id").notNull().references(() => callSessions.id),
    vapiToolCallId: text("vapi_tool_call_id"),
    origin: text("origin", { enum: ["member_requested", "system_initiated"] }).notNull(),
    triggeredSection: text("triggered_section"),
    topic: text("topic").notNull(),
    reason: text("reason"),
    priorityScore: numeric("priority_score", { precision: 4, scale: 3 }),
    slaTier: text("sla_tier", { enum: ["urgent_24h", "priority_72h", "routine_1w"] }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: text("status", { enum: ["open", "claimed", "completed", "cancelled"] })
      .notNull()
      .default("open"),
    claimedBy: text("claimed_by"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    outcomeReached: boolean("outcome_reached"),
    outcomeNotes: text("outcome_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    worklist: index("tickets_worklist_idx").on(t.tenantId, t.status, t.dueAt),
    bySourceCall: index("tickets_source_call_idx").on(t.sourceCallId),
    byMember: index("tickets_member_idx").on(t.memberId, t.status),
    sourceCallOrigin: uniqueIndex("tickets_source_call_origin_idx").on(t.sourceCallId, t.origin),
  }),
);

export type Tenant = typeof tenants.$inferSelect;
export type Member = typeof members.$inferSelect;
export type CallSession = typeof callSessions.$inferSelect;
export type Turn = typeof turns.$inferSelect;
export type AuditFinding = typeof auditFindings.$inferSelect;
export type TriageResult = typeof triageResults.$inferSelect;
export type CallbackTicket = typeof callbackTickets.$inferSelect;
