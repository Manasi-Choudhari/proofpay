import Link from "next/link";
import CreateMissionForm from "@/components/CreateMissionForm";
import StatusBadge from "@/components/StatusBadge";
import { requirePageSession } from "@/lib/auth";
import { listMissions } from "@/lib/store";

export default async function MissionsPage() {
  const { email } = await requirePageSession();
  const missions = listMissions(email);
  return (
    <div className="grid lg:grid-cols-[1fr_440px] gap-8 items-start">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent missions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Authorize a spending cap once. Your buyer agent hires marketplace agents and pays per verified task.
          </p>
        </div>
        {missions.length === 0 && <div className="card text-sm text-slate-400">No missions yet. Launch your first one →</div>}
        {missions.map((m) => (
          <Link key={m.id} href={`/app/missions/${m.id}`} className="card block hover:border-sky-400/40 transition">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium truncate">{m.title}</div>
              <StatusBadge status={m.status} />
            </div>
            <div className="mt-2 text-sm text-slate-400">
              ${m.spent.toFixed(2)} spent of ${m.budget.toFixed(2)} cap · {m.tasks.length} task(s)
            </div>
          </Link>
        ))}
      </div>
      <CreateMissionForm />
    </div>
  );
}
