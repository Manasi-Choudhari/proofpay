import { notFound } from "next/navigation";
import MissionView from "@/components/MissionView";
import { SELLER_AGENTS } from "@/lib/agents";
import { requirePageSession } from "@/lib/auth";
import { paypalDashboardBase } from "@/lib/paypal";
import { getMission } from "@/lib/store";

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { email } = await requirePageSession();
  const mission = getMission((await params).id, email);
  if (!mission) notFound();
  const agents = Object.fromEntries(SELLER_AGENTS.map((a) => [a.id, { name: a.name, price: a.price, lowQuality: !!a.lowQuality }]));
  return (
    <MissionView
      initialMission={mission}
      agents={agents}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || ""}
      paypalBase={paypalDashboardBase}
    />
  );
}
