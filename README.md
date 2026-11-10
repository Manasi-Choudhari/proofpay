# ProofPay: AI escrow that pays when the work is proven

**ProofPay is an AI agent that holds a client's payment in PayPal and releases it to a freelancer only when it has verified that the work meets the contract.**

Freelancers lose money to clients who don't pay. Clients lose money to freelancers who don't deliver. Traditional escrow is slow, expensive, and needs a human to decide when a job is "done". ProofPay makes that decision with AI, moves the money itself through the PayPal APIs, and keeps a human in the loop whenever the agent isn't sure.

## How it works

1. **The client describes the job in plain English.** An LLM (Gemini) turns the request into a contract of 1–3 milestones. Each milestone has a price and objective, verifiable acceptance criteria.
2. **The client funds escrow with PayPal.** ProofPay creates a PayPal order with `intent: AUTHORIZE`, and the client approves it with the PayPal JavaScript SDK button. The money is *held* on the buyer's account, not charged.
3. **The freelancer submits proof**: a URL, notes, and/or a screenshot.
4. **The AI verifier agent checks every criterion.** It reads the delivered page source and the screenshot (multimodal Gemini) and returns pass/fail with cited evidence for each criterion, an overall confidence score, and feedback for the freelancer.
5. **Guardrails decide, and the agent acts on PayPal:**
   - All criteria pass with confidence ≥ 75% and the amount is within the remaining authorization: the agent **captures that milestone's amount** from the authorization (a partial capture, with `final_capture` on the last milestone).
   - Any criterion fails: the money stays in escrow and the freelancer gets specific feedback to fix and resubmit.
   - All criteria pass but confidence is low: the milestone goes to **client review** and the client can approve with one click.
   - Job cancelled: the agent **voids the authorization**, so the client is never charged for unreleased work.
   - Optional: after each capture, the freelancer is paid out via the **PayPal Payouts API**, minus a platform fee.
6. **Every step is logged** in an audit trail with PayPal order, authorization, and capture IDs.

## PayPal integration

| Capability | API | Where |
|---|---|---|
| OAuth2 client credentials | `POST /v1/oauth2/token` | `src/lib/paypal.ts` |
| Escrow order | Orders v2 `POST /v2/checkout/orders` with `intent: AUTHORIZE` | `src/app/api/jobs/[id]/order` |
| Buyer approval | PayPal JavaScript SDK Buttons (`intent=authorize`) | `src/components/PayPalEscrowButton.tsx` |
| Hold funds | `POST /v2/checkout/orders/{id}/authorize` | `src/app/api/jobs/[id]/authorize` |
| Release per milestone | `POST /v2/payments/authorizations/{id}/capture` (partial captures, idempotent `PayPal-Request-Id`) | `src/lib/escrow.ts` |
| Refund unreleased hold | `POST /v2/payments/authorizations/{id}/void` | `src/app/api/jobs/[id]/cancel` |
| Pay freelancer (optional) | Payouts `POST /v1/payments/payouts` | `src/lib/escrow.ts` |

## AI tools used

- **Google Gemini (`gemini-2.5-flash`)** via the Generative Language REST API, using structured JSON output (`responseSchema`):
  - **Contract agent:** converts a free-text job request into milestones with verifiable acceptance criteria and a budget split.
  - **Verification agent:** multimodal review of the deliverable (page source and screenshot), returning per-criterion verdicts with evidence, confidence, and feedback. Its prompt is hardened against prompt injection hidden in deliverables.
- **Groq (Llama 3.3 70B / Llama 4 Scout vision)** is an automatic fallback if Gemini is unavailable.
- **The agent's decisions are bounded by deterministic guardrails** (`src/lib/escrow.ts`): a confidence threshold, a limit of the remaining authorized amount, and human review. The LLM decides *whether the work is done*; the policy layer decides *whether money may move*.

## Run it locally

Requirements: Node.js 20+, a free [PayPal Developer](https://developer.paypal.com/) account, and a [Gemini API key](https://aistudio.google.com/apikey) (free tier works).

```bash
git clone <this repo>
cd proofpay
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # open http://localhost:3000
```

`.env.local`:

```
PAYPAL_CLIENT_ID=...       # developer.paypal.com > Apps & Credentials > Sandbox > your app
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=sandbox
GEMINI_API_KEY=...
GROQ_API_KEY=...           # optional fallback
```

### Demo walkthrough (about 2 minutes)

1. On the home page click **Use example**, then **Draft contract with AI**.
2. Click the PayPal button and log in with a **sandbox Personal account** (developer.paypal.com > Testing Tools > Sandbox Accounts). The escrow meter shows the funds as held.
3. In the first milestone click **draft v1**, then **Submit for AI verification**. The agent rejects it with per-criterion evidence (missing prices, hours, contact info, not mobile-friendly). No money moves.
4. Click **final v2** and submit again. The agent verifies every criterion and **captures the payment on PayPal**. The capture ID appears in the audit trail.
5. Repeat for the remaining milestones, or click **Cancel job** to void the rest of the hold.

## Deploy on Render

The repo includes `render.yaml`. In Render choose **New > Blueprint**, point it at this repo, and fill in the secret env vars.

## Tech stack

Next.js 16 (App Router, TypeScript), Tailwind CSS 4, PayPal Orders v2 / Payments v2 / Payouts REST APIs, PayPal JavaScript SDK, Google Gemini, Groq, and Render.

## License

MIT
