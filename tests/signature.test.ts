import { describe, it, expect } from "vitest";
import { constantTimeEqual, isSecretValid } from "@/vapi/signature";

describe("constantTimeEqual", () => {
  it("returns true for equal strings", () => {
    expect(constantTimeEqual("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(constantTimeEqual("abc123", "abc124")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
});

describe("isSecretValid", () => {
  it("rejects null header", () => {
    expect(isSecretValid(null, "expected")).toBe(false);
  });

  it("rejects mismatched header", () => {
    expect(isSecretValid("wrong", "expected")).toBe(false);
  });

  it("accepts matching header", () => {
    expect(isSecretValid("expected", "expected")).toBe(true);
  });
});
