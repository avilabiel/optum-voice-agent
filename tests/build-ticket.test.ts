import { describe, it, expect } from "vitest";
import { buildSystemTicketInput } from "@/inngest/functions/build-ticket";

const baseContext = {
  tenantId: "00000000-0000-0000-0000-00000000aaaa",
  memberId: "00000000-0000-0000-0000-00000000bbbb",
  sourceCallId: "00000000-0000-0000-0000-00000000cccc",
  now: new Date("2026-05-13T00:00:00.000Z"),
};

describe("buildSystemTicketInput", () => {
  it("returns null when the score is below the threshold", () => {
    const result = buildSystemTicketInput(
      { priorityScore: 0.4, rationale: "stable", flags: [] },
      baseContext,
    );
    expect(result).toBeNull();
  });

  it("builds an urgent ticket for a high score", () => {
    const result = buildSystemTicketInput(
      {
        priorityScore: 0.92,
        rationale: "Cost barrier on GLP-1 with missed doses.",
        flags: ["GLP-1 cost barrier", "Medication adherence"],
      },
      baseContext,
    );
    expect(result).not.toBeNull();
    expect(result?.slaTier).toBe("urgent_24h");
    expect(result?.topic).toBe("GLP-1 cost barrier");
    expect(result?.reason).toBe("Cost barrier on GLP-1 with missed doses.");
    expect(result?.origin).toBe("system_initiated");
    expect(result?.dueAt?.toISOString()).toBe("2026-05-14T00:00:00.000Z");
  });

  it("falls back to a default topic when no flags are present", () => {
    const result = buildSystemTicketInput(
      { priorityScore: 0.6, rationale: "Moderate concern.", flags: [] },
      baseContext,
    );
    expect(result?.topic).toBe("Wellness follow-up");
    expect(result?.slaTier).toBe("routine_1w");
  });

  it("builds a priority_72h ticket for the middle band", () => {
    const result = buildSystemTicketInput(
      {
        priorityScore: 0.7,
        rationale: "Cost barrier reported.",
        flags: ["Cost barrier"],
      },
      baseContext,
    );
    expect(result?.slaTier).toBe("priority_72h");
    expect(result?.dueAt?.toISOString()).toBe("2026-05-16T00:00:00.000Z");
  });
});
