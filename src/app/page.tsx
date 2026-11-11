import Link from "next/link";
import Logo from "@/components/Logo";
import { getSession } from "@/lib/auth";

const pillars = [
  {
    title: "Held, not charged",
    body: "Funds are authorized with PayPal and stay on the payer's account until the work is proven.",
    icon: "🔒",
  },
  {
    title: "Verified by AI",
    body: "A verification agent checks every acceptance criterion against the actual deliverable and cites evidence.",
    icon: "🧠",
  },
  {
    title: "Released by the agent",
    body: "When the work passes, the agent captures payment through PayPal. When it fails, nobody pays.",
    icon: "⚡",
  },
];

const guarantees = [
  ["Never pays for junk", "Every deliverable is verified before a single cent is captured."],
  ["Never pays twice", "Each payment carries a PayPal idempotency key tied to the task."],
  ["Never overspends", "Spending is capped by the PayPal authorization the human approved."],
  ["Never over the listed price", "Guardrails reject any quote above the seller's listed price."],
  ["Human in the loop", "Low-confidence verdicts go to the owner for one-click approval."],
  ["Unused money returns", "Unspent budget is voided on PayPal, never charged."],
];

const stack = ["PayPal Orders v2", "PayPal Payments (authorize · capture · void)", "PayPal JS SDK", "PayPal Payouts", "Groq", "Google Gemini", "AG Grid", "Render"];

export default async function Landing() {
  const session = await getSession();
  const cta = session ? "/app" : "/login";
  return (
    <div className="flex-1">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <a href="#how" className="hover:text-white hidden sm:block">How it works</a>
            <a href="#modes" className="hover:text-white hidden sm:block">Humans &amp; agents</a>
            <a href="#trust" className="hover:text-white hidden sm:block">Guarantees</a>
            <Link href={cta} className="btn-primary">
              {session ? "Open app" : "Sign in"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.18),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center space-y-7">
          <p className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-300">
            Agentic commerce on PayPal · AI escrow
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Pay only for <span className="text-sky-400">proven work</span>, whether it&apos;s done by humans or AI agents.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            ProofPay holds money in PayPal, lets an AI agent verify the deliverable against the contract, and releases
            payment automatically, with guardrails, human override and a full audit trail.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={cta} className="btn-primary !px-6 !py-3 !text-base">Get started free →</Link>
            <a href="#how" className="btn-ghost !px-6 !py-3 !text-base">See how it works</a>
          </div>
          <p className="text-xs text-slate-500">Runs on the PayPal sandbox. No real money moves.</p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-3 gap-4">
        {pillars.map((p) => (
          <div key={p.title} className="card !p-6">
            <div className="text-2xl">{p.icon}</div>
            <div className="mt-3 font-semibold text-lg">{p.title}</div>
            <p className="mt-2 text-sm text-slate-400">{p.body}</p>
          </div>
        ))}
      </section>

      <section id="modes" className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-2 gap-6">
        <div className="card !p-7 space-y-4">
          <div className="text-xs font-mono text-sky-300">MODE 1 · HUMAN WORK</div>
          <h2 className="text-2xl font-semibold">Freelance escrow that releases itself</h2>
          <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
            <li>Describe the job; AI drafts milestones with verifiable acceptance criteria.</li>
            <li>The client funds escrow with PayPal, so the money is authorized but not charged.</li>
            <li>The freelancer submits a link, notes or a screenshot.</li>
            <li>AI verifies each criterion; PayPal captures the milestone, or the freelancer gets precise feedback.</li>
          </ol>
          <p className="text-sm text-slate-400">For freelancers who chase late or missing payments, and clients who&apos;ve paid for work that never came.</p>
        </div>
        <div className="card !p-7 space-y-4 border-sky-400/30">
          <div className="text-xs font-mono text-sky-300">MODE 2 · AGENT-TO-AGENT COMMERCE</div>
          <h2 className="text-2xl font-semibold">Give an AI agent a budget, not a blank cheque</h2>
          <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
            <li>A human authorizes a spending cap once with PayPal.</li>
            <li>The buyer agent plans the mission and hires seller agents from the marketplace.</li>
            <li>Every deliverable is verified. Good work is paid per task via PayPal capture; junk is refused and the agent re-hires.</li>
            <li>Unspent budget is voided automatically.</li>
          </ol>
          <p className="text-sm text-slate-400">The trust layer AI agents need before they can spend money on our behalf.</p>
        </div>
      </section>

      <section id="trust" className="mx-auto max-w-6xl px-6 py-16 space-y-6">
        <h2 className="text-3xl font-semibold tracking-tight text-center">Guarantees enforced in code, not just prompts</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guarantees.map(([t, b]) => (
            <div key={t} className="card">
              <div className="font-medium flex items-center gap-2">
                <span className="text-emerald-400">✓</span> {t}
              </div>
              <p className="mt-1.5 text-sm text-slate-400">{b}</p>
            </div>
          ))}
        </div>
        <div className="card text-sm text-slate-300 flex flex-wrap gap-x-8 gap-y-2 justify-center">
          <span>🔐 Email OTP sign-in · signed httpOnly sessions</span>
          <span>🛡️ Prompt-injection-hardened verifier</span>
          <span>🧾 Every PayPal ID in an exportable ledger</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center space-y-4">
        <div className="text-xs uppercase tracking-widest text-slate-500">Built with</div>
        <div className="flex flex-wrap justify-center gap-2">
          {stack.map((s) => (
            <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
              {s}
            </span>
          ))}
        </div>
        <div className="pt-8">
          <Link href={cta} className="btn-primary !px-6 !py-3 !text-base">Try ProofPay →</Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        ProofPay · Built for the PayPal AI Hackathon · MIT licensed
      </footer>
    </div>
  );
}
