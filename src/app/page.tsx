import { listJobs } from "@/lib/store";
import CreateJobForm from "@/components/CreateJobForm";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const steps = [
  { n: "1", title: "Describe the job", body: "AI drafts milestones with objective, verifiable acceptance criteria." },
  { n: "2", title: "Fund escrow with PayPal", body: "The client authorizes payment. Money is held, not charged." },
  { n: "3", title: "Submit proof", body: "The freelancer submits a URL, notes, or a screenshot of the work." },
  { n: "4", title: "Agent verifies & pays", body: "AI checks every criterion; guardrails decide; PayPal captures or voids." },
];

export default function Home() {
  const jobs = listJobs();
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-12">
      <section className="grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-300">
            Agentic commerce · PayPal + AI
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Escrow that pays <span className="text-sky-400">the moment the work is proven.</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Freelancers worry about not getting paid. Clients worry about paying for work that never arrives.
            ProofPay&apos;s AI agent holds the money in PayPal, checks the deliverable against the contract, and
            releases payment itself, with guardrails and a full audit trail.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {steps.map((s) => (
              <div key={s.n} className="card !p-4">
                <div className="text-sky-400 font-mono text-xs">STEP {s.n}</div>
                <div className="font-medium mt-1">{s.title}</div>
                <div className="text-sm text-slate-400 mt-1">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
        <CreateJobForm />
      </section>

      {jobs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Escrow jobs</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {jobs.map((j) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="card hover:border-sky-400/40 transition block">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium truncate">{j.title}</div>
                  <StatusBadge status={j.status} />
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  ${j.capturedTotal.toFixed(2)} released of ${j.total.toFixed(2)} · {j.milestones.length} milestone(s)
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
