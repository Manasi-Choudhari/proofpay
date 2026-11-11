import { captureAuthorization, sendPayout } from "./paypal";
import { addLedger, logEvent } from "./store";
import type { Decision, Job, Milestone } from "./types";
import type { VerificationResult } from "./ai";

export const AUTO_RELEASE_CONFIDENCE = Number(process.env.AUTO_RELEASE_CONFIDENCE || 0.75);
export const PLATFORM_FEE_PCT = Number(process.env.PLATFORM_FEE_PCT || 5);

export function decide(
  job: Job,
  milestone: Milestone,
  v: VerificationResult,
): { decision: Decision; policyNote: string } {
  const allPass = v.results.length > 0 && v.results.every((r) => r.pass);
  const remaining = Math.round((job.total - job.capturedTotal) * 100) / 100;
  if (!allPass) {
    const failed = v.results.filter((r) => !r.pass).length;
    return { decision: "reject", policyNote: `${failed} criteria not met; funds stay in escrow.` };
  }
  if (milestone.amount > remaining + 0.001) {
    return {
      decision: "review",
      policyNote: `Guardrail: milestone amount exceeds remaining authorized funds ($${remaining.toFixed(2)}).`,
    };
  }
  if (v.confidence < AUTO_RELEASE_CONFIDENCE) {
    return {
      decision: "review",
      policyNote: `Guardrail: AI confidence ${(v.confidence * 100).toFixed(0)}% is below the ${(
        AUTO_RELEASE_CONFIDENCE * 100
      ).toFixed(0)}% auto-release threshold, so the client must approve.`,
    };
  }
  return {
    decision: "release",
    policyNote: `All criteria met with ${(v.confidence * 100).toFixed(0)}% confidence; within authorized amount. Auto-release approved.`,
  };
}

export async function releaseMilestone(job: Job, milestone: Milestone, approvedBy: "agent" | "client") {
  if (!job.authorizationId) throw new Error("Job is not funded");
  const isLast = job.milestones.every((m) => m.id === milestone.id || m.status === "released");

  const capture = await captureAuthorization({
    authorizationId: job.authorizationId,
    amount: milestone.amount,
    currency: job.currency,
    finalCapture: isLast,
    invoiceId: `${job.id}-${milestone.id}`,
    note: `ProofPay released "${milestone.title}" (${approvedBy === "agent" ? "verified by AI agent" : "approved by client"})`,
  });
  milestone.status = "released";
  milestone.captureId = capture.id;
  job.capturedTotal = Math.round((job.capturedTotal + milestone.amount) * 100) / 100;
  addLedger({
    ownerEmail: job.ownerEmail,
    type: "Capture",
    amount: milestone.amount,
    currency: job.currency,
    paypalRef: capture.id,
    counterparty: job.freelancerName,
    source: "Human job",
    sourceId: job.id,
    sourceTitle: job.title,
    aiConfidence: milestone.attempts.at(-1)?.confidence,
    note: `${milestone.title} (${approvedBy === "agent" ? "AI-verified" : "client-approved"})`,
  });
  logEvent(
    job,
    "paypal",
    `Captured $${milestone.amount.toFixed(2)} from the escrow authorization for "${milestone.title}"${isLast ? " (final capture)" : ""}.`,
    capture.id,
  );

  if (process.env.PAYOUTS_ENABLED === "true" && job.freelancerEmail) {
    const net = Math.round(milestone.amount * (1 - PLATFORM_FEE_PCT / 100) * 100) / 100;
    try {
      const batch = await sendPayout({
        batchId: `${job.id}-${milestone.id}-${Date.now()}`,
        email: job.freelancerEmail,
        amount: net,
        currency: job.currency,
        note: `Payment for "${milestone.title}" on "${job.title}"`,
      });
      milestone.payoutBatchId = batch.payout_batch_id;
      addLedger({
        ownerEmail: job.ownerEmail,
        type: "Payout",
        amount: net,
        currency: job.currency,
        paypalRef: batch.payout_batch_id,
        counterparty: job.freelancerEmail,
        source: "Human job",
        sourceId: job.id,
        sourceTitle: job.title,
        note: `Net of ${PLATFORM_FEE_PCT}% platform fee`,
      });
      logEvent(
        job,
        "paypal",
        `Paid out $${net.toFixed(2)} to ${job.freelancerEmail} via PayPal Payouts (${PLATFORM_FEE_PCT}% platform fee kept).`,
        batch.payout_batch_id,
      );
    } catch (e) {
      logEvent(job, "paypal", `Payout to freelancer failed: ${(e as Error).message}`);
    }
  }

  if (isLast) {
    job.status = "completed";
    logEvent(job, "policy", "All milestones released. Escrow closed.");
  }
}
