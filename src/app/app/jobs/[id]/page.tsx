import { notFound } from "next/navigation";
import JobView from "@/components/JobView";
import { requirePageSession } from "@/lib/auth";
import { paypalDashboardBase } from "@/lib/paypal";
import { getJob } from "@/lib/store";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { email } = await requirePageSession();
  const job = getJob((await params).id, email);
  if (!job) notFound();
  return <JobView initialJob={job} paypalClientId={process.env.PAYPAL_CLIENT_ID || ""} paypalBase={paypalDashboardBase} />;
}
