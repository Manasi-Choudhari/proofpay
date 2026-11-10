import { NextResponse } from "next/server";
import { voidAuthorization } from "@/lib/paypal";
import { getJob, logEvent, saveJob } from "@/lib/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const job = getJob((await params).id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "funded" || !job.authorizationId)
    return NextResponse.json({ error: "Only funded jobs can be cancelled" }, { status: 400 });
  try {
    await voidAuthorization(job.authorizationId);
    job.status = "cancelled";
    const unreleased = Math.round((job.total - job.capturedTotal) * 100) / 100;
    logEvent(job, "paypal", `Voided the escrow authorization. $${unreleased.toFixed(2)} returned to the client, never charged.`, job.authorizationId);
    saveJob(job);
    return NextResponse.json(job);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
