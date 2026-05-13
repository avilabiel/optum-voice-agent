import { z } from "zod";

const role = z.enum(["assistant", "user", "system", "bot"]);

const transcriptMessage = z.object({
  role,
  message: z.string().optional(),
  text: z.string().optional(),
  time: z.number().optional(),
});

const transcriptEvent = z.object({
  type: z.literal("transcript"),
  transcriptType: z.enum(["partial", "final"]).optional(),
  role,
  transcript: z.string(),
});

const speechUpdateEvent = z.object({
  type: z.literal("speech-update"),
  status: z.string(),
  role: role.optional(),
});

const statusUpdateEvent = z.object({
  type: z.literal("status-update"),
  status: z.string(),
});

const endOfCallReportEvent = z.object({
  type: z.literal("end-of-call-report"),
  endedReason: z.string().optional(),
  recordingUrl: z.string().url().optional(),
  summary: z.string().optional(),
  transcript: z.string().optional(),
  messages: z.array(transcriptMessage).optional(),
});

const toolCallFunction = z.object({
  name: z.string(),
  arguments: z.record(z.unknown()),
});

const toolCall = z.object({
  id: z.string().optional(),
  type: z.literal("function").optional(),
  function: toolCallFunction,
});

const toolCallsEvent = z.object({
  type: z.literal("tool-calls"),
  toolCallList: z.array(toolCall).optional(),
  toolCalls: z.array(toolCall).optional(),
});

const messageVariants = z.discriminatedUnion("type", [
  transcriptEvent,
  speechUpdateEvent,
  statusUpdateEvent,
  endOfCallReportEvent,
  toolCallsEvent,
]);

const callRef = z.object({
  id: z.string(),
  assistantId: z.string().optional(),
  customer: z
    .object({
      number: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

export const vapiWebhookSchema = z.object({
  message: messageVariants,
  call: callRef.optional(),
});

export type VapiWebhook = z.infer<typeof vapiWebhookSchema>;
export type VapiMessage = z.infer<typeof messageVariants>;
export type VapiTranscriptEvent = z.infer<typeof transcriptEvent>;
export type VapiEndOfCallEvent = z.infer<typeof endOfCallReportEvent>;
export type VapiToolCallsEvent = z.infer<typeof toolCallsEvent>;
export type VapiToolCall = z.infer<typeof toolCall>;
