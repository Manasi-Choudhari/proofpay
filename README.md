# ProofPay: pay only for proven work, by humans or AI agents

**ProofPay is an AI escrow layer on PayPal.** Money is *authorized* (held, not charged) with PayPal, an AI verification agent checks the delivered work against the contract, and the agent itself captures or voids the payment, inside guardrails enforced in code.

It works in two modes:

1. **Human work (freelance escrow).** A client posts a job. AI drafts milestones with verifiable acceptance criteria, the client funds escrow with PayPal, the freelancer submits proof, and the AI releases each milestone (capture plus an automatic PayPal Payout to the freelancer) or sends back precise feedback.
2. **Agent-to-agent commerce (missions).** A human authorizes a spending cap once. A buyer agent plans the mission, hires seller agents from a marketplace, verifies every deliverable, pays per task via PayPal capture, refuses junk at $0, blocks sellers that overcharge, and voids whatever budget is left.

> Built for the PayPal AI Hackathon. Runs entirely on the PayPal **sandbox**; no real money moves.

---

## Why

- Freelancers chase late or missing payments; clients pay for work that never arrives. Escrow exists but is slow and needs a human to decide when work is "done".
- AI agents are starting to buy services from other agents, but nobody wants to hand an agent a blank cheque. Agents need a way to **pay only for verified output, never twice, never above the listed price, never over budget**.

ProofPay is that trust layer, built on PayPal's authorize, capture and void primitives.

## Features

| Area | What it does |
|---|---|
| Landing + secure sign-in | Public landing page; app behind **email OTP** sign-in: 6-digit code, 10-min expiry, 5 attempts, single use, 30 s resend cooldown, per-IP rate limits, HMAC-signed httpOnly session cookies. Every API route checks the session **and resource ownership**. |
| AI contract agent | Turns a plain-English job into 2 milestones with objective, checkable criteria and a budget split. |
| PayPal escrow | Orders v2 `intent: AUTHORIZE` with the PayPal JS SDK button. Funds are held on the buyer's account. |
| AI verification agent | Reads the delivered page source, notes and/or a **screenshot** (multimodal), returns pass/fail per criterion with plain-English evidence, a confidence score, and feedback. Hardened against prompt injection. |
| Guardrails | Auto-release only if every criterion passes, confidence ≥ 75%, and the amount ≤ remaining authorization; otherwise **human review** (one-click approve). |
| Settlement | **Partial captures** per milestone (`final_capture` on the last), **PayPal Payouts** to the freelancer minus a 5% platform fee, **void** to return unreleased funds. Idempotent `PayPal-Request-Id` on every capture. |
| Agent marketplace | 7 seller agents across copywriting, translation, research and SEO, with live hire/verified/earned stats. Includes **BargainBot** (cheap and low quality) and **QuickRank** (overcharges) to demonstrate the guardrails. |
| Agent missions | Buyer agent plans tasks, shortlists sellers cheapest-first, then hire → verify → capture or refuse → re-hire, then voids the unspent budget. Live step-by-step UI with a guardrail checklist on every attempt. |
| AG Grid ledger | Every authorization, capture, payout, void and **refused payment** across jobs and missions, with PayPal IDs, AI confidence bars, quick search, type filters, column filters, pagination, a pinned totals row and **CSV export**. |
| Safe URL fetching | The verifier only fetches public http(s) URLs: DNS resolution blocks private, loopback and link-local addresses (SSRF protection), redirects are re-validated, with size and time limits. |

## PayPal integration

| Capability | API | Code |
|---|---|---|
| OAuth2 client credentials | `POST /v1/oauth2/token` | `src/lib/paypal.ts` |
| Escrow / spending-cap order | `POST /v2/checkout/orders` (`intent: AUTHORIZE`) | `api/jobs/[id]/order`, `api/missions/[id]/order` |
| Buyer approval | PayPal JavaScript SDK Buttons (`intent=authorize`) | `src/components/PayPalEscrowButton.tsx` |
| Hold funds | `POST /v2/checkout/orders/{id}/authorize` | `api/*/[id]/authorize` |
| Release per milestone / per agent task | `POST /v2/payments/authorizations/{id}/capture` (multiple partial captures, idempotency keys) | `src/lib/escrow.ts`, `src/lib/agents.ts` |
| Pay the freelancer | `POST /v1/payments/payouts` | `src/lib/escrow.ts` |
| Return unused funds | `POST /v2/payments/authorizations/{id}/void` | `api/*/[id]/cancel`, `src/lib/agents.ts` |

## AI tools used

- **Groq** (primary, fast): `openai/gpt-oss-120b` for contract drafting, mission planning, seller-agent work and verification; `qwen/qwen3.8-27b` for screenshot (vision) verification.
- **Google Gemini** (automatic fallback): `gemini-3.8-flash`, falling back to `gemini-3.5-flash` and then `gemini-flash-latest`, with structured JSON output via `responseSchema`.
- Every AI call has a timeout and provider failover (`src/lib/ai.ts`). Verifier output is normalized against the exact contract criteria so a malformed model response can never release money.
- **The LLM decides whether the work is done; deterministic code decides whether money may move** (`src/lib/escrow.ts`, `src/lib/agents.ts`).

## Sponsor tools

- **AG Grid** (Community, v36): the PayPal ledger (`src/components/LedgerGrid.tsx`) with custom cell renderers, the theming API, quick filter, column filters, a pinned totals row, pagination and CSV export.
- **Render**: one-click deploy via `render.yaml`.

---

## Run it locally

Requirements: Node.js 20+, a free [PayPal Developer](https://developer.paypal.com/) account, and a [Groq](https://console.groq.com/keys) and/or [Gemini](https://aistudio.google.com/apikey) API key.

```bash
git clone https://github.com/Manasi-Choudhari/proofpay.git
cd proofpay
npm install
cp .env.example .env.local   # fill in the values (see below)
npm run dev                  # http://localhost:3000
```

**PayPal sandbox setup:** in the Developer Dashboard go to Testing Tools → Sandbox Accounts and create a **United States Business** account and a **United States Personal** account. Then in Apps & Credentials (Sandbox) create a Merchant app linked to the US business account and copy its Client ID and Secret. (Sandbox accounts from some countries, e.g. India, can't use the authorize/capture flow.)

**Email codes (optional):** set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=<gmail address>` and `SMTP_PASS=<16-char App Password from myaccount.google.com/apppasswords>`. Without SMTP, the sign-in code is shown on screen ("sandbox inbox" mode) so the app stays testable.

## Judge walkthrough (about 3 minutes)

1. Open the app → **Get started** → enter any email → enter the 6-digit code.
2. **Human jobs** → **Use example** (optionally put your sandbox Personal email as the freelancer) → **Draft contract with AI** → pay with the **US sandbox Personal account**.
3. On milestone 1 click **draft v1** → **Submit**. It is rejected with evidence and no money moves. Click **final v2** → **Submit**. It is verified and **captured on PayPal** (plus a Payout if you set a freelancer email). Repeat for milestone 2.
4. **Agent missions** → **Use example** → **Plan mission with AI** → pay → **Start autonomous mission**. Watch BargainBot get refused for junk, QuickRank get blocked for overcharging, good agents get paid, and the rest of the budget get voided.
5. **Ledger** shows every PayPal transaction and refusal in AG Grid. Try the filters and **Export CSV**.

## Deploy on Render

New → Blueprint → select this repo (it uses `render.yaml`) → fill in `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `SMTP_USER` and `SMTP_PASS`.

## Limitations and next steps

This is a hackathon prototype, not a production system:

- Data is kept in memory plus a JSON file, so it resets when the server restarts. Next: Postgres.
- One signed-in user acts as both client and freelancer in the demo. Next: freelancer accounts or signed share links.
- No PayPal webhooks yet; authorizations expire after PayPal's honor period. Next: webhook-driven state and re-authorization.
- Seller agents run in-process. Next: external agents over HTTP with signed requests.
- AI verification can be wrong; confidence thresholds and human review limit the impact.

## Tech stack

Next.js 16 (App Router, TypeScript), Tailwind CSS 4, PayPal Orders v2 / Payments v2 / Payouts REST APIs, PayPal JavaScript SDK, Groq, Google Gemini, AG Grid Community, Nodemailer, Render.

## License

MIT
