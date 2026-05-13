import { describe, it, expect } from "vitest";
import { parseVapiWebhook } from "@/vapi/webhook-parsing";

describe("parseVapiWebhook", () => {
  it("reads callId from message.call.id (current Vapi shape)", () => {
    const result = parseVapiWebhook({
      message: {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "I haven't been getting my GLP-1 lately.",
        call: { id: "call_nested" },
      },
    });

    expect(result.kind).toBe("transcript");
    if (result.kind === "transcript") {
      expect(result.callId).toBe("call_nested");
    }
  });

  it("falls back to top-level call.id when present", () => {
    const result = parseVapiWebhook({
      message: {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "hi",
      },
      call: { id: "call_top" },
    });

    expect(result.kind).toBe("transcript");
    if (result.kind === "transcript") {
      expect(result.callId).toBe("call_top");
    }
  });

  it("ignores partial transcripts", () => {
    const result = parseVapiWebhook({
      message: {
        type: "transcript",
        transcriptType: "partial",
        role: "user",
        transcript: "I haven't been",
        call: { id: "call_abc" },
      },
    });
    expect(result.kind).toBe("ignored");
    if (result.kind === "ignored") {
      expect(result.reason).toBe("partial_transcript");
    }
  });

  it("normalizes the bot role to assistant", () => {
    const result = parseVapiWebhook({
      message: {
        type: "transcript",
        transcriptType: "final",
        role: "bot",
        transcript: "Thanks for sharing.",
        call: { id: "call_abc" },
      },
    });
    expect(result.kind).toBe("transcript");
    if (result.kind === "transcript") {
      expect(result.role).toBe("assistant");
    }
  });

  it("classifies end-of-call-report", () => {
    const result = parseVapiWebhook({
      message: {
        type: "end-of-call-report",
        recordingUrl: "https://example.com/recording.mp3",
        summary: "Member raised GLP-1 cost barrier.",
        call: { id: "call_xyz" },
      },
    });
    expect(result).toMatchObject({
      kind: "end_of_call",
      callId: "call_xyz",
      recordingUrl: "https://example.com/recording.mp3",
      summary: "Member raised GLP-1 cost barrier.",
    });
  });

  it("classifies tool-call events", () => {
    const result = parseVapiWebhook({
      message: {
        type: "tool-calls",
        toolCallList: [
          {
            function: {
              name: "schedule_nurse_callback",
              arguments: { reason: "cost", topic: "GLP-1 affordability" },
            },
          },
        ],
        call: { id: "call_xyz" },
      },
    });
    expect(result.kind).toBe("tool_call");
    if (result.kind === "tool_call") {
      expect(result.toolName).toBe("schedule_nurse_callback");
      expect(result.arguments).toEqual({ reason: "cost", topic: "GLP-1 affordability" });
    }
  });

  it("returns reason and messageType when an unhandled type comes in", () => {
    const result = parseVapiWebhook({
      message: { type: "status-update", status: "in-progress", call: { id: "call_abc" } },
    });
    expect(result.kind).toBe("ignored");
    if (result.kind === "ignored") {
      expect(result.reason).toBe("unhandled_type");
      expect(result.messageType).toBe("status-update");
    }
  });

  it("ignores unknown payload shapes", () => {
    const result = parseVapiWebhook({ foo: "bar" });
    expect(result.kind).toBe("ignored");
  });

  it("ignores events with no call id anywhere", () => {
    const result = parseVapiWebhook({
      message: {
        type: "transcript",
        transcriptType: "final",
        role: "user",
        transcript: "hi",
      },
    });
    expect(result.kind).toBe("ignored");
    if (result.kind === "ignored") {
      expect(result.reason).toBe("missing_call_id");
    }
  });
});
