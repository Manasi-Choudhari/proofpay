"use client";

import { useState } from "react";
import type { Job, JobEvent, Milestone, Verdict } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import PayPalEscrowButton from "./PayPalEscrowButton";

const usd = (n: number) => `$${n.toFixed(2)}`;

export default function JobView({
  initialJob,
  paypalClientId,
  paypalBase,
}: {
  initialJob: Job;
  paypalClientId: string;
  paypalBase: string;
}) {
  const [job, setJob] = useState(initialJob);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function post(path: string, body?: unknown, label = "Working…") {
    setBusy(label);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${job.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        const fresh = await fetch(`/api/jobs/${job.id}`).then((r) => r.json());
        if (fresh?.id) setJob(fresh);
      } else setJob(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const held = job.status === "funded" ? job.total - job.capturedTotal : 0;
  const returned = job.status === "cancelled" ? job.total - job.capturedTotal : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-slate-500">JOB #{job.id}</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{job.title}</h1>
          <p className="text-slate-400 mt-2 max-w-3xl">{job.summary}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <EscrowMeter total={job.total} released={job.capturedTotal} held={held} returned={returned} />

      {error && <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
      {busy && (
        <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3 text-sm text-sky-200 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" /> {busy}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-4">
          {job.milestones.map((m, i) => (
            <MilestoneCard
              key={m.id}
              index={i}
              milestone={m}
              job={job}
              paypalBase={paypalBase}
              busy={!!busy}
              onSubmit={(proof) => post("submit", { milestoneId: m.id, ...proof }, "AI agent is verifying the deliverable against each criterion…")}
              onApprove={() => post("approve", { milestoneId: m.id }, "Releasing payment via PayPal…")}
            />
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          {job.status === "draft" && (
            <div className="card space-y-3">
              <h3 className="font-semibold">Fund escrow</h3>
              <p className="text-sm text-slate-400">
                Pay with PayPal to place <span className="text-slate-100 font-medium">{usd(job.total)}</span> in escrow.
                This only <em>authorizes</em> the payment. You aren&apos;t charged until the AI verifies the work.
              </p>
              <PayPalEscrowButton job={job} clientId={paypalClientId} onFunded={setJob} />
            </div>
          )}
          {job.status === "funded" && (
            <div className="card space-y-3">
              <h3 className="font-semibold">Escrow controls</h3>
              <p className="text-sm text-slate-400">
                Authorization{" "}
                <span className="font-mono text-xs text-slate-300">{job.authorizationId}</span>
                {job.authorizationExpires && <> · expires {new Date(job.authorizationExpires).toLocaleDateString()}</>}
              </p>
              <button
                className="btn-ghost w-full"
                disabled={!!busy}
                onClick={() => {
                  if (confirm("Cancel the job and release the unpaid hold back to the client?"))
                    post("cancel", undefined, "Voiding PayPal authorization…");
                }}
              >
                Cancel job &amp; void remaining hold
              </button>
            </div>
          )}
          <ActivityLog events={job.events} paypalBase={paypalBase} />
        </aside>
      </div>
    </div>
  );
}

function EscrowMeter({ total, released, held, returned }: { total: number; released: number; held: number; returned: number }) {
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  return (
    <div className="card !p-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
        <div className="bg-emerald-400 transition-all duration-700" style={{ width: pct(released) }} />
        <div className="bg-sky-400/70 transition-all duration-700" style={{ width: pct(held) }} />
        <div className="bg-rose-400/60 transition-all duration-700" style={{ width: pct(returned) }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span><span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2" />Released {usd(released)}</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-sky-400 mr-2" />Held in PayPal escrow {usd(held)}</span>
        {returned > 0 && (
          <span><span className="inline-block h-2 w-2 rounded-full bg-rose-400 mr-2" />Returned to client {usd(returned)}</span>
        )}
        <span className="ml-auto text-slate-400">Contract total {usd(total)}</span>
      </div>
    </div>
  );
}

type Proof = { proofUrl?: string; proofText?: string; image?: { mimeType: string; base64: string } };

function MilestoneCard({
  index,
  milestone: m,
  job,
  paypalBase,
  busy,
  onSubmit,
  onApprove,
}: {
  index: number;
  milestone: Milestone;
  job: Job;
  paypalBase: string;
  busy: boolean;
  onSubmit: (p: Proof) => void;
  onApprove: () => void;
}) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<Proof["image"]>();
  const [imageName, setImageName] = useState("");
  const latest = m.attempts[m.attempts.length - 1];
  const canSubmit = job.status === "funded" && (m.status === "pending" || m.status === "rejected");

  function pickImage(file?: File) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return alert("Image must be under 4 MB");
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      setImage({ mimeType: file.type, base64: s.slice(s.indexOf(",") + 1) });
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-slate-500">MILESTONE {index + 1}</div>
          <div className="font-semibold text-lg">{m.title}</div>
        </div>
        <div className="text-right space-y-1">
          <div className="font-semibold">{usd(m.amount)}</div>
          <StatusBadge status={m.status} />
        </div>
      </div>

      <ul className="space-y-1.5">
        {m.criteria.map((c, i) => {
          const r = latest?.results.find((x) => x.criterion === c) ?? latest?.results[i];
          return (
            <li key={i} className="flex gap-2 text-sm">
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  !r ? "bg-white/10 text-slate-400" : r.pass ? "bg-emerald-400 text-slate-950" : "bg-rose-400 text-slate-950"
                }`}
              >
                {!r ? i + 1 : r.pass ? "✓" : "✕"}
              </span>
              <div>
                <div className="text-slate-200">{c}</div>
                {r && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2 break-words">{r.evidence}</div>}
              </div>
            </li>
          );
        })}
      </ul>

      {latest && <VerdictPanel verdict={latest} attempts={m.attempts.length} />}

      {m.status === "released" && m.captureId && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          Paid via PayPal capture <span className="font-mono">{m.captureId}</span>
          {m.payoutBatchId && (
            <>
              {" "}· payout batch <span className="font-mono">{m.payoutBatchId}</span>
            </>
          )}
          <a className="ml-2 underline" href={`${paypalBase}/activity`} target="_blank" rel="noreferrer">
            View in PayPal
          </a>
        </div>
      )}

      {m.status === "needs_review" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 flex items-center justify-between gap-3">
          <span className="text-sm text-amber-200">The agent wants a human to confirm before releasing funds.</span>
          <button className="btn-primary" disabled={busy} onClick={onApprove}>
            Approve &amp; release {usd(m.amount)}
          </button>
        </div>
      )}

      {canSubmit && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Freelancer: submit proof of work</div>
            <div className="flex gap-2 text-xs">
              <span className="text-slate-500">Demo deliverables:</span>
              <button className="text-sky-300 hover:underline" onClick={() => setUrl("/samples/bean-there-v1.html")}>
                draft v1
              </button>
              <button className="text-sky-300 hover:underline" onClick={() => setUrl("/samples/bean-there-v2.html")}>
                final v2
              </button>
            </div>
          </div>
          <input className="input" placeholder="https://link-to-your-deliverable" value={url} onChange={(e) => setUrl(e.target.value)} />
          <textarea
            className="input min-h-20"
            placeholder="Notes for the verifier (what you built, where to find each item)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
              {imageName ? `📎 ${imageName}` : "+ Attach screenshot"}
            </label>
            <button
              className="btn-primary"
              disabled={busy || (!url && !notes && !image)}
              onClick={() =>
                onSubmit({ proofUrl: url || undefined, proofText: notes || undefined, image })
              }
            >
              Submit for AI verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictPanel({ verdict: v, attempts }: { verdict: Verdict; attempts: number }) {
  const tone =
    v.decision === "release"
      ? "border-emerald-400/30 bg-emerald-500/5"
      : v.decision === "review"
        ? "border-amber-400/30 bg-amber-500/5"
        : "border-rose-400/30 bg-rose-500/5";
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>
          AI verdict · {v.provider} · attempt {attempts}
        </span>
        <span>confidence {(v.confidence * 100).toFixed(0)}%</span>
      </div>
      <p className="text-sm text-slate-200">{v.summary}</p>
      <p className="text-sm text-slate-300">
        <span className="text-slate-500">Feedback: </span>
        {v.feedback}
      </p>
      <p className="text-xs text-slate-400">
        <span className="font-medium text-slate-300">Guardrail decision: </span>
        {v.policyNote}
      </p>
    </div>
  );
}

const kindStyle: Record<JobEvent["kind"], string> = {
  ai: "bg-violet-400",
  paypal: "bg-sky-400",
  policy: "bg-amber-400",
  user: "bg-slate-400",
};
const kindLabel: Record<JobEvent["kind"], string> = { ai: "AI", paypal: "PayPal", policy: "Guardrail", user: "User" };

function ActivityLog({ events, paypalBase }: { events: JobEvent[]; paypalBase: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Agent activity &amp; audit trail</h3>
      <ol className="space-y-3">
        {[...events].reverse().map((e, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${kindStyle[e.kind]}`} />
            <div className="min-w-0">
              <div className="text-xs text-slate-500">
                {kindLabel[e.kind]} · {new Date(e.at).toLocaleTimeString()}
              </div>
              <div className="text-slate-200">{e.message}</div>
              {e.ref && (
                <a
                  className="font-mono text-xs text-sky-300/80 hover:underline break-all"
                  href={`${paypalBase}/activity`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {e.ref}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
