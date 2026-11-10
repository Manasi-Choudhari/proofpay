"use client";

import { useEffect, useRef, useState } from "react";
import type { Job } from "@/lib/types";

type PayPalNamespace = {
  Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void>; close?: () => void };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(clientId: string) {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=authorize&components=buttons&disable-funding=paylater`;
      s.onload = () => resolve();
      s.onerror = () => {
        sdkPromise = null;
        reject(new Error("Failed to load PayPal SDK"));
      };
      document.body.appendChild(s);
    });
  }
  return sdkPromise;
}

export default function PayPalEscrowButton({
  job,
  clientId,
  onFunded,
}: {
  job: Job;
  clientId: string;
  onFunded: (job: Job) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const onFundedRef = useRef(onFunded);
  onFundedRef.current = onFunded;

  useEffect(() => {
    if (!clientId) {
      setError("PAYPAL_CLIENT_ID is not configured on the server.");
      return;
    }
    let cancelled = false;
    let buttons: { close?: () => void } | undefined;
    loadSdk(clientId)
      .then(() => {
        if (cancelled || !ref.current || !window.paypal) return;
        ref.current.innerHTML = "";
        const b = window.paypal.Buttons({
          style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },
          createOrder: async () => {
            const res = await fetch(`/api/jobs/${job.id}/order`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.id;
          },
          onApprove: async ({ orderID }: { orderID: string }) => {
            const res = await fetch(`/api/jobs/${job.id}/authorize`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID }),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error);
              return;
            }
            onFundedRef.current(data);
          },
          onError: (err: Error) => setError(err?.message || "PayPal checkout failed"),
        });
        buttons = b;
        return b.render(ref.current);
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
      buttons?.close?.();
    };
  }, [clientId, job.id]);

  return (
    <div>
      <div ref={ref} className="min-h-12 rounded-xl bg-white p-3" />
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
