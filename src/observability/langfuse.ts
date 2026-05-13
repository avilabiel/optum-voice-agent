import { Langfuse } from "langfuse";
import { env } from "@/env";

let client: Langfuse | null = null;

function isEnabled(): boolean {
  const e = env();
  return Boolean(e.LANGFUSE_PUBLIC_KEY && e.LANGFUSE_SECRET_KEY);
}

export function langfuse(): Langfuse | null {
  if (!isEnabled()) return null;
  if (client) return client;
  const e = env();
  client = new Langfuse({
    publicKey: e.LANGFUSE_PUBLIC_KEY,
    secretKey: e.LANGFUSE_SECRET_KEY,
    baseUrl: e.LANGFUSE_HOST,
  });
  return client;
}

export type TraceContext = {
  name: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
};

export type GenerationInput = {
  trace: TraceContext;
  name: string;
  model: string;
  input: unknown;
  output: unknown;
  metadata?: Record<string, unknown>;
};

export async function recordGeneration(g: GenerationInput): Promise<void> {
  const lf = langfuse();
  if (!lf) return;

  const trace = lf.trace({
    name: g.trace.name,
    sessionId: g.trace.sessionId,
    userId: g.trace.userId,
    metadata: g.trace.metadata,
  });

  trace.generation({
    name: g.name,
    model: g.model,
    input: g.input,
    output: g.output,
    metadata: g.metadata,
  });

  await lf.flushAsync();
}
