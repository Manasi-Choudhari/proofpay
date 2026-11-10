import { NextResponse } from "next/server";
import { releaseMilestone } from "@/lib/escrow";
import { getJob, logEvent, saveJob } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const job = getJob((await params).id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const { milestoneId } = await req.json();
  const milestone = job.milestones.find((m) => m.id === milestoneId);
  if (!milestone || milestone.status !== "needs_review")
    return NextResponse.json({ error: "Milestone is not awaiting review" }, { status: 400 });
  try {
    logEvent(job, "user", `Client manually approved "${milestone.title}".`);
    await releaseMilestone(job, milestone, "client");
    saveJob(job);
    return NextResponse.json(job);
  } catch (e) {
    saveJob(job);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
