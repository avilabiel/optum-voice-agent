import { describe, it, expect } from "vitest";
import { QUESTIONNAIRE, questionnaireAsMarkdown, sectionById } from "@/domain/questionnaire";

describe("questionnaire", () => {
  it("contains all five sections in order", () => {
    const ids = QUESTIONNAIRE.map((s) => s.id);
    expect(ids).toEqual(["S1", "S2", "S3", "S4", "S5"]);
  });

  it("looks up a section by id", () => {
    const s4 = sectionById("S4");
    expect(s4.title).toBe("Medications");
  });

  it("throws on unknown section", () => {
    expect(() => sectionById("S9" as never)).toThrow();
  });

  it("medications section lists cost as an escalation trigger", () => {
    const s4 = sectionById("S4");
    expect(s4.escalationTriggers).toBeDefined();
    expect(s4.escalationTriggers!.join(" ")).toMatch(/cost/i);
  });

  it("renders as markdown including every section heading", () => {
    const md = questionnaireAsMarkdown();
    expect(md).toMatch(/S1 — Member Concerns/);
    expect(md).toMatch(/S5 — Social Determinants/);
  });
});
