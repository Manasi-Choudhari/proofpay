import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { requirePageSession } from "@/lib/auth";
import { listJobs, listLedger, listMissions } from "@/lib/store";

const usd = (n: number) => `$${n.toFixed(2)}`;

export default async function Dashboard() {
  const { email } = await requirePageSession();
  const jobs = listJobs(email);
  const missions = listMissions(email);
  const ledger = listLedger(email);
  const sum = (type: string) => ledger.filter((l) => l.type === type).reduce((s, l) => s + l.amount, 0);
  const held =
    jobs.filter((j) => j.status === "funded").reduce((s, j) => s + j.total - j.capturedTotal, 0) +
    missions.filter((m) => m.status === "funded" || m.status === "running").reduce((s, m) => s + m.budget - m.spent, 0);

  const stats = [
    { label: "Held in PayPal escrow", value: usd(held), tone: "text-sky-300" },
    { label: "Released after AI verification", value: usd(sum("Capture")), tone: "text-emerald-300" },
    { label: "Refused (junk work, $0 paid)", value: usd(sum("Refused")), tone: "text-rose-300" },
    { label: "Voided back to payers", value: usd(sum("Void")), tone: "text-amber-300" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Every dollar here was held, verified and released by AI through PayPal.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Link href="/app/jobs" className="card !p-6 hover:border-sky-400/40 transition group">
          <div className="text-xs font-mono text-sky-300">HUMAN WORK</div>
          <div className="mt-2 text-xl font-semibold">Post a freelance job into escrow →</div>
          <p className="mt-2 text-sm text-slate-400">AI drafts milestones, PayPal holds the money, and the verifier releases it when the work is proven.</p>
        </Link>
        <Link href="/app/missions" className="card !p-6 hover:border-sky-400/40 transition border-sky-400/20">
          <div className="text-xs font-mono text-sky-300">AGENT-TO-AGENT</div>
          <div className="mt-2 text-xl font-semibold">Launch an agent mission with a budget →</div>
          <p className="mt-2 text-sm text-slate-400">Your buyer agent hires marketplace agents and pays per verified task, never for junk.</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="font-semibold">Recent jobs</h2>
          {jobs.length === 0 && <p className="text-sm text-slate-500">No jobs yet.</p>}
          {jobs.slice(0, 5).map((j) => (
            <Link key={j.id} href={`/app/jobs/${j.id}`} className="card !p-4 flex items-center justify-between gap-3 hover:border-sky-400/40">
              <div className="min-w-0">
                <div className="font-medium truncate">{j.title}</div>
                <div className="text-xs text-slate-400">{usd(j.capturedTotal)} released of {usd(j.total)}</div>
              </div>
              <StatusBadge status={j.status} />
            </Link>
          ))}
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold">Recent missions</h2>
          {missions.length === 0 && <p className="text-sm text-slate-500">No missions yet.</p>}
          {missions.slice(0, 5).map((m) => (
            <Link key={m.id} href={`/app/missions/${m.id}`} className="card !p-4 flex items-center justify-between gap-3 hover:border-sky-400/40">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.title}</div>
                <div className="text-xs text-slate-400">{usd(m.spent)} spent of {usd(m.budget)} cap</div>
              </div>
              <StatusBadge status={m.status} />
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
