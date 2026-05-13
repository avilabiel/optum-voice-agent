import { env } from "@/env";

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isSecretValid(headerValue: string | null, expected: string): boolean {
  if (!headerValue) return false;
  return constantTimeEqual(headerValue, expected);
}

export function verifyWebhookSecret(headerValue: string | null): boolean {
  return isSecretValid(headerValue, env().VAPI_WEBHOOK_SECRET);
}
