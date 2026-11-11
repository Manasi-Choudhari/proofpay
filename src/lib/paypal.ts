const BASE =
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

export class PayPalError extends Error {
  constructor(message: string, public status: number, public details: unknown) {
    super(message);
  }
}

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new PayPalError("PayPal auth failed", res.status, data);
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function call<T = Record<string, unknown>>(
  method: string,
  path: string,
  body?: unknown,
  requestId?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await accessToken()}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (requestId) headers["PayPal-Request-Id"] = requestId;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail = data?.details?.[0]?.description || data?.message || res.statusText;
    throw new PayPalError(`PayPal ${method} ${path} failed: ${detail}`, res.status, data);
  }
  return data as T;
}

const money = (value: number, currency: string) => ({
  currency_code: currency,
  value: value.toFixed(2),
});

export async function createAuthorizeOrder(opts: {
  refId: string;
  title: string;
  amount: number;
  currency: string;
}) {
  const order = await call<{ id: string; status: string }>("POST", "/v2/checkout/orders", {
    intent: "AUTHORIZE",
    purchase_units: [
      {
        reference_id: opts.refId,
        custom_id: opts.refId,
        description: `ProofPay escrow: ${opts.title}`.slice(0, 127),
        amount: money(opts.amount, opts.currency),
      },
    ],
  });
  return order;
}

export async function authorizeOrder(orderId: string) {
  const res = await call<{
    status: string;
    payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
    purchase_units: {
      payments?: { authorizations?: { id: string; status: string; expiration_time?: string }[] };
    }[];
  }>("POST", `/v2/checkout/orders/${orderId}/authorize`, {});
  const auth = res.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!auth) throw new Error("PayPal did not return an authorization");
  return { authorization: auth, payer: res.payer };
}

export async function captureAuthorization(opts: {
  authorizationId: string;
  amount: number;
  currency: string;
  finalCapture: boolean;
  invoiceId: string;
  note: string;
}) {
  return call<{ id: string; status: string }>(
    "POST",
    `/v2/payments/authorizations/${opts.authorizationId}/capture`,
    {
      amount: money(opts.amount, opts.currency),
      final_capture: opts.finalCapture,
      invoice_id: opts.invoiceId,
      note_to_payer: opts.note.slice(0, 255),
    },
    `capture-${opts.invoiceId}`,
  );
}

export async function voidAuthorization(authorizationId: string) {
  await call("POST", `/v2/payments/authorizations/${authorizationId}/void`);
}

export async function sendPayout(opts: {
  batchId: string;
  email: string;
  amount: number;
  currency: string;
  note: string;
}) {
  const res = await call<{ batch_header: { payout_batch_id: string; batch_status: string } }>(
    "POST",
    "/v1/payments/payouts",
    {
      sender_batch_header: {
        sender_batch_id: opts.batchId,
        email_subject: "You've been paid via ProofPay",
        email_message: opts.note,
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: { value: opts.amount.toFixed(2), currency: opts.currency },
          receiver: opts.email,
          note: opts.note,
          sender_item_id: opts.batchId,
        },
      ],
    },
  );
  return res.batch_header;
}

export const paypalDashboardBase =
  process.env.PAYPAL_ENV === "live" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com";
