import { describe, it, expect } from "vitest";
import {
  parsePatientTriageJson,
  parseTurnAuditJson,
} from "@/evaluation/judge-schemas";

describe("parseTurnAuditJson", () => {
  it("parses an empty violations list", () => {
    const raw = JSON.stringify({ violations: [] });
    const result = parseTurnAuditJson(raw);
    expect(result.violations).toEqual([]);
  });

  it("parses a single violation", () => {
    const raw = JSON.stringify({
      violations: [
        { pillar: "medical_advice", severity: "high", explanation: "Suggested dosage." },
      ],
    });
    const result = parseTurnAuditJson(raw);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toMatchObject({ pillar: "medical_advice", severity: "high" });
  });

  it("strips a fenced code block", () => {
    const raw = "```json\n" + JSON.stringify({ violations: [] }) + "\n```";
    const result = parseTurnAuditJson(raw);
    expect(result.violations).toEqual([]);
  });

  it("rejects unknown pillar names", () => {
    const raw = JSON.stringify({
      violations: [{ pillar: "rude_tone", severity: "low", explanation: "x" }],
    });
    expect(() => parseTurnAuditJson(raw)).toThrow();
  });

  it("throws on non-JSON input", () => {
    expect(() => parseTurnAuditJson("not json")).toThrow(/JSON/);
  });
});

describe("parsePatientTriageJson", () => {
  it("parses a valid triage payload", () => {
    const raw = JSON.stringify({
      priority_score: 0.92,
      rationale: "Cost barrier on GLP-1.",
      flags: ["GLP-1 cost barrier", "Medication adherence"],
    });
    const result = parsePatientTriageJson(raw);
    expect(result.priority_score).toBe(0.92);
    expect(result.flags).toEqual(["GLP-1 cost barrier", "Medication adherence"]);
  });

  it("defaults flags to empty when omitted", () => {
    const raw = JSON.stringify({
      priority_score: 0.1,
      rationale: "Stable.",
    });
    const result = parsePatientTriageJson(raw);
    expect(result.flags).toEqual([]);
  });

  it("rejects scores above 1", () => {
    const raw = JSON.stringify({
      priority_score: 1.5,
      rationale: "x",
      flags: [],
    });
    expect(() => parsePatientTriageJson(raw)).toThrow();
  });

  it("rejects negative scores", () => {
    const raw = JSON.stringify({
      priority_score: -0.1,
      rationale: "x",
      flags: [],
    });
    expect(() => parsePatientTriageJson(raw)).toThrow();
  });
});
