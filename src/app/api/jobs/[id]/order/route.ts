import { NextResponse } from "next/server";
import { bad, notFound, withAuth } from "@/lib/api";
import { createAuthorizeOrder } from "@/lib/paypal";
import { getJob, logEvent, saveJob } from "@/lib/store";

export const POST = withAuth<{ id: string }>(async (_req, session, { id }) => {
  const job = getJob(id, session.email);
  if (!job) return notFound();
  if (job.status !== "draft") return bad("Job is already funded");
  const order = await createAuthorizeOrder({ refId: job.id, title: job.title, amount: job.total, currency: job.currency });
  job.orderId = order.id;
  logEvent(job, "paypal", `Created PayPal order with intent AUTHORIZE for $${job.total.toFixed(2)}.`, order.id);
  saveJob(job);
  return NextResponse.json({ id: order.id });
});
