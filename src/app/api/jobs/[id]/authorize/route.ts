import { NextResponse } from "next/server";
import { bad, notFound, withAuth } from "@/lib/api";
import { authorizeOrder } from "@/lib/paypal";
import { addLedger, getJob, logEvent, saveJob } from "@/lib/store";

export const POST = withAuth<{ id: string }>(async (req, session, { id }) => {
  const job = getJob(id, session.email);
  if (!job) return notFound();
  const { orderID } = await req.json();
  if (!orderID || orderID !== job.orderId) return bad("Order mismatch");
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
  addLedger({
    ownerEmail: job.ownerEmail,
    type: "Authorization",
    amount: job.total,
    currency: job.currency,
    paypalRef: authorization.id,
    counterparty: payer?.email_address || "Client",
    source: "Human job",
    sourceId: job.id,
    sourceTitle: job.title,
    note: "Escrow funded (held, not charged)",
  });
  saveJob(job);
  return NextResponse.json(job);
});
