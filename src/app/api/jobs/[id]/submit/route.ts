import { NextResponse } from "next/server";
import { verifyDeliverable, type ImageInput } from "@/lib/ai";
import { bad, notFound, withAuth } from "@/lib/api";
import { decide, releaseMilestone } from "@/lib/escrow";
import { getJob, logEvent, saveJob } from "@/lib/store";
import type { Verdict } from "@/lib/types";

export const maxDuration = 60;

const MAX_PAGE_CHARS = 40_000;

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ProofPay-Verifier/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return `[Could not load page: HTTP ${res.status}]`;
    const text = await res.text();
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/\s+/g, " ")
      .slice(0, MAX_PAGE_CHARS);
  } catch (e) {
    return `[Could not load page: ${(e as Error).message}]`;
  } finally {
    clearTimeout(timer);
  }
}

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
    try {
      const u = new URL(String(body.proofUrl), new URL(req.url).origin);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error();
      proofUrl = String(body.proofUrl);
      pageContent = await fetchPage(u.toString());
    } catch {
      return bad("Invalid URL");
    }
  }
  let image: ImageInput | undefined;
  if (body.image?.base64 && body.image?.mimeType?.startsWith("image/")) {
    image = { mimeType: body.image.mimeType, base64: body.image.base64 };
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
