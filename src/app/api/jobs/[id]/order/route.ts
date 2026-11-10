import { NextResponse } from "next/server";
import { createAuthorizeOrder } from "@/lib/paypal";
import { getJob, logEvent, saveJob } from "@/lib/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const job = getJob((await params).id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "draft") return NextResponse.json({ error: "Job is already funded" }, { status: 400 });
  try {
    const order = await createAuthorizeOrder({
      jobId: job.id,
      title: job.title,
      amount: job.total,
      currency: job.currency,
    });
    job.orderId = order.id;
    logEvent(job, "paypal", `Created PayPal order with intent AUTHORIZE for $${job.total.toFixed(2)}.`, order.id);
    saveJob(job);
    return NextResponse.json({ id: order.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
