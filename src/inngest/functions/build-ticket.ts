import { dueAtForTier, slaTierForScore } from "@/domain/sla";
import type { CreateCallbackTicketInput } from "@/db/queries";

export type TriageOutcome = {
  priorityScore: number;
  rationale: string;
  flags: string[];
};

export type TicketContext = {
  tenantId: string;
  memberId: string;
  sourceCallId: string;
  now?: Date;
};

export function buildSystemTicketInput(
  outcome: TriageOutcome,
  context: TicketContext,
): CreateCallbackTicketInput | null {
  const tier = slaTierForScore(outcome.priorityScore);
  if (!tier) return null;

  const dueAt = dueAtForTier(tier, context.now ?? new Date());

  return {
    tenantId: context.tenantId,
    memberId: context.memberId,
    sourceCallId: context.sourceCallId,
    origin: "system_initiated",
    topic: pickTopic(outcome),
    reason: outcome.rationale,
    triggeredSection: null,
    priorityScore: outcome.priorityScore,
    slaTier: tier,
    dueAt,
    vapiToolCallId: null,
  };
}

function pickTopic(outcome: TriageOutcome): string {
  const firstFlag = outcome.flags[0];
  if (firstFlag) return firstFlag;
  return "Wellness follow-up";
}
