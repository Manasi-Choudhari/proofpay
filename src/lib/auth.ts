import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "pp_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  // Derive a stable fallback so local setups work without extra config.
  return createHash("sha256")
    .update(`proofpay:${process.env.PAYPAL_CLIENT_SECRET || "dev"}`)
    .digest("hex");
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// ---------- OTP ----------

interface OtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

const g = globalThis as unknown as { __proofpayOtps?: Map<string, OtpRecord> };
const otps = () => (g.__proofpayOtps ??= new Map());

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120;
}

export function issueOtp(email: string): { code?: string; error?: string; retryInSec?: number } {
  const existing = otps().get(email);
  const now = Date.now();
  if (existing && now - existing.sentAt < OTP_RESEND_COOLDOWN_MS) {
    return { error: "Please wait before requesting another code.", retryInSec: Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existing.sentAt)) / 1000) };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  otps().set(email, { hash: sign(`otp:${email}:${code}`), expiresAt: now + OTP_TTL_MS, attempts: 0, sentAt: now });
  return { code };
}

export function verifyOtp(email: string, code: string): { ok: boolean; error?: string } {
  const rec = otps().get(email);
  if (!rec) return { ok: false, error: "No code was requested for this email." };
  if (Date.now() > rec.expiresAt) {
    otps().delete(email);
    return { ok: false, error: "This code has expired. Request a new one." };
  }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) {
    otps().delete(email);
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  rec.attempts += 1;
  if (!/^\d{6}$/.test(code) || !safeEqual(rec.hash, sign(`otp:${email}:${code}`))) {
    return { ok: false, error: `Incorrect code. ${OTP_MAX_ATTEMPTS - rec.attempts} attempt(s) left.` };
  }
  otps().delete(email);
  return { ok: true };
}

export async function deliverOtp(email: string, code: string): Promise<"email" | "demo"> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return "demo";
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transport.sendMail({
    from: SMTP_FROM || `ProofPay <${SMTP_USER}>`,
    to: email,
    subject: `Your ProofPay sign-in code: ${code}`,
    text: `Your ProofPay verification code is ${code}. It expires in 10 minutes. If you didn't request it, ignore this email.`,
  });
  return "email";
}

// ---------- Sessions ----------

export interface Session {
  email: string;
  exp: number;
}

export async function createSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export async function requirePageSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export class AuthError extends Error {}

export async function requireApiSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new AuthError("Not signed in");
  return s;
}
