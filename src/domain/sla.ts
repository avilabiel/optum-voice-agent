export type SlaTier = "urgent_24h" | "priority_72h" | "routine_1w";

export const TICKET_THRESHOLD = 0.5;

export function slaTierForScore(score: number): SlaTier | null {
  if (score >= 0.85) return "urgent_24h";
  if (score >= 0.65) return "priority_72h";
  if (score >= TICKET_THRESHOLD) return "routine_1w";
  return null;
}

export function dueAtForTier(tier: SlaTier, now: Date = new Date()): Date {
  const hoursFromNow = hoursForTier(tier);
  return new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
}

function hoursForTier(tier: SlaTier): number {
  if (tier === "urgent_24h") return 24;
  if (tier === "priority_72h") return 72;
  return 24 * 7;
}

export function ticketHumanLabel(tier: SlaTier): string {
  if (tier === "urgent_24h") return "Urgent — 24h";
  if (tier === "priority_72h") return "Priority — 72h";
  return "Routine — 1 week";
}
