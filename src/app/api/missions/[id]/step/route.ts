import { NextResponse } from "next/server";
import { stepMission } from "@/lib/agents";
import { bad, notFound, withAuth } from "@/lib/api";
import { getMission, logEvent, saveMission } from "@/lib/store";

export const maxDuration = 60;

const g = globalThis as unknown as { __proofpayStepLocks?: Set<string> };
const locks = () => (g.__proofpayStepLocks ??= new Set());

export const POST = withAuth<{ id: string }>(async (_req, session, { id }) => {
  const m = getMission(id, session.email);
  if (!m) return notFound();
  if (!["funded", "running"].includes(m.status)) return NextResponse.json({ mission: m, more: false });
  if (locks().has(m.id)) return bad("A step is already running for this mission");
  locks().add(m.id);
  try {
    const more = await stepMission(m);
    saveMission(m);
    return NextResponse.json({ mission: m, more });
  } catch (e) {
    logEvent(m, "policy", `Step failed safely, no payment made: ${(e as Error).message}`);
    saveMission(m);
    return NextResponse.json({ error: (e as Error).message, mission: m, more: false }, { status: 500 });
  } finally {
    locks().delete(m.id);
  }
});
