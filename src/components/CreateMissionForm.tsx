"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLE = {
  goal:
    "Launch Bean There's new Cold Brew Tonic. I need a punchy product description for our website, the same description " +
    "translated into Hindi for our Mumbai customers, and an SEO title and meta description for the product page.",
  budget: "15",
};

export default function CreateMissionForm() {
  const router = useRouter();
  const [form, setForm] = useState({ goal: "", budget: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: form.goal, budget: Number(form.budget) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/app/missions/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 !p-6 lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Launch an agent mission</h2>
        <button type="button" className="text-xs text-sky-300 hover:underline" onClick={() => setForm(EXAMPLE)}>
          Use example
        </button>
      </div>
      <div>
        <label className="label">What should your agent get done?</label>
        <textarea
          className="input min-h-36"
          placeholder="Describe the outcome. The buyer agent plans tasks and hires seller agents from the marketplace."
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">Spending cap (USD)</label>
        <input
          className="input"
          type="number"
          min={2}
          max={500}
          step="0.01"
          placeholder="15"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
          required
        />
        <p className="mt-1.5 text-xs text-slate-500">Authorized once with PayPal. The agent can never spend more, and unspent money is voided.</p>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button className="btn-primary w-full !py-3" disabled={loading}>
        {loading ? "Buyer agent is planning…" : "Plan mission with AI →"}
      </button>
    </form>
  );
}
