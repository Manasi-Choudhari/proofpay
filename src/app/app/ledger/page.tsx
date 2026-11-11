import LedgerGrid from "@/components/LedgerGrid";
import { requirePageSession } from "@/lib/auth";
import { listLedger } from "@/lib/store";

export default async function LedgerPage() {
  const { email } = await requirePageSession();
  const rows = listLedger(email);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PayPal ledger</h1>
        <p className="text-sm text-slate-400 mt-1">
          Every authorization, capture, void and payout the agents made, plus every payment they refused. Each row
          links a PayPal transaction ID to the AI verdict behind it.
        </p>
      </div>
      <LedgerGrid rows={rows} />
    </div>
  );
}
