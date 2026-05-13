import { NextResponse } from "next/server";
import { env } from "@/env";
import { findOrCreateTenant, listOpenTickets, type TicketWithMember } from "@/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tenantId = await findOrCreateTenant(env().DEMO_TENANT_NAME);
  const tickets = await listOpenTickets(tenantId);
  return NextResponse.json({ ok: true, tickets: tickets.map(toDto) });
}

function toDto(ticket: TicketWithMember) {
  return {
    id: ticket.id,
    memberFirstName: ticket.memberFirstName,
    memberLastName: ticket.memberLastName,
    memberExternalId: ticket.memberExternalId,
    topic: ticket.topic,
    reason: ticket.reason,
    origin: ticket.origin,
    status: ticket.status,
    slaTier: ticket.slaTier,
    dueAt: ticket.dueAt ? ticket.dueAt.toISOString() : null,
    priorityScore: ticket.priorityScore !== null ? Number(ticket.priorityScore) : null,
    createdAt: ticket.createdAt.toISOString(),
  };
}
