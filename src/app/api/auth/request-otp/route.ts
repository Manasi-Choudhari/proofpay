import { NextResponse } from "next/server";
import { clearOtp, clientIp, deliverOtp, isValidEmail, issueOtp, normalizeEmail, rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  if (!rateLimit(`otp:${clientIp(req)}`, 8, 10 * 60 * 1000))
    return NextResponse.json({ error: "Too many code requests from this device. Try again in a few minutes." }, { status: 429 });

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
    console.error("OTP email delivery failed:", (e as Error).message);
    clearOtp(email);
    return NextResponse.json({ error: "We couldn't send the email right now. Please try again." }, { status: 502 });
  }
}
