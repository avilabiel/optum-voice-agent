import { describe, it, expect } from "vitest";
import { dueAtForTier, slaTierForScore, ticketHumanLabel } from "@/domain/sla";

describe("slaTierForScore", () => {
  it("returns urgent_24h at the 0.85 boundary", () => {
    expect(slaTierForScore(0.85)).toBe("urgent_24h");
  });

  it("returns urgent_24h above 0.85", () => {
    expect(slaTierForScore(0.92)).toBe("urgent_24h");
  });

  it("returns priority_72h at the 0.65 boundary", () => {
    expect(slaTierForScore(0.65)).toBe("priority_72h");
  });

  it("returns priority_72h between 0.65 and 0.85", () => {
    expect(slaTierForScore(0.75)).toBe("priority_72h");
  });

  it("returns routine_1w at the 0.5 boundary", () => {
    expect(slaTierForScore(0.5)).toBe("routine_1w");
  });

  it("returns routine_1w between 0.5 and 0.65", () => {
    expect(slaTierForScore(0.55)).toBe("routine_1w");
  });

  it("returns null just below 0.5", () => {
    expect(slaTierForScore(0.49)).toBeNull();
  });

  it("returns null for 0", () => {
    expect(slaTierForScore(0)).toBeNull();
  });
});

describe("dueAtForTier", () => {
  const reference = new Date("2026-05-13T00:00:00.000Z");

  it("adds 24 hours for urgent_24h", () => {
    const due = dueAtForTier("urgent_24h", reference);
    expect(due.toISOString()).toBe("2026-05-14T00:00:00.000Z");
  });

  it("adds 72 hours for priority_72h", () => {
    const due = dueAtForTier("priority_72h", reference);
    expect(due.toISOString()).toBe("2026-05-16T00:00:00.000Z");
  });

  it("adds 7 days for routine_1w", () => {
    const due = dueAtForTier("routine_1w", reference);
    expect(due.toISOString()).toBe("2026-05-20T00:00:00.000Z");
  });
});

describe("ticketHumanLabel", () => {
  it("formats urgent label", () => {
    expect(ticketHumanLabel("urgent_24h")).toBe("Urgent — 24h");
  });

  it("formats priority label", () => {
    expect(ticketHumanLabel("priority_72h")).toBe("Priority — 72h");
  });

  it("formats routine label", () => {
    expect(ticketHumanLabel("routine_1w")).toBe("Routine — 1 week");
  });
});
