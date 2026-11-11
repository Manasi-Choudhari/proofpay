import { NextResponse } from "next/server";
import { bad, notFound, withAuth } from "@/lib/api";
import { authorizeOrder } from "@/lib/paypal";
import { addLedger, getMission, logEvent, saveMission } from "@/lib/store";

export const POST = withAuth<{ id: string }>(async (req, session, { id }) => {
  const m = getMission(id, session.email);
  if (!m) return notFound();
  const { orderID } = await req.json();
  if (!orderID || orderID !== m.orderId) return bad("Order mismatch");
  const { authorization, payer } = await authorizeOrder(orderID);
  m.authorizationId = authorization.id;
  m.status = "funded";
  logEvent(
    m,
    "paypal",
    `Spending cap of $${m.budget.toFixed(2)} authorized${payer?.email_address ? ` by ${payer.email_address}` : ""}. The agent may now spend within it.`,
    authorization.id,
  );
  addLedger({
    ownerEmail: m.ownerEmail,
    type: "Authorization",
    amount: m.budget,
    currency: m.currency,
    paypalRef: authorization.id,
    counterparty: payer?.email_address || "Mission owner",
    source: "Agent mission",
    sourceId: m.id,
    sourceTitle: m.title,
    note: "Agent spending cap (held, not charged)",
  });
  saveMission(m);
  return NextResponse.json(m);
});
