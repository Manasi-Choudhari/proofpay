import Link from "next/link";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";
import EscrowDemo from "@/components/EscrowDemo";
import {
  ArrowIcon,
  BoltIcon,
  BotIcon,
  CheckIcon,
  GithubIcon,
  KeyIcon,
  LockIcon,
  ReceiptIcon,
  ScanIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/Icons";
import { getSession } from "@/lib/auth";

const pillars = [
  {
    step: "01",
    title: "Held, not charged",
    body: "Funds are authorized with PayPal and stay on the payer's account until the work is proven.",
    Icon: LockIcon,
  },
  {
    step: "02",
    title: "Verified by AI",
    body: "A verification agent checks every acceptance criterion against the actual deliverable and cites evidence.",
    Icon: ScanIcon,
  },
  {
    step: "03",
    title: "Released automatically",
    body: "When the work passes, the agent captures payment through PayPal. When it fails, nobody pays.",
    Icon: BoltIcon,
  },
];

const stats = [
  ["5", "PayPal operations"],
  ["$0", "paid for rejected work"],
  ["70%", "minimum AI confidence"],
  ["100%", "of payments audited"],
];

const guarantees = [
  ["Never pays for junk", "Every deliverable is verified before a single cent is captured."],
  ["Never pays twice", "Each payment carries a PayPal idempotency key tied to the task."],
  ["Never overspends", "Spending is capped by the PayPal authorization the human approved."],
  ["Never over the listed price", "Guardrails reject any quote above the seller's listed price."],
  ["Human in the loop", "Low-confidence verdicts go to the owner for one-click approval."],
  ["Unused money returns", "Unspent budget is voided on PayPal, never charged."],
];

const security = [
  { Icon: KeyIcon, text: "Email OTP sign-in with signed httpOnly sessions" },
  { Icon: ShieldIcon, text: "Prompt-injection-hardened verifier" },
  { Icon: ReceiptIcon, text: "Every PayPal ID in an exportable ledger" },
];

const stack = ["PayPal Orders v2", "Authorize · Capture · Void", "PayPal JS SDK", "PayPal Payouts", "Groq", "Google Gemini", "AG Grid", "Render"];

export default async function Landing() {
  const session = await getSession();
  const cta = session ? "/app" : "/login";
  return (
    <div className="flex-1 overflow-x-hidden">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <a href="#how" className="hover:text-white transition hidden sm:block">How it works</a>
            <a href="#modes" className="hover:text-white transition hidden sm:block">Humans &amp; agents</a>
            <a href="#trust" className="hover:text-white transition hidden sm:block">Guarantees</a>
            <Link href={cta} className="btn-primary">
              {session ? "Open app" : "Sign in"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-grid" />
        <div className="glow-blob absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="glow-blob absolute top-40 -right-40 -z-10 h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-3xl [animation-delay:-8s]" />

        <div className="mx-auto max-w-6xl px-6 pt-20 pb-20 grid lg:grid-cols-[1.15fr_1fr] gap-14 items-center">
          <div className="space-y-7 text-center lg:text-left">
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
              </span>
              Agentic commerce on PayPal · AI escrow
            </p>
            <h1 className="animate-fade-up [animation-delay:100ms] text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
              Pay only for <span className="text-shimmer">proven work</span>, whether it&apos;s done by humans or AI agents.
            </h1>
            <p className="animate-fade-up [animation-delay:200ms] text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
              ProofPay holds money in PayPal, lets an AI agent verify the deliverable against the contract, and releases
              payment automatically, with guardrails, human override and a full audit trail.
            </p>
            <div className="animate-fade-up [animation-delay:300ms] flex flex-wrap justify-center lg:justify-start gap-3">
              <Link href={cta} className="btn-primary group !px-6 !py-3 !text-base shadow-lg shadow-sky-500/20">
                Get started free
                <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#how" className="btn-ghost !px-6 !py-3 !text-base">See how it works</a>
            </div>
            <p className="animate-fade-up [animation-delay:400ms] text-xs text-slate-500">Runs on the PayPal sandbox. No real money moves.</p>
          </div>
          <div className="animate-fade-up [animation-delay:350ms]">
            <EscrowDemo />
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(([v, l], i) => (
            <Reveal key={l} delay={i * 80} className="text-center">
              <div className="text-3xl font-semibold tracking-tight">{v}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-20 space-y-10 scroll-mt-16">
        <Reveal className="text-center space-y-3">
          <div className="text-xs uppercase tracking-widest text-sky-300">How it works</div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Money moves only when the work is proven</h2>
        </Reveal>
        <div className="relative grid md:grid-cols-3 gap-4">
          <div className="absolute top-12 left-[16%] right-[16%] hidden md:block h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />
          {pillars.map(({ step, title, body, Icon }, i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="card lift relative !p-6 h-full">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-slate-600">{step}</span>
                </div>
                <div className="mt-4 font-semibold text-lg">{title}</div>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="modes" className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-2 gap-6 scroll-mt-16">
        <Reveal>
          <div className="card lift !p-7 space-y-4 h-full">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-200"><UserIcon /></div>
              <div className="text-xs font-mono text-sky-300">MODE 1 · HUMAN WORK</div>
            </div>
            <h2 className="text-2xl font-semibold">Freelance escrow that releases itself</h2>
            <ol className="space-y-3 text-sm text-slate-300">
              {[
                "Describe the job; AI drafts milestones with verifiable acceptance criteria.",
                "The client funds escrow with PayPal, so the money is authorized but not charged.",
                "The freelancer submits a link, notes or a screenshot.",
                "AI verifies each criterion; PayPal captures the milestone, or the freelancer gets precise feedback.",
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/15 font-mono text-[10px] text-slate-400">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
            <p className="text-sm text-slate-400">For freelancers who chase late or missing payments, and clients who&apos;ve paid for work that never came.</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card lift !p-7 space-y-4 h-full !border-sky-400/30 bg-gradient-to-b from-sky-400/[0.06] to-transparent">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><BotIcon /></div>
              <div className="text-xs font-mono text-sky-300">MODE 2 · AGENT-TO-AGENT COMMERCE</div>
            </div>
            <h2 className="text-2xl font-semibold">Give an AI agent a budget, not a blank cheque</h2>
            <ol className="space-y-3 text-sm text-slate-300">
              {[
                "A human authorizes a spending cap once with PayPal.",
                "The buyer agent plans the mission and hires seller agents from the marketplace.",
                "Every deliverable is verified. Good work is paid per task via PayPal capture; junk is refused and the agent re-hires.",
                "Unspent budget is voided automatically.",
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-sky-400/30 font-mono text-[10px] text-sky-300">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
            <p className="text-sm text-slate-400">The trust layer AI agents need before they can spend money on our behalf.</p>
          </div>
        </Reveal>
      </section>

      <section id="trust" className="mx-auto max-w-6xl px-6 py-20 space-y-8 scroll-mt-16">
        <Reveal className="text-center space-y-3">
          <div className="text-xs uppercase tracking-widest text-sky-300">Guarantees</div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Enforced in code, not just prompts</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guarantees.map(([t, b], i) => (
            <Reveal key={t} delay={(i % 3) * 100}>
              <div className="card lift h-full">
                <div className="font-medium flex items-center gap-2.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/15 text-emerald-400">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  {t}
                </div>
                <p className="mt-2 text-sm text-slate-400">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="card text-sm text-slate-300 flex flex-wrap gap-x-10 gap-y-3 justify-center">
            {security.map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-sky-300" />
                {text}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 space-y-10">
        <Reveal className="text-center space-y-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">Built with</div>
          <div className="flex flex-wrap justify-center gap-2">
            {stack.map((s) => (
              <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 transition hover:border-sky-400/40 hover:text-white">
                {s}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/15 via-slate-900 to-emerald-500/10 px-8 py-14 text-center">
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="relative space-y-5">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Stop paying for unproven work.</h2>
              <p className="text-slate-300 max-w-xl mx-auto">Fund a job or give an agent a budget in under a minute. Everything runs on the PayPal sandbox.</p>
              <Link href={cta} className="btn-primary group !px-6 !py-3 !text-base shadow-lg shadow-sky-500/20">
                Try ProofPay
                <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>ProofPay · Built for the PayPal AI Hackathon · MIT licensed</span>
          <a href="https://github.com/Manasi-Choudhari/proofpay" className="flex items-center gap-1.5 hover:text-slate-300 transition" target="_blank" rel="noreferrer">
            <GithubIcon /> Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
