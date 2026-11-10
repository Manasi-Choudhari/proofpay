import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { draftContract } from "@/lib/ai";
import { listJobs, logEvent, saveJob } from "@/lib/store";
import type { Job } from "@/lib/types";

export async function GET() {
  return NextResponse.json(listJobs());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const description = String(body.description || "").trim();
    const budget = Number(body.budget);
    if (description.length < 15) return NextResponse.json({ error: "Describe the job in a bit more detail." }, { status: 400 });
    if (!Number.isFinite(budget) || budget < 1 || budget > 10000)
      return NextResponse.json({ error: "Budget must be between $1 and $10,000." }, { status: 400 });

    const { data, provider } = await draftContract(description, budget);
    const job: Job = {
      id: randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
      description,
      title: data.title,
      summary: data.summary,
      clientName: String(body.clientName || "Client").slice(0, 60),
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
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
