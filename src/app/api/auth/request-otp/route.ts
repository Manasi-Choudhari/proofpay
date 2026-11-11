import { NextResponse } from "next/server";
import { deliverOtp, isValidEmail, issueOtp, normalizeEmail } from "@/lib/auth";

export async function POST(req: Request) {
  const { email: raw } = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(raw || ""));
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const { code, error, retryInSec } = issueOtp(email);
  if (!code) return NextResponse.json({ error, retryInSec }, { status: 429 });

  try {
    const channel = await deliverOtp(email, code);
    if (channel === "email") return NextResponse.json({ sent: true, channel });
    return NextResponse.json({ sent: true, channel, demoCode: code });
  } catch (e) {
    console.error("OTP delivery failed", e);
    return NextResponse.json({ sent: true, channel: "demo", demoCode: code, warning: "Email delivery failed; showing code in sandbox inbox." });
  }
}
