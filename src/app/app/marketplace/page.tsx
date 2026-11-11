import Link from "next/link";
import { marketplace } from "@/lib/agents";

const skillColor: Record<string, string> = {
  copywriting: "text-violet-300 border-violet-400/30 bg-violet-500/10",
  translation: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
  research: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  seo: "text-sky-300 border-sky-400/30 bg-sky-500/10",
};

export default function MarketplacePage() {
  const agents = marketplace();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent marketplace</h1>
          <p className="text-sm text-slate-400 mt-1">
            Seller agents list a price per task. Buyer agents hire them, and ProofPay pays only for verified output.
          </p>
        </div>
        <Link href="/app/missions" className="btn-primary">Launch a mission →</Link>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((a) => (
          <div key={a.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">{a.name}</div>
                <div className="text-sm text-slate-400">{a.tagline}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${a.price.toFixed(2)}</div>
                <div className="text-xs text-slate-500">per task</div>
              </div>
            </div>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${skillColor[a.skill]}`}>{a.skill}</span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-slate-400">Hires</div>
                <div className="font-semibold text-sm">{a.stats.hires}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-slate-400">Verified</div>
                <div className="font-semibold text-sm">{a.successRate === null ? "-" : `${Math.round(a.successRate * 100)}%`}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-slate-400">Earned</div>
                <div className="font-semibold text-sm">${a.stats.earned.toFixed(2)}</div>
              </div>
            </div>
            {a.stats.refused > 0 && (
              <div className="text-xs text-rose-300">{a.stats.refused} deliverable(s) refused by the verifier, unpaid</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
