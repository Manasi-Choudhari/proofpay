"use client";

import { useRef, useState } from "react";
import type { Mission, MissionTask, TaskAttempt } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import PayPalEscrowButton from "./PayPalEscrowButton";
import { ActivityLog } from "./JobView";

const usd = (n: number) => `$${n.toFixed(2)}`;

type AgentInfo = Record<string, { name: string; price: number; lowQuality: boolean }>;

export default function MissionView({
  initialMission,
  agents,
  paypalClientId,
  paypalBase,
}: {
  initialMission: Mission;
  agents: AgentInfo;
  paypalClientId: string;
  paypalBase: string;
}) {
  const [mission, setMission] = useState(initialMission);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const stopRef = useRef(false);

  async function run() {
    setRunning(true);
    setError("");
    stopRef.current = false;
    try {
      for (let i = 0; i < 20 && !stopRef.current; i++) {
        const res = await fetch(`/api/missions/${mission.id}/step`, { method: "POST" });
        const data = await res.json();
        if (data.mission) setMission(data.mission);
        if (!res.ok) throw new Error(data.error);
        if (!data.more) break;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function cancel() {
    if (!confirm("Stop the mission and void the unspent budget?")) return;
    stopRef.current = true;
    const res = await fetch(`/api/missions/${mission.id}/cancel`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setMission(data);
  }

  const remaining = mission.budget - mission.spent;
  const isLive = mission.status === "funded" || mission.status === "running";
  const voided = mission.status === "completed" || mission.status === "cancelled" ? remaining : 0;
  const pct = (n: number) => `${mission.budget ? (n / mission.budget) * 100 : 0}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-slate-500">AGENT MISSION #{mission.id}</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{mission.title}</h1>
          <p className="text-slate-400 mt-2 max-w-3xl">{mission.goal}</p>
        </div>
        <StatusBadge status={mission.status} />
      </div>

      <div className="card !p-4">
        <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
          <div className="bg-emerald-400 transition-all duration-700" style={{ width: pct(mission.spent) }} />
          <div className="bg-sky-400/70 transition-all duration-700" style={{ width: pct(isLive ? remaining : 0) }} />
          <div className="bg-amber-400/60 transition-all duration-700" style={{ width: pct(voided) }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span><span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2" />Paid to agents {usd(mission.spent)}</span>
          {isLive && <span><span className="inline-block h-2 w-2 rounded-full bg-sky-400 mr-2" />Available to agent {usd(remaining)}</span>}
          {voided > 0 && <span><span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-2" />Voided, never charged {usd(voided)}</span>}
          <span className="ml-auto text-slate-400">PayPal spending cap {usd(mission.budget)}</span>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-4">
          {mission.tasks.map((t, i) => (
            <TaskCard key={t.id} task={t} index={i} agents={agents} active={running && isActive(mission, t)} />
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          {mission.status === "planned" && (
            <div className="card space-y-3">
              <h3 className="font-semibold">Authorize the spending cap</h3>
              <p className="text-sm text-slate-400">
                Approve <span className="text-slate-100 font-medium">{usd(mission.budget)}</span> once with PayPal. This
                is an authorization, not a charge. Your agent pays sellers from it only after verification.
              </p>
              <PayPalEscrowButton<Mission> basePath={`/api/missions/${mission.id}`} clientId={paypalClientId} onFunded={setMission} />
            </div>
          )}
          {isLive && (
            <div className="card space-y-3">
              <h3 className="font-semibold">Autonomous run</h3>
              <p className="text-sm text-slate-400">
                The buyer agent will hire, verify and pay seller agents on its own, within guardrails.
              </p>
              <button className="btn-primary w-full !py-3" disabled={running} onClick={run}>
                {running ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" /> Agent is working…
                  </>
                ) : mission.status === "running" ? "Resume mission" : "▶ Start autonomous mission"}
              </button>
              <button className="btn-ghost w-full" onClick={cancel}>Stop &amp; void unspent budget</button>
            </div>
          )}
          {mission.status === "completed" && (
            <div className="card space-y-2 border-emerald-400/30">
              <h3 className="font-semibold text-emerald-300">Mission complete</h3>
              <p className="text-sm text-slate-300">
                Spent {usd(mission.spent)} of {usd(mission.budget)}.{" "}
                {mission.tasks.reduce((n, t) => n + t.attempts.filter((a) => !a.paid && a.output).length, 0)} junk
                deliverable(s) refused at $0.
              </p>
            </div>
          )}
          <ActivityLog events={mission.events} paypalBase={paypalBase} />
        </aside>
      </div>
    </div>
  );
}

function isActive(m: Mission, t: MissionTask) {
  return m.tasks.find((x) => x.status === "queued") === t;
}

function TaskCard({ task, index, agents, active }: { task: MissionTask; index: number; agents: AgentInfo; active: boolean }) {
  const paidAttempt = task.attempts.find((a) => a.paid);
  return (
    <div className={`card space-y-4 ${active ? "border-violet-400/50 shadow-[0_0_30px_-10px_rgba(167,139,250,0.6)]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-slate-500">TASK {index + 1} · {task.skill.toUpperCase()}</div>
          <div className="font-semibold text-lg">{task.title}</div>
          <p className="text-sm text-slate-400 mt-1">{task.brief}</p>
        </div>
        <StatusBadge status={active ? "running" : task.status} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Shortlist (cheapest first):</span>
        {task.candidates.map((id) => {
          const tried = task.attempts.find((a) => a.agentId === id);
          const tone = !tried ? "border-white/10 text-slate-300" : tried.paid ? "border-emerald-400/40 text-emerald-300" : "border-rose-400/40 text-rose-300 line-through";
          return (
            <span key={id} className={`rounded-full border px-2 py-0.5 ${tone}`}>
              {agents[id]?.name} {usd(agents[id]?.price ?? 0)}
            </span>
          );
        })}
      </div>

      <ul className="space-y-1 text-sm">
        {task.criteria.map((c, i) => {
          const r = (paidAttempt ?? task.attempts.at(-1))?.results[i];
          return (
            <li key={i} className="flex gap-2">
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${!r ? "bg-white/10 text-slate-400" : r.pass ? "bg-emerald-400 text-slate-950" : "bg-rose-400 text-slate-950"}`}>
                {!r ? i + 1 : r.pass ? "✓" : "✕"}
              </span>
              <span className="text-slate-200">{c}</span>
            </li>
          );
        })}
      </ul>

      {task.attempts.map((a, i) => (
        <AttemptPanel key={i} attempt={a} />
      ))}
      {active && (
        <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 text-sm text-violet-200 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" /> Hiring a seller, verifying output, settling on PayPal…
        </div>
      )}
    </div>
  );
}

function AttemptPanel({ attempt: a }: { attempt: TaskAttempt }) {
  const [open, setOpen] = useState(a.paid);
  const tone = a.paid ? "border-emerald-400/30 bg-emerald-500/5" : "border-rose-400/30 bg-rose-500/5";
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">
          {a.agentName} · {usd(a.price)}{" "}
          {a.paid ? (
            <span className="text-emerald-300">· paid via PayPal</span>
          ) : a.output ? (
            <span className="text-rose-300">· refused, $0 paid</span>
          ) : (
            <span className="text-amber-300">· not hired</span>
          )}
        </div>
        {a.output && (
          <span className="text-xs text-slate-400">verifier confidence {(a.confidence * 100).toFixed(0)}%</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {a.guardrails.map((g, i) => (
          <span key={i} className={`rounded-md px-2 py-0.5 text-[11px] ${g.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
            {g.ok ? "✓" : "✕"} {g.label}
          </span>
        ))}
      </div>
      {a.note && <p className="text-sm text-slate-300">{a.note}</p>}
      {a.output && (
        <div>
          <button className="text-xs text-sky-300 hover:underline" onClick={() => setOpen(!open)}>
            {open ? "Hide deliverable" : "Show deliverable"}
          </button>
          {open && (
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-900/80 p-3 text-sm text-slate-200 font-sans max-h-64 overflow-auto">{a.output}</pre>
          )}
        </div>
      )}
      {a.captureId && <div className="text-xs font-mono text-emerald-300/80">PayPal capture {a.captureId}</div>}
      <div className="text-[11px] text-slate-500">{a.provider}</div>
    </div>
  );
}
