import { env } from "@/env";
import { DEFAULT_VOICE_SETTINGS, VOICE_FORMAT_PLAN, voiceIdFor, type VoiceName } from "./voices";

const VAPI_BASE = "https://api.vapi.ai";

type PlaceCallInput = {
  assistantId: string;
  phoneNumberId: string;
  customerNumber: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
};

type PlaceCallResponse = {
  id: string;
  status?: string;
};

export async function placeOutboundCall(input: PlaceCallInput): Promise<PlaceCallResponse> {
  const body = {
    assistantId: input.assistantId,
    phoneNumberId: input.phoneNumberId,
    customer: {
      number: input.customerNumber,
      name: input.customerName,
    },
    metadata: input.metadata,
  };

  const res = await callVapi("/call", "POST", body);
  return res as PlaceCallResponse;
}

type UpsertAssistantInput = {
  name: string;
  systemPrompt: string;
  firstMessage: string;
  model: string;
  toolDefinitions: Record<string, unknown>[];
  serverUrl: string;
  serverSecret: string;
  voiceName: VoiceName;
};

export async function createAssistant(input: UpsertAssistantInput): Promise<{ id: string }> {
  const body = buildAssistantBody(input);
  const res = await callVapi("/assistant", "POST", body);
  return res as { id: string };
}

export async function updateAssistant(
  assistantId: string,
  input: UpsertAssistantInput,
): Promise<{ id: string }> {
  const body = buildAssistantBody(input);
  const res = await callVapi(`/assistant/${assistantId}`, "PATCH", body);
  return res as { id: string };
}

function buildAssistantBody(input: UpsertAssistantInput) {
  return {
    name: input.name,
    firstMessage: input.firstMessage,
    endCallFunctionEnabled: true,
    silenceTimeoutSeconds: 30,
    responseDelaySeconds: 0.6,
    model: {
      provider: "openai",
      model: input.model,
      messages: [{ role: "system", content: input.systemPrompt }],
      tools: input.toolDefinitions,
    },
    voice: {
      provider: "11labs",
      voiceId: voiceIdFor(input.voiceName),
      ...DEFAULT_VOICE_SETTINGS,
      chunkPlan: {
        enabled: true,
        formatPlan: VOICE_FORMAT_PLAN,
      },
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    server: { url: input.serverUrl, secret: input.serverSecret },
    serverMessages: ["transcript", "end-of-call-report", "tool-calls", "status-update"],
  };
}

async function callVapi(path: string, method: "GET" | "POST" | "PATCH", body?: unknown) {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env().VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi ${method} ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}
