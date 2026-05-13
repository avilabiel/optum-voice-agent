import { NextResponse } from "next/server";
import { parseVapiWebhook } from "@/vapi/webhook-parsing";
import { verifyWebhookSecret } from "@/vapi/signature";
import { handleParsedWebhook } from "@/server/recorder";
import { log } from "@/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const headerSecret = req.headers.get("x-vapi-secret");
  if (!verifyWebhookSecret(headerSecret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await readJson(req);
  if (!body) {
    return NextResponse.json({ ok: true, ignored: "non-json" });
  }

  const parsed = parseVapiWebhook(body);
  log.info("vapi webhook received", { kind: parsed.kind, ...summarizeParsed(parsed) });

  try {
    await handleParsedWebhook(parsed);
  } catch (err) {
    log.error("vapi webhook handler failed", {
      error: (err as Error).message,
      kind: parsed.kind,
    });
  }

  return NextResponse.json({ ok: true });
}

function summarizeParsed(parsed: ReturnType<typeof parseVapiWebhook>): Record<string, unknown> {
  if (parsed.kind === "ignored") {
    return { reason: parsed.reason, messageType: parsed.messageType };
  }
  if (parsed.kind === "transcript") {
    return { role: parsed.role, callId: parsed.callId };
  }
  if (parsed.kind === "end_of_call") {
    return { callId: parsed.callId };
  }
  return { callId: parsed.callId, toolName: parsed.toolName };
}

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
