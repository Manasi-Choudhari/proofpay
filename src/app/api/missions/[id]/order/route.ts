import { NextResponse } from "next/server";
import { bad, notFound, withAuth } from "@/lib/api";
import { createAuthorizeOrder } from "@/lib/paypal";
import { getMission, logEvent, saveMission } from "@/lib/store";

export const POST = withAuth<{ id: string }>(async (_req, session, { id }) => {
  const m = getMission(id, session.email);
  if (!m) return notFound();
  if (m.status !== "planned") return bad("Mission is already funded");
  const order = await createAuthorizeOrder({ refId: m.id, title: `Agent mission: ${m.title}`, amount: m.budget, currency: m.currency });
  m.orderId = order.id;
  logEvent(m, "paypal", `Created PayPal order with intent AUTHORIZE for the $${m.budget.toFixed(2)} spending cap.`, order.id);
  saveMission(m);
  return NextResponse.json({ id: order.id });
});
