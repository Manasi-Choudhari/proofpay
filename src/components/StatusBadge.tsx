const styles: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-300 border-slate-400/30",
  funded: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  cancelled: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  pending: "bg-slate-500/15 text-slate-300 border-slate-400/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  needs_review: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  released: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
};

const labels: Record<string, string> = {
  draft: "Awaiting funding",
  funded: "Funds in escrow",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
  rejected: "Changes requested",
  needs_review: "Needs client review",
  released: "Paid",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  );
}
