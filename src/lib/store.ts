import fs from "fs";
import os from "os";
import path from "path";
import type { Job, JobEvent } from "./types";

const DATA_FILE = process.env.DATA_FILE || path.join(os.tmpdir(), "proofpay-data.json");

const g = globalThis as unknown as { __proofpayJobs?: Map<string, Job> };

function jobs(): Map<string, Job> {
  if (!g.__proofpayJobs) {
    g.__proofpayJobs = new Map();
    try {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Job[];
      for (const j of raw) g.__proofpayJobs.set(j.id, j);
    } catch {
      // no saved data yet
    }
  }
  return g.__proofpayJobs;
}

function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify([...jobs().values()], null, 2));
  } catch (e) {
    console.warn("Could not persist jobs:", e);
  }
}

export function listJobs(): Job[] {
  return [...jobs().values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getJob(id: string): Job | undefined {
  return jobs().get(id);
}

export function saveJob(job: Job) {
  jobs().set(job.id, job);
  persist();
}

export function logEvent(job: Job, kind: JobEvent["kind"], message: string, ref?: string) {
  job.events.push({ at: new Date().toISOString(), kind, message, ref });
}
