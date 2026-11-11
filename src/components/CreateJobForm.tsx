"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLE = {
  description:
    "I need a one-page website for my coffee shop \"Bean There\". It needs a hero section with the shop name and a tagline, " +
    "a menu with at least 4 drinks and their prices, our opening hours, and a contact section with address and phone. " +
    "It must work well on mobile phones.",
  budget: "300",
  freelancerName: "Priya (freelance web dev)",
  freelancerEmail: "",
};

export default function CreateJobForm() {
  const router = useRouter();
  const [form, setForm] = useState({ description: "", budget: "", freelancerName: "", freelancerEmail: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: Number(form.budget) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/app/jobs/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 !p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Post a job into escrow</h2>
        <button type="button" className="text-xs text-sky-300 hover:underline" onClick={() => setForm(EXAMPLE)}>
          Use example
        </button>
      </div>
      <div>
        <label className="label">What do you need done?</label>
        <textarea
          className="input min-h-36"
          placeholder="Describe the work in plain English. The AI will turn it into milestones with checkable criteria."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Budget (USD)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={10000}
            step="0.01"
            placeholder="300"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Freelancer name</label>
          <input
            className="input"
            placeholder="Priya"
            value={form.freelancerName}
            onChange={(e) => setForm({ ...form, freelancerName: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="label">Freelancer PayPal email (optional, auto-paid via PayPal Payouts)</label>
        <input
          className="input"
          type="email"
          placeholder="freelancer@example.com"
          value={form.freelancerEmail}
          onChange={(e) => setForm({ ...form, freelancerEmail: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button className="btn-primary w-full !py-3" disabled={loading}>
        {loading ? "AI is drafting your contract…" : "Draft contract with AI →"}
      </button>
    </form>
  );
}
