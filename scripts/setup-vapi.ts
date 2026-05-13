import "dotenv/config";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { env } from "../src/env";
import { createAssistant, updateAssistant } from "../src/vapi/client";
import { nurseCallbackToolDefinition } from "../src/vapi/tools";
import { systemPromptText } from "../src/prompts/load-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");

main().catch((err) => {
  console.error("setup-vapi failed", err);
  process.exit(1);
});

async function main() {
  const serverUrl = resolveServerUrl();
  const input = {
    name: "Optum Member Outreach",
    systemPrompt: systemPromptText(),
    firstMessage:
      "Hi, I'm an AI assistant from the Optum care team calling for a brief wellness check-in. This call may be recorded for quality and care coordination. Is now a good time?",
    model: env().OPENAI_ASSISTANT_MODEL,
    toolDefinitions: [nurseCallbackToolDefinition()],
    serverUrl,
    serverSecret: env().VAPI_WEBHOOK_SECRET,
    voiceName: env().VAPI_VOICE_NAME,
  };

  console.log(`Pushing assistant. Server URL: ${serverUrl}`);
  console.log(`Voice: ${env().VAPI_VOICE_NAME}`);

  const existingId = env().VAPI_ASSISTANT_ID;
  const result = existingId
    ? await updateAssistant(existingId, input)
    : await createAssistant(input);

  console.log(`Assistant ${existingId ? "updated" : "created"}: ${result.id}`);
  if (!existingId) {
    upsertEnvVar("VAPI_ASSISTANT_ID", result.id);
    console.log("Wrote VAPI_ASSISTANT_ID to .env");
  }
}

function resolveServerUrl(): string {
  const ngrok = env().NGROK_URL;
  const base = ngrok ?? env().PUBLIC_API_URL;
  return `${stripTrailingSlash(base)}/api/webhooks/vapi`;
}

function stripTrailingSlash(value: string): string {
  if (value.endsWith("/")) return value.slice(0, -1);
  return value;
}

function upsertEnvVar(key: string, value: string) {
  const line = `${key}=${value}`;
  if (!existsSync(ENV_PATH)) {
    writeFileSync(ENV_PATH, `${line}\n`);
    return;
  }
  const current = readFileSync(ENV_PATH, "utf8");
  const replaced = replaceOrAppend(current, key, line);
  writeFileSync(ENV_PATH, replaced);
}

function replaceOrAppend(content: string, key: string, line: string): string {
  const pattern = new RegExp(`^${escapeRegex(key)}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }
  if (content.endsWith("\n")) return `${content}${line}\n`;
  return `${content}\n${line}\n`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
