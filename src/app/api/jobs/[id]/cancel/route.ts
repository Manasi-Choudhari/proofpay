import { NextResponse } from "next/server";
import { bad, notFound, withAuth } from "@/lib/api";
import { voidAuthorization } from "@/lib/paypal";
import { addLedger, getJob, logEvent, saveJob } from "@/lib/store";

export const POST = withAuth<{ id: string }>(async (_req, session, { id }) => {
  const job = getJob(id, session.email);
  if (!job) return notFound();
  if (job.status !== "funded" || !job.authorizationId) return bad("Only funded jobs can be cancelled");
  await voidAuthorization(job.authorizationId);
  job.status = "cancelled";
  const unreleased = Math.round((job.total - job.capturedTotal) * 100) / 100;
  logEvent(job, "paypal", `Voided the escrow authorization. $${unreleased.toFixed(2)} returned to the client, never charged.`, job.authorizationId);
  addLedger({
    ownerEmail: job.ownerEmail,
    type: "Void",
    amount: unreleased,
    currency: job.currency,
    paypalRef: job.authorizationId,
    counterparty: "Client",
    source: "Human job",
    sourceId: job.id,
    sourceTitle: job.title,
    note: "Unreleased escrow returned",
  });
  saveJob(job);
  return NextResponse.json(job);
});
