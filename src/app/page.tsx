import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-widest text-optum-blue/70">Optum Voice Agent</p>
        <h1 className="text-4xl font-semibold text-optum-blue mt-2">Member outreach console</h1>
        <p className="mt-4 text-slate-600 max-w-prose">
          An AI agent runs the routine wellness questionnaire so nurses can focus on members
          who need them most.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <ConsoleCard
          href="/dialer"
          title="Dialer"
          description="Place an outbound call to a member."
        />
        <ConsoleCard
          href="/worklist"
          title="Worklist"
          description="See members ranked by post-call priority."
        />
        <ConsoleCard
          href="/tickets"
          title="Tickets"
          description="Callback tickets created when a call's triage score crosses the threshold."
        />
      </div>
    </main>
  );
}

type ConsoleCardProps = {
  href: string;
  title: string;
  description: string;
};

function ConsoleCard({ href, title, description }: ConsoleCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-optum-blue/40 hover:shadow-sm transition"
    >
      <h2 className="text-lg font-semibold text-optum-blue">{title}</h2>
      <p className="text-sm text-slate-600 mt-2">{description}</p>
    </Link>
  );
}
