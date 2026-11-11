import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { draftContract } from "@/lib/ai";
import { bad, withAuth } from "@/lib/api";
import { listJobs, logEvent, saveJob } from "@/lib/store";
import type { Job } from "@/lib/types";

export const GET = withAuth(async (_req, session) => NextResponse.json(listJobs(session.email)));

export const POST = withAuth(async (req, session) => {
  const body = await req.json();
  const description = String(body.description || "").trim().slice(0, 4000);
  const budget = Number(body.budget);
  if (description.length < 15) return bad("Describe the job in a bit more detail.");
  if (!Number.isFinite(budget) || budget < 1 || budget > 10000) return bad("Budget must be between $1 and $10,000.");

  const { data, provider } = await draftContract(description, budget);
  const job: Job = {
    id: randomUUID().slice(0, 8),
    ownerEmail: session.email,
    createdAt: new Date().toISOString(),
    description,
    title: data.title,
    summary: data.summary,
    clientName: session.email,
    freelancerName: String(body.freelancerName || "Freelancer").slice(0, 60),
    freelancerEmail: String(body.freelancerEmail || "").slice(0, 120),
    currency: "USD",
    total: budget,
    milestones: data.milestones.map((m, i) => ({
      id: `m${i + 1}`,
      title: m.title,
      amount: m.amount,
      criteria: m.criteria,
      status: "pending",
      attempts: [],
    })),
    status: "draft",
    capturedTotal: 0,
    events: [],
  };
  logEvent(job, "user", `Client posted the job with a $${budget.toFixed(2)} budget.`);
  logEvent(
    job,
    "ai",
    `${provider} drafted the contract: ${job.milestones.length} milestone(s), ${job.milestones.reduce(
      (s, m) => s + m.criteria.length,
      0,
    )} verifiable acceptance criteria.`,
  );
  saveJob(job);
  return NextResponse.json(job);
});
