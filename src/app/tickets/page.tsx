"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchTickets } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import { ticketHumanLabel, type SlaTier } from "@/domain/sla";
import type { TicketDto } from "@/lib/types";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchTickets();
      setTickets(list);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <PageHeader onRefresh={refresh} loading={loading} count={tickets.length} />
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <TicketsTable tickets={tickets} />
    </main>
  );
}

function PageHeader({
  onRefresh,
  loading,
  count,
}: {
  onRefresh: () => void;
  loading: boolean;
  count: number;
}) {
  return (
    <header className="mb-6 flex items-end justify-between">
      <div>
        <Link href="/" className="text-xs text-slate-500 hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-optum-blue mt-2">Callback tickets</h1>
        <p className="text-sm text-slate-600 mt-1">
          {count} open ticket{count === 1 ? "" : "s"}. Sorted by SLA deadline (soonest first).
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-md bg-optum-blue text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-optum-blue/90"
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </header>
  );
}

function TicketsTable({ tickets }: { tickets: TicketDto[] }) {
  if (tickets.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No open tickets yet. Complete a call with a triage score ≥ 0.50 to see one here.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <Th>Member</Th>
            <Th>Topic</Th>
            <Th>SLA</Th>
            <Th>Due</Th>
            <Th>Priority</Th>
            <Th>Origin</Th>
            <Th>Reason</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: TicketDto }) {
  const isUrgent = ticket.slaTier === "urgent_24h";
  const rowClass = isUrgent ? "bg-optum-orange/10" : "";

  return (
    <tr className={rowClass}>
      <Td className="font-medium">
        {ticket.memberFirstName} {ticket.memberLastName}
        <div className="text-xs text-slate-500">{ticket.memberExternalId}</div>
      </Td>
      <Td>{ticket.topic}</Td>
      <Td>
        <SlaBadge tier={ticket.slaTier} />
      </Td>
      <Td className="text-slate-600">{formatDueAt(ticket.dueAt)}</Td>
      <Td>{ticket.priorityScore !== null ? ticket.priorityScore.toFixed(2) : "—"}</Td>
      <Td>
        <OriginBadge origin={ticket.origin} />
      </Td>
      <Td className="max-w-sm whitespace-normal text-slate-700">{ticket.reason ?? "—"}</Td>
      <Td>
        <ClaimButton ticketId={ticket.id} />
      </Td>
    </tr>
  );
}

function SlaBadge({ tier }: { tier: SlaTier | null }) {
  if (!tier) {
    return <span className="text-slate-400">—</span>;
  }
  const styles = stylesForTier(tier);
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${styles}`}>
      {ticketHumanLabel(tier)}
    </span>
  );
}

function stylesForTier(tier: SlaTier): string {
  if (tier === "urgent_24h") return "bg-optum-orange/20 text-optum-orange";
  if (tier === "priority_72h") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function OriginBadge({ origin }: { origin: TicketDto["origin"] }) {
  const label = origin === "member_requested" ? "Member requested" : "System initiated";
  const styles =
    origin === "member_requested"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-slate-100 text-slate-700";
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs ${styles}`}>{label}</span>;
}

function ClaimButton({ ticketId }: { ticketId: string }) {
  function onClaim() {
    alert(`Claim flow for ticket ${ticketId} is not implemented yet.`);
  }
  return (
    <button
      type="button"
      onClick={onClaim}
      className="rounded-md border border-optum-blue text-optum-blue px-3 py-1 text-xs font-medium hover:bg-optum-blue hover:text-white transition"
    >
      Claim
    </button>
  );
}

function formatDueAt(dueAt: string | null): string {
  if (!dueAt) return "—";
  const due = new Date(dueAt);
  const diffMs = due.getTime() - Date.now();
  if (diffMs < 0) {
    return `Overdue ${formatRelativeTime(dueAt).replace(" ago", "")}`;
  }
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-sm text-slate-800 ${className ?? ""}`}>{children}</td>;
}
