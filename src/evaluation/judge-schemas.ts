import { z } from "zod";

const severity = z.enum(["low", "medium", "high"]);
const pillar = z.enum(["medical_advice", "off_script", "inaccurate_record", "missed_escalation"]);

export const turnAuditSchema = z.object({
  violations: z.array(
    z.object({
      pillar,
      severity,
      explanation: z.string().min(1),
    }),
  ),
});

export const patientTriageSchema = z.object({
  priority_score: z.number().min(0).max(1),
  rationale: z.string().min(1),
  flags: z.array(z.string()).default([]),
});

export type TurnAuditResult = z.infer<typeof turnAuditSchema>;
export type PatientTriageResult = z.infer<typeof patientTriageSchema>;

export function parseTurnAuditJson(raw: string): TurnAuditResult {
  const json = parseJsonOrThrow(raw, "turn audit");
  return turnAuditSchema.parse(json);
}

export function parsePatientTriageJson(raw: string): PatientTriageResult {
  const json = parseJsonOrThrow(raw, "patient triage");
  return patientTriageSchema.parse(json);
}

function parseJsonOrThrow(raw: string, label: string): unknown {
  const cleaned = stripCodeFences(raw).trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Could not parse ${label} response as JSON: ${(err as Error).message}`);
  }
}

function stripCodeFences(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced && fenced[1]) return fenced[1];
  return raw;
}
