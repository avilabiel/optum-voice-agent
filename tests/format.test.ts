import { describe, it, expect } from "vitest";
import { formatScore, isHighPriority } from "@/lib/format";

describe("formatScore", () => {
  it("formats to two decimal places", () => {
    expect(formatScore(0.923)).toBe("0.92");
  });

  it("formats whole numbers", () => {
    expect(formatScore(0)).toBe("0.00");
  });
});

describe("isHighPriority", () => {
  it("is true at 0.8 exactly", () => {
    expect(isHighPriority(0.8)).toBe(true);
  });

  it("is false just below the threshold", () => {
    expect(isHighPriority(0.79)).toBe(false);
  });

  it("is true above the threshold", () => {
    expect(isHighPriority(0.95)).toBe(true);
  });
});
