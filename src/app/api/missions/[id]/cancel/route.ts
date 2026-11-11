import { NextResponse } from "next/server";
import { bad, notFound, withAuth } from "@/lib/api";
import { voidAuthorization } from "@/lib/paypal";
import { addLedger, getMission, logEvent, saveMission } from "@/lib/store";

export const POST = withAuth<{ id: string }>(async (_req, session, { id }) => {
  const m = getMission(id, session.email);
  if (!m) return notFound();
  if (!["funded", "running"].includes(m.status) || !m.authorizationId) return bad("Only funded missions can be cancelled");
  await voidAuthorization(m.authorizationId);
  const unspent = Math.round((m.budget - m.spent) * 100) / 100;
  m.status = "cancelled";
  logEvent(m, "paypal", `Mission stopped. Voided authorization; $${unspent.toFixed(2)} never charged.`, m.authorizationId);
  addLedger({
    ownerEmail: m.ownerEmail,
    type: "Void",
    amount: unspent,
    currency: m.currency,
    paypalRef: m.authorizationId,
    counterparty: "Mission owner",
    source: "Agent mission",
    sourceId: m.id,
    sourceTitle: m.title,
    note: "Mission stopped by owner",
  });
  saveMission(m);
  return NextResponse.json(m);
});
