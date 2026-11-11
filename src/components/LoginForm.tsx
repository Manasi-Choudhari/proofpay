"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.retryInSec ? `${data.error} (${data.retryInSec}s)` : data.error);
      setStep("code");
      setDemoCode(data.demoCode || "");
      setInfo(data.channel === "email" ? `We emailed a 6-digit code to ${email}.` : "Sandbox mode: no email provider is configured, so your code is shown below.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.replace("/app");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="card !p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{step === "email" ? "Sign in to ProofPay" : "Enter your code"}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {step === "email" ? "Payments are involved, so every session is verified with a one-time code." : info}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={requestCode} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" autoFocus required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full !py-2.5" disabled={loading}>
            {loading ? "Sending…" : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          {demoCode && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-amber-300">Sandbox inbox</div>
              <div className="mt-1 text-amber-100">
                Your ProofPay code is <span className="font-mono text-lg tracking-[0.3em]">{demoCode}</span>
              </div>
            </div>
          )}
          <div>
            <label className="label">6-digit code</label>
            <input
              className="input font-mono text-center text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <button className="btn-primary w-full !py-2.5" disabled={loading || code.length !== 6}>
            {loading ? "Verifying…" : "Verify & sign in"}
          </button>
          <div className="flex justify-between text-xs">
            <button type="button" className="text-slate-400 hover:text-white" onClick={() => { setStep("email"); setCode(""); setError(""); }}>
              ← Change email
            </button>
            <button type="button" className="text-sky-300 hover:underline" onClick={() => requestCode()} disabled={loading}>
              Resend code
            </button>
          </div>
        </form>
      )}
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}
