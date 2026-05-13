import { NextResponse } from "next/server";
import { env } from "@/env";
import { findOrCreateTenant, listMembersByPriority } from "@/db/queries";
import type { Member } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tenantId = await findOrCreateTenant(env().DEMO_TENANT_NAME);
  const members = await listMembersByPriority(tenantId);
  return NextResponse.json({ ok: true, members: members.map(toDto) });
}

function toDto(m: Member) {
  return {
    id: m.id,
    externalId: m.externalId,
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.phone,
    priorityScore: Number(m.priorityScore),
    priorityRationale: m.priorityRationale,
    flags: m.flags,
    lastCallAt: m.lastCallAt?.toISOString() ?? null,
  };
}
