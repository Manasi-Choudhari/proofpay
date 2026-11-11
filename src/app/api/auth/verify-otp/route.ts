import { NextResponse } from "next/server";
import { createSession, normalizeEmail, verifyOtp } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email || ""));
  const code = String(body.code || "").trim();
  const result = verifyOtp(email, code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  await createSession(email);
  return NextResponse.json({ ok: true });
}
