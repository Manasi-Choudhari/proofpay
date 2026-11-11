import Link from "next/link";
import CreateJobForm from "@/components/CreateJobForm";
import StatusBadge from "@/components/StatusBadge";
import { requirePageSession } from "@/lib/auth";
import { listJobs } from "@/lib/store";

export default async function JobsPage() {
  const { email } = await requirePageSession();
  const jobs = listJobs(email);
  return (
    <div className="grid lg:grid-cols-[1fr_440px] gap-8 items-start">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Human jobs</h1>
          <p className="text-sm text-slate-400 mt-1">Freelance work held in PayPal escrow and released by the AI verifier.</p>
        </div>
        {jobs.length === 0 && <div className="card text-sm text-slate-400">No jobs yet. Post your first one →</div>}
        {jobs.map((j) => (
          <Link key={j.id} href={`/app/jobs/${j.id}`} className="card block hover:border-sky-400/40 transition">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium truncate">{j.title}</div>
              <StatusBadge status={j.status} />
            </div>
            <div className="mt-2 text-sm text-slate-400">
              ${j.capturedTotal.toFixed(2)} released of ${j.total.toFixed(2)} · {j.milestones.length} milestone(s) · {j.freelancerName}
            </div>
          </Link>
        ))}
      </div>
      <CreateJobForm />
    </div>
  );
}
