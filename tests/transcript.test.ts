import { describe, it, expect } from "vitest";
import { transcriptToText, turnsToTranscript } from "@/evaluation/transcript";
import type { Turn } from "@/db/schema";

function makeTurn(partial: Partial<Turn> & Pick<Turn, "role" | "text">): Turn {
  return {
    id: partial.id ?? "00000000-0000-0000-0000-000000000000",
    sessionId: partial.sessionId ?? "session-1",
    turnIndex: partial.turnIndex ?? 0,
    role: partial.role,
    text: partial.text,
    createdAt: partial.createdAt ?? new Date(),
  };
}

describe("turnsToTranscript", () => {
  it("maps turns to role/text pairs in order", () => {
    const lines = turnsToTranscript([
      makeTurn({ role: "assistant", text: "Hi.", turnIndex: 0 }),
      makeTurn({ role: "user", text: "Hello.", turnIndex: 1 }),
    ]);
    expect(lines).toEqual([
      { role: "assistant", text: "Hi." },
      { role: "user", text: "Hello." },
    ]);
  });
});

describe("transcriptToText", () => {
  it("labels assistant lines as ASSISTANT and user lines as MEMBER", () => {
    const text = transcriptToText([
      { role: "assistant", text: "Hi." },
      { role: "user", text: "Hello." },
    ]);
    expect(text).toBe("ASSISTANT: Hi.\nMEMBER: Hello.");
  });
});
