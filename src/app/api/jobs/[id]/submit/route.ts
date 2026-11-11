import { NextResponse } from "next/server";
import { verifyDeliverable, type ImageInput } from "@/lib/ai";
import { bad, notFound, withAuth } from "@/lib/api";
import { decide, releaseMilestone } from "@/lib/escrow";
import { fetchDeliverable } from "@/lib/safeFetch";
import { getJob, logEvent, saveJob } from "@/lib/store";
import type { Verdict } from "@/lib/types";

export const maxDuration = 60;

export const POST = withAuth<{ id: string }>(async (req, session, { id }) => {
  const job = getJob(id, session.email);
  if (!job) return notFound();
  if (job.status !== "funded") return bad("Job must be funded before submitting work");

  const body = await req.json();
  const milestone = job.milestones.find((m) => m.id === body.milestoneId);
  if (!milestone) return notFound();
  if (milestone.status === "released") return bad("Milestone already paid");

  const proofText = body.proofText ? String(body.proofText).slice(0, 5000) : undefined;
  let proofUrl: string | undefined;
  let pageContent: string | undefined;
  if (body.proofUrl) {
    proofUrl = String(body.proofUrl).slice(0, 2000);
    try {
      pageContent = await fetchDeliverable(proofUrl, new URL(req.url).origin);
    } catch (e) {
      return bad(`Can't use that URL: ${(e as Error).message}`);
    }
  }
  let image: ImageInput | undefined;
  if (body.image?.base64) {
    const mimeType = String(body.image.mimeType || "");
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType)) return bad("Screenshot must be PNG, JPEG, WebP or GIF");
    if (String(body.image.base64).length > 5_600_000) return bad("Screenshot must be under 4 MB");
    image = { mimeType, base64: String(body.image.base64) };
  }
  if (!proofText && !proofUrl && !image) return bad("Submit a URL, notes, or a screenshot as proof");

  logEvent(job, "user", `${job.freelancerName} submitted proof for "${milestone.title}".`);

  try {
    const { data, provider } = await verifyDeliverable({
      jobTitle: job.title,
      jobSummary: job.summary,
      milestoneTitle: milestone.title,
      criteria: milestone.criteria,
      proofText,
      proofUrl,
      pageContent,
      image,
    });
    const { decision, policyNote } = decide(job, milestone, data);
    const verdict: Verdict = {
      at: new Date().toISOString(),
      provider,
      proofUrl,
      proofText,
      hasImage: !!image,
      ...data,
      decision,
      policyNote,
    };
    milestone.attempts.push(verdict);
    const passed = data.results.filter((r) => r.pass).length;
    logEvent(
      job,
      "ai",
      `${provider} verified ${passed}/${data.results.length} criteria (confidence ${(data.confidence * 100).toFixed(0)}%).`,
    );
    logEvent(job, "policy", policyNote);

    if (decision === "release") {
      await releaseMilestone(job, milestone, "agent");
    } else {
      milestone.status = decision === "review" ? "needs_review" : "rejected";
    }
    saveJob(job);
    return NextResponse.json(job);
  } catch (e) {
    logEvent(job, "policy", `Verification failed safely, funds remain in escrow: ${(e as Error).message}`);
    saveJob(job);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
});
