import { describe, it, expect } from "vitest";
import { normalizePhone, phonesMatch } from "@/lib/phone";

describe("normalizePhone", () => {
  it("preserves a leading plus and strips the rest of non-digits", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("returns digits-only when there is no leading plus", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("5551234567");
  });

  it("trims surrounding whitespace before normalizing", () => {
    expect(normalizePhone("   +15551234567  ")).toBe("+15551234567");
  });
});

describe("phonesMatch", () => {
  it("matches identical E.164 numbers", () => {
    expect(phonesMatch("+15551234567", "+15551234567")).toBe(true);
  });

  it("matches across different formatting", () => {
    expect(phonesMatch("+1 (555) 123-4567", "+15551234567")).toBe(true);
  });

  it("does not match different numbers", () => {
    expect(phonesMatch("+15551234567", "+15557654321")).toBe(false);
  });

  it("does not match a digits-only number against a different E.164 number", () => {
    expect(phonesMatch("5551234567", "+15551234567")).toBe(false);
  });
});
