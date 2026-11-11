import { NextResponse } from "next/server";
import { bad, notFound, withAuth } from "@/lib/api";
import { releaseMilestone } from "@/lib/escrow";
import { getJob, logEvent, saveJob } from "@/lib/store";

export const POST = withAuth<{ id: string }>(async (req, session, { id }) => {
  const job = getJob(id, session.email);
  if (!job) return notFound();
  const { milestoneId } = await req.json();
  const milestone = job.milestones.find((m) => m.id === milestoneId);
  if (!milestone || milestone.status !== "needs_review") return bad("Milestone is not awaiting review");
  logEvent(job, "user", `Client manually approved "${milestone.title}".`);
  try {
    await releaseMilestone(job, milestone, "client");
  } finally {
    saveJob(job);
  }
  return NextResponse.json(job);
});
