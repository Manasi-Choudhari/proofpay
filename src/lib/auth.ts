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

export function emailConfigured() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function otpEmailHtml(code: string) {
  return `<!doctype html><html><body style="margin:0;background:#0b1220;font-family:Segoe UI,Arial,sans-serif;color:#e2e8f0">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="420" cellpadding="0" cellspacing="0" style="background:#111a2e;border:1px solid #1e293b;border-radius:16px;padding:32px">
<tr><td style="font-size:18px;font-weight:700;color:#fff">ProofPay</td></tr>
<tr><td style="padding-top:20px;font-size:15px;color:#cbd5e1">Use this code to sign in. It expires in 10 minutes.</td></tr>
<tr><td style="padding:24px 0;font-size:36px;letter-spacing:10px;font-weight:700;color:#38bdf8;font-family:Consolas,monospace">${code}</td></tr>
<tr><td style="font-size:13px;color:#64748b">If you didn't try to sign in, you can ignore this email. Never share this code with anyone. ProofPay staff will never ask for it.</td></tr>
</table></td></tr></table></body></html>`;
}

export async function deliverOtp(email: string, code: string): Promise<"email" | "demo"> {
  if (!emailConfigured()) return "demo";
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT || 465);
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS?.replace(/\s+/g, "") },
    connectionTimeout: 10_000,
  });
  await transport.sendMail({
    from: SMTP_FROM || `ProofPay <${SMTP_USER}>`,
    to: email,
    subject: `${code} is your ProofPay sign-in code`,
    text: `Your ProofPay verification code is ${code}. It expires in 10 minutes. If you didn't request it, ignore this email.`,
    html: otpEmailHtml(code),
  });
  return "email";
}

export function clearOtp(email: string) {
  otps().delete(email);
}

// ---------- Per-IP rate limiting ----------

const ipHits = () => ((globalThis as unknown as { __proofpayIpHits?: Map<string, number[]> }).__proofpayIpHits ??= new Map());

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (ipHits().get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (hits.length >= max) {
    ipHits().set(key, hits);
    return false;
  }
  hits.push(now);
  ipHits().set(key, hits);
  return true;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
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
