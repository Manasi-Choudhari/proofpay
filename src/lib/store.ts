import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import type { AgentStats, Job, JobEvent, LedgerEntry, Mission } from "./types";

const DATA_FILE = process.env.DATA_FILE || path.join(os.tmpdir(), "proofpay-data-v2.json");

interface Db {
  jobs: Record<string, Job>;
  missions: Record<string, Mission>;
  ledger: LedgerEntry[];
  agentStats: Record<string, AgentStats>;
}

const g = globalThis as unknown as { __proofpayDb?: Db };

function db(): Db {
  if (!g.__proofpayDb) {
    g.__proofpayDb = { jobs: {}, missions: {}, ledger: [], agentStats: {} };
    try {
      Object.assign(g.__proofpayDb, JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
    } catch {
      // no saved data yet
    }
  }
  return g.__proofpayDb;
}

function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db()));
  } catch (e) {
    console.warn("Could not persist data:", e);
  }
}

const newest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export function listJobs(ownerEmail: string): Job[] {
  return Object.values(db().jobs).filter((j) => j.ownerEmail === ownerEmail).sort(newest);
}

export function getJob(id: string, ownerEmail: string): Job | undefined {
  const job = db().jobs[id];
  return job && job.ownerEmail === ownerEmail ? job : undefined;
}

export function saveJob(job: Job) {
  db().jobs[job.id] = job;
  persist();
}

export function listMissions(ownerEmail: string): Mission[] {
  return Object.values(db().missions).filter((m) => m.ownerEmail === ownerEmail).sort(newest);
}

export function getMission(id: string, ownerEmail: string): Mission | undefined {
  const m = db().missions[id];
  return m && m.ownerEmail === ownerEmail ? m : undefined;
}

export function saveMission(m: Mission) {
  db().missions[m.id] = m;
  persist();
}

export function logEvent(target: { events: JobEvent[] }, kind: JobEvent["kind"], message: string, ref?: string) {
  target.events.push({ at: new Date().toISOString(), kind, message, ref });
}

export function addLedger(entry: Omit<LedgerEntry, "id" | "at">) {
  db().ledger.push({ id: randomUUID().slice(0, 8), at: new Date().toISOString(), ...entry });
  persist();
}

export function listLedger(ownerEmail: string): LedgerEntry[] {
  return db()
    .ledger.filter((l) => l.ownerEmail === ownerEmail)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function agentStats(): Record<string, AgentStats> {
  return db().agentStats;
}

export function recordAgentResult(agentId: string, paid: boolean, amount: number) {
  const s = (db().agentStats[agentId] ??= { hires: 0, paid: 0, refused: 0, earned: 0 });
  s.hires += 1;
  if (paid) {
    s.paid += 1;
    s.earned = Math.round((s.earned + amount) * 100) / 100;
  } else s.refused += 1;
  persist();
}
