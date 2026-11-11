import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { planMission } from "@/lib/agents";
import { bad, withAuth } from "@/lib/api";
import { listMissions, logEvent, saveMission } from "@/lib/store";
import type { Mission } from "@/lib/types";

export const GET = withAuth(async (_req, session) => NextResponse.json(listMissions(session.email)));

export const POST = withAuth(async (req, session) => {
  const body = await req.json();
  const goal = String(body.goal || "").trim().slice(0, 2000);
  const budget = Number(body.budget);
  if (goal.length < 15) return bad("Describe the mission in a bit more detail.");
  if (!Number.isFinite(budget) || budget < 2 || budget > 500) return bad("Budget must be between $2 and $500.");

  const { title, tasks, provider } = await planMission(goal, budget);
  if (!tasks.length) return bad("The planner couldn't break this goal into marketplace tasks. Try rephrasing.");
  const mission: Mission = {
    id: randomUUID().slice(0, 8),
    ownerEmail: session.email,
    createdAt: new Date().toISOString(),
    goal,
    title,
    budget,
    currency: "USD",
    spent: 0,
    status: "planned",
    tasks,
    events: [],
  };
  logEvent(mission, "user", `Mission created with a $${budget.toFixed(2)} spending cap.`);
  logEvent(mission, "ai", `${provider} planned ${tasks.length} task(s) and shortlisted sellers for each (cheapest first).`);
  saveMission(mission);
  return NextResponse.json(mission);
});
