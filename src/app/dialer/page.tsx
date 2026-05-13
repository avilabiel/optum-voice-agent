"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMembers, placeCall } from "@/lib/api-client";
import type { MemberDto } from "@/lib/types";

type CallStatus =
  | { kind: "idle" }
  | { kind: "calling" }
  | { kind: "placed"; callId: string; name: string; phone: string }
  | { kind: "error"; message: string };

export default function DialerPage() {
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [status, setStatus] = useState<CallStatus>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    fetchMembers()
      .then((list) => {
        if (cancelled) return;
        setMembers(list);
        const preferred = pickPreferredMember(list);
        if (preferred) {
          setSelectedMemberId(preferred.id);
          setPhoneNumber(preferred.phone);
        }
      })
      .catch((err) => {
        setStatus({ kind: "error", message: (err as Error).message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onMemberChange(memberId: string) {
    setSelectedMemberId(memberId);
    const found = members.find((m) => m.id === memberId);
    if (found) setPhoneNumber(found.phone);
  }

  async function onPlaceCall() {
    if (!selectedMemberId || !phoneNumber) return;
    setStatus({ kind: "calling" });
    const result = await placeCall({ memberId: selectedMemberId, phoneNumber });
    if (!result.ok || !result.callId) {
      setStatus({ kind: "error", message: result.message ?? result.error ?? "Unknown error" });
      return;
    }
    const member = members.find((m) => m.id === selectedMemberId);
    const name = member ? `${member.firstName} ${member.lastName}` : "member";
    setStatus({ kind: "placed", callId: result.callId, name, phone: phoneNumber });
  }

  const buttonDisabled = status.kind === "calling" || !selectedMemberId || !phoneNumber;

  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <PageHeader />
      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <FieldLabel label="Member">
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={selectedMemberId}
            onChange={(e) => onMemberChange(e.target.value)}
          >
            <option value="">Select a member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </FieldLabel>

        <FieldLabel label="Phone number">
          <input
            type="tel"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+15555550123"
          />
        </FieldLabel>

        <button
          type="button"
          onClick={onPlaceCall}
          disabled={buttonDisabled}
          className="w-full rounded-md bg-optum-blue text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-optum-blue/90"
        >
          {status.kind === "calling" ? "Placing call…" : "Place call"}
        </button>

        <StatusMessage status={status} />
      </section>
    </main>
  );
}

function PageHeader() {
  return (
    <header className="mb-8">
      <Link href="/" className="text-xs text-slate-500 hover:underline">
        ← Home
      </Link>
      <h1 className="text-2xl font-semibold text-optum-blue mt-2">Dialer</h1>
      <p className="text-sm text-slate-600 mt-1">Place an outbound call. Vapi handles the conversation.</p>
    </header>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function StatusMessage({ status }: { status: CallStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "calling") {
    return <p className="text-sm text-slate-600">Placing call…</p>;
  }
  if (status.kind === "placed") {
    return (
      <p className="text-sm text-emerald-700">
        Calling {status.name} at {status.phone} — call id <code>{status.callId}</code>
      </p>
    );
  }
  return <p className="text-sm text-red-600">{status.message}</p>;
}

function pickPreferredMember(members: MemberDto[]): MemberDto | undefined {
  const gabriel = members.find((m) => m.firstName === "Gabriel" && m.lastName === "Avila");
  if (gabriel) return gabriel;
  return members[0];
}
