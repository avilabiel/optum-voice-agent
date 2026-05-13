import { EventSchemas, Inngest } from "inngest";
import { z } from "zod";

const callCompletedData = z.object({
  sessionId: z.string().uuid(),
  memberId: z.string().uuid(),
  vapiCallId: z.string(),
});

const events = {
  "call.completed": { data: callCompletedData },
};

export const inngest = new Inngest({
  id: "optum-voice-agent",
  schemas: new EventSchemas().fromZod(events),
});

export type CallCompletedPayload = z.infer<typeof callCompletedData>;
