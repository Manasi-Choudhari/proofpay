import { NextResponse } from "next/server";
import { authorizeOrder } from "@/lib/paypal";
import { getJob, logEvent, saveJob } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const job = getJob((await params).id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const { orderID } = await req.json();
  if (!orderID || orderID !== job.orderId) return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  try {
    const { authorization, payer } = await authorizeOrder(orderID);
    job.authorizationId = authorization.id;
    job.authorizationExpires = authorization.expiration_time;
    job.status = "funded";
    const who = payer?.email_address ? ` by ${payer.email_address}` : "";
    logEvent(
      job,
      "paypal",
      `Buyer approved${who}. $${job.total.toFixed(2)} is now held in escrow (authorization ${authorization.status}).`,
      authorization.id,
    );
    saveJob(job);
    return NextResponse.json(job);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
