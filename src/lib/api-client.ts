import type { MemberDto, TicketDto } from "./types";

type MembersResponse = { ok: boolean; members: MemberDto[] };

export async function fetchMembers(): Promise<MemberDto[]> {
  const res = await fetch("/api/members", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load members: ${res.status}`);
  }
  const json = (await res.json()) as MembersResponse;
  return json.members;
}

type TicketsResponse = { ok: boolean; tickets: TicketDto[] };

export async function fetchTickets(): Promise<TicketDto[]> {
  const res = await fetch("/api/tickets", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load tickets: ${res.status}`);
  }
  const json = (await res.json()) as TicketsResponse;
  return json.tickets;
}

type PlaceCallResponse = { ok: boolean; callId?: string; error?: string; message?: string };

export async function placeCall(input: { memberId: string; phoneNumber: string }): Promise<PlaceCallResponse> {
  const res = await fetch("/api/calls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as PlaceCallResponse;
  return json;
}
