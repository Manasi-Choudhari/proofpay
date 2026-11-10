import { notFound } from "next/navigation";
import { getJob } from "@/lib/store";
import { paypalDashboardBase } from "@/lib/paypal";
import JobView from "@/components/JobView";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const job = getJob((await params).id);
  if (!job) notFound();
  return (
    <JobView
      initialJob={job}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || ""}
      paypalBase={paypalDashboardBase}
    />
  );
}
