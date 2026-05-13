import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { findMemberById } from "@/db/queries";
import { placeOutboundCall } from "@/vapi/client";
import { ensureSessionForOutboundCall } from "@/server/recorder";
import { phonesMatch } from "@/lib/phone";
import { log } from "@/observability/logger";

const bodySchema = z.object({
  memberId: z.string().uuid(),
  phoneNumber: z.string().min(5),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const member = await findMemberById(parsed.data.memberId);
  if (!member) {
    return NextResponse.json({ ok: false, error: "member_not_found" }, { status: 404 });
  }

  if (!phonesMatch(member.phone, parsed.data.phoneNumber)) {
    log.warn("call refused: destination does not match member on-file phone", {
      memberId: member.id,
    });
    return NextResponse.json(
      { ok: false, error: "destination_not_allowed" },
      { status: 403 },
    );
  }

  const assistantId = env().VAPI_ASSISTANT_ID;
  if (!assistantId) {
    return NextResponse.json(
      { ok: false, error: "assistant_not_configured. Run setup-vapi." },
      { status: 500 },
    );
  }

  try {
    const call = await placeOutboundCall({
      assistantId,
      phoneNumberId: env().VAPI_PHONE_NUMBER_ID,
      customerNumber: parsed.data.phoneNumber,
      customerName: `${member.firstName} ${member.lastName}`,
      metadata: { memberId: member.id },
    });

    await ensureSessionForOutboundCall({
      vapiCallId: call.id,
      memberId: member.id,
    });

    log.info("call placed", { vapiCallId: call.id, memberId: member.id });
    return NextResponse.json({ ok: true, callId: call.id });
  } catch (err) {
    log.error("failed to place call", { error: (err as Error).message });
    return NextResponse.json(
      { ok: false, error: "vapi_call_failed", message: (err as Error).message },
      { status: 502 },
    );
  }
}
