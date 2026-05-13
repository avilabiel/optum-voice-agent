"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchMembers } from "@/lib/api-client";
import { formatRelativeTime, formatScore, isHighPriority } from "@/lib/format";
import type { MemberDto } from "@/lib/types";

export default function WorklistPage() {
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMembers();
      setMembers(list);
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
    <main className="max-w-5xl mx-auto px-6 py-12">
      <PageHeader onRefresh={refresh} loading={loading} />
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <WorklistTable members={members} />
    </main>
  );
}

function PageHeader({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <header className="mb-6 flex items-end justify-between">
      <div>
        <Link href="/" className="text-xs text-slate-500 hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-optum-blue mt-2">Nurse worklist</h1>
        <p className="text-sm text-slate-600 mt-1">
          Members ranked by post-call priority. Refresh after a call ends.
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

function WorklistTable({ members }: { members: MemberDto[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-slate-500">No members yet. Run the seed script.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <Th>#</Th>
            <Th>Member</Th>
            <Th>ID</Th>
            <Th>Score</Th>
            <Th>Rationale</Th>
            <Th>Flags</Th>
            <Th>Last call</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m, index) => (
            <WorklistRow key={m.id} member={m} rank={index + 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorklistRow({ member, rank }: { member: MemberDto; rank: number }) {
  const highlight = isHighPriority(member.priorityScore);
  const rowClass = rowClassForHighlight(highlight);

  return (
    <tr className={rowClass}>
      <Td>{rank}</Td>
      <Td className="font-medium">
        {member.firstName} {member.lastName}
      </Td>
      <Td className="text-slate-500">{member.externalId}</Td>
      <Td>
        <ScoreBadge score={member.priorityScore} highlight={highlight} />
      </Td>
      <Td className="max-w-md whitespace-normal text-slate-700">{member.priorityRationale ?? "—"}</Td>
      <Td>
        <FlagList flags={member.flags} />
      </Td>
      <Td className="text-slate-500">{formatRelativeTime(member.lastCallAt)}</Td>
    </tr>
  );
}

function rowClassForHighlight(highlight: boolean): string {
  if (highlight) return "bg-optum-orange/10";
  return "";
}

function ScoreBadge({ score, highlight }: { score: number; highlight: boolean }) {
  const badgeClass = highlight
    ? "bg-optum-orange/20 text-optum-orange"
    : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
      {formatScore(score)}
    </span>
  );
}

function FlagList({ flags }: { flags: string[] }) {
  if (flags.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <span
          key={f}
          className="inline-block rounded-md bg-optum-blue/10 text-optum-blue px-2 py-0.5 text-xs"
        >
          {f}
        </span>
      ))}
    </div>
  );
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
