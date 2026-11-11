import { NextResponse } from "next/server";
import { clientIp, createSession, normalizeEmail, rateLimit, verifyOtp } from "@/lib/auth";

export async function POST(req: Request) {
  if (!rateLimit(`verify:${clientIp(req)}`, 20, 10 * 60 * 1000))
    return NextResponse.json({ error: "Too many attempts from this device. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email || ""));
  const code = String(body.code || "").trim();
  const result = verifyOtp(email, code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  await createSession(email);
  return NextResponse.json({ ok: true });
}
