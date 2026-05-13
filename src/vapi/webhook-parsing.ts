import { z } from "zod";

export type ParsedWebhook =
  | { kind: "transcript"; role: "assistant" | "user"; text: string; callId: string }
  | { kind: "end_of_call"; callId: string; recordingUrl: string | null; summary: string | null }
  | { kind: "tool_call"; callId: string; toolName: string; arguments: Record<string, unknown> }
  | { kind: "ignored"; reason: string; messageType: string | null };

const callRefSchema = z.object({ id: z.string() }).passthrough();

const messageSchema = z
  .object({
    type: z.string(),
    call: callRefSchema.optional(),
    transcriptType: z.string().optional(),
    role: z.string().optional(),
    transcript: z.string().optional(),
    recordingUrl: z.string().optional(),
    summary: z.string().optional(),
    toolCallList: z.array(z.unknown()).optional(),
    toolCalls: z.array(z.unknown()).optional(),
  })
  .passthrough();

const envelopeSchema = z
  .object({
    message: messageSchema,
    call: callRefSchema.optional(),
  })
  .passthrough();

type Envelope = z.infer<typeof envelopeSchema>;
type Message = z.infer<typeof messageSchema>;

export function parseVapiWebhook(payload: unknown): ParsedWebhook {
  const envelope = envelopeSchema.safeParse(payload);
  if (!envelope.success) {
    return { kind: "ignored", reason: "schema_mismatch", messageType: null };
  }

  const message = envelope.data.message;
  const callId = resolveCallId(envelope.data);
  if (!callId) {
    return { kind: "ignored", reason: "missing_call_id", messageType: message.type };
  }

  return classify(message, callId);
}

function resolveCallId(envelope: Envelope): string | null {
  return envelope.message.call?.id ?? envelope.call?.id ?? null;
}

function classify(message: Message, callId: string): ParsedWebhook {
  if (message.type === "transcript") return classifyTranscript(message, callId);
  if (message.type === "end-of-call-report") return classifyEndOfCall(message, callId);
  if (message.type === "tool-calls") return classifyToolCalls(message, callId);
  return { kind: "ignored", reason: "unhandled_type", messageType: message.type };
}

function classifyTranscript(message: Message, callId: string): ParsedWebhook {
  if (message.transcriptType && message.transcriptType !== "final") {
    return { kind: "ignored", reason: "partial_transcript", messageType: message.type };
  }
  const role = normalizeRole(message.role);
  if (!role) {
    return { kind: "ignored", reason: "unknown_role", messageType: message.type };
  }
  const text = (message.transcript ?? "").trim();
  if (text.length === 0) {
    return { kind: "ignored", reason: "empty_transcript", messageType: message.type };
  }
  return { kind: "transcript", role, text, callId };
}

function classifyEndOfCall(message: Message, callId: string): ParsedWebhook {
  return {
    kind: "end_of_call",
    callId,
    recordingUrl: message.recordingUrl ?? null,
    summary: message.summary ?? null,
  };
}

function classifyToolCalls(message: Message, callId: string): ParsedWebhook {
  const list = (message.toolCallList ?? message.toolCalls ?? []) as Array<{
    function?: { name?: string; arguments?: Record<string, unknown> };
  }>;
  const first = list[0];
  if (!first?.function?.name) {
    return { kind: "ignored", reason: "empty_tool_call_list", messageType: message.type };
  }
  return {
    kind: "tool_call",
    callId,
    toolName: first.function.name,
    arguments: first.function.arguments ?? {},
  };
}

function normalizeRole(role: string | undefined): "assistant" | "user" | null {
  if (role === "assistant" || role === "bot") return "assistant";
  if (role === "user") return "user";
  return null;
}
