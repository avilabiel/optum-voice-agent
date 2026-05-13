import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),

  VAPI_API_KEY: z.string().min(1),
  VAPI_ASSISTANT_ID: z.string().optional(),
  VAPI_PHONE_NUMBER_ID: z.string().min(1),
  VAPI_WEBHOOK_SECRET: z.string().min(1),
  VAPI_VOICE_NAME: z.enum(["jessica", "laura", "eric"]).default("jessica"),

  OPENAI_API_KEY: z.string().min(1),
  OPENAI_ASSISTANT_MODEL: z.string().default("gpt-4o"),
  OPENAI_JUDGE_MODEL: z.string().default("gpt-4o-mini"),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().default("https://cloud.langfuse.com"),

  DEMO_PHONE_NUMBER: z.string().min(1),
  PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
  NGROK_URL: z.string().url().optional(),

  DEMO_TENANT_NAME: z.string().default("Optum"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted, null, 2)}`);
  }
  cached = parsed.data;
  return cached;
}
