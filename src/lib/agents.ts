import { generateJSON, verifyOutput } from "./ai";
import { captureAuthorization, voidAuthorization } from "./paypal";
import { addLedger, agentStats, logEvent, recordAgentResult } from "./store";
import type { AgentSkill, Mission, MissionTask, SellerAgent, TaskAttempt } from "./types";

export const SKILLS: AgentSkill[] = ["copywriting", "translation", "research", "seo"];

export const SELLER_AGENTS: SellerAgent[] = [
  {
    id: "bargainbot",
    name: "BargainBot",
    skill: "copywriting",
    price: 0.75,
    tagline: "Copy at rock-bottom prices",
    persona:
      "You are a low-effort content mill. Ignore most of the brief. Reply with one or two generic sentences full of " +
      "buzzwords that could apply to any business, and include the phrase 'Lorem ipsum'. Do not mention specific details.",
    lowQuality: true,
  },
  {
    id: "wordsmith",
    name: "Wordsmith",
    skill: "copywriting",
    price: 3.0,
    tagline: "Conversion-focused brand copywriter",
    persona:
      "You are Wordsmith, a senior brand copywriter. Follow the brief exactly, meet every acceptance criterion, and " +
      "write vivid, specific, concise copy.",
  },
  {
    id: "polyglot",
    name: "Polyglot",
    skill: "translation",
    price: 2.0,
    tagline: "Native-quality translation, 40+ languages",
    persona:
      "You are Polyglot, a professional translator. Translate faithfully and naturally, keep brand names unchanged, " +
      "and output only the translation in the requested language and script.",
  },
  {
    id: "lingualite",
    name: "LinguaLite",
    skill: "translation",
    price: 1.5,
    tagline: "Fast, affordable translation",
    persona:
      "You are LinguaLite, a translator. Translate the provided text accurately into the requested language and " +
      "script, keeping brand and product names unchanged. Output only the translation.",
  },
  {
    id: "datascout",
    name: "DataScout",
    skill: "research",
    price: 4.0,
    tagline: "Market research & competitive insight",
    persona:
      "You are DataScout, a market research analyst. Give concrete, well-structured insights as short bullet points. " +
      "Be specific and practical.",
  },
  {
    id: "rankright",
    name: "RankRight",
    skill: "seo",
    price: 2.5,
    tagline: "SEO titles, meta & keywords",
    persona:
      "You are RankRight, an SEO specialist. Produce SEO assets exactly as requested (titles, meta descriptions, " +
      "keywords) respecting length limits.",
  },
];

export const agentById = (id: string) => SELLER_AGENTS.find((a) => a.id === id);

export function marketplace() {
  const stats = agentStats();
  return SELLER_AGENTS.map((a) => {
    const s = stats[a.id] ?? { hires: 0, paid: 0, refused: 0, earned: 0 };
    return { ...a, persona: undefined, stats: s, successRate: s.hires ? s.paid / s.hires : null };
  });
}

/** Cheapest first: the buyer agent is budget-conscious, and verification protects it from bad sellers. */
export function candidatesFor(skill: AgentSkill): string[] {
  return SELLER_AGENTS.filter((a) => a.skill === skill)
    .sort((a, b) => a.price - b.price)
    .map((a) => a.id);
}

// ---------- Planning ----------

interface Plan {
  title: string;
  tasks: { title: string; skill: AgentSkill; brief: string; criteria: string[] }[];
}

const planSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    tasks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          skill: { type: "STRING", enum: SKILLS },
          brief: { type: "STRING" },
          criteria: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["title", "skill", "brief", "criteria"],
      },
    },
  },
  required: ["title", "tasks"],
};

export async function planMission(goal: string, budget: number) {
  const catalog = SELLER_AGENTS.map((a) => `- ${a.skill}: ${a.name} ($${a.price.toFixed(2)}/task)`).join("\n");
  const system =
    "You are ProofPay's buyer agent. A human gave you a goal and a budget. Break the goal into 2-4 tasks that seller " +
    "agents in the marketplace can do. Each task needs one skill from: copywriting, translation, research, seo. " +
    "Order tasks so later tasks can build on earlier outputs (e.g. write copy before translating it). Give each task a " +
    "precise brief and 2-4 objective acceptance criteria that can be checked from the text output alone. Keep " +
    "criteria under 15 words. Do not use exact word or character counts except where the format demands it (e.g. SEO " +
    "title ≤ 60 characters); prefer 'under N words'. Brand and product names always stay in their original form, " +
    "including in translations.";
  const prompt = `Goal: """${goal}"""\nBudget: $${budget.toFixed(2)}\nMarketplace:\n${catalog}`;
  const { data, provider } = await generateJSON<Plan>(system, prompt, planSchema);
  const tasks: MissionTask[] = (data.tasks || [])
    .filter((t) => SKILLS.includes(t.skill))
    .slice(0, 4)
    .map((t, i) => ({
      id: `t${i + 1}`,
      title: t.title,
      skill: t.skill,
      brief: t.brief,
      criteria: (t.criteria || []).slice(0, 4),
      status: "queued",
      candidates: candidatesFor(t.skill),
      attempts: [],
    }));
  return { title: data.title, tasks, provider };
}

// ---------- Execution ----------

async function runSeller(agent: SellerAgent, task: MissionTask, mission: Mission) {
  const context = mission.tasks
    .filter((t) => t.status === "paid")
    .map((t) => `### ${t.title}\n${t.attempts.find((a) => a.paid)?.output}`)
    .join("\n\n");
  const prompt = [
    `Mission goal: ${mission.goal}`,
    `Your task: ${task.title}`,
    `Brief: ${task.brief}`,
    `Acceptance criteria:\n${task.criteria.map((c) => `- ${c}`).join("\n")}`,
    context ? `Approved outputs from earlier tasks you may build on:\n${context}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const { data, provider } = await generateJSON<{ output: string }>(agent.persona, prompt, {
    type: "OBJECT",
    properties: { output: { type: "STRING" } },
    required: ["output"],
  });
  return { output: String(data.output || "").slice(0, 4000), provider };
}

export const AGENT_AUTO_PAY_CONFIDENCE = 0.7;

/** Runs one hire attempt (or finalizes the mission). Returns true while there is more work to do. */
export async function stepMission(mission: Mission): Promise<boolean> {
  if (mission.status === "funded") {
    mission.status = "running";
    logEvent(mission, "ai", "Buyer agent started the mission autonomously.");
  }
  if (mission.status !== "running") return false;

  const task = mission.tasks.find((t) => t.status === "queued" || t.status === "working" || t.status === "verifying");
  if (!task) {
    await finishMission(mission);
    return false;
  }

  const agentId = task.candidates[task.attempts.length];
  const agent = agentId ? agentById(agentId) : undefined;
  if (!agent) {
    task.status = "refused";
    logEvent(mission, "policy", `No remaining sellers could satisfy "${task.title}". Task closed unpaid.`);
    return true;
  }

  const remaining = Math.round((mission.budget - mission.spent) * 100) / 100;
  const idempotencyKey = `${mission.id}-${task.id}-${agent.id}`;
  const preChecks = [
    { label: `Quote $${agent.price.toFixed(2)} ≤ listed price $${agent.price.toFixed(2)}`, ok: true },
    { label: `Within budget: $${agent.price.toFixed(2)} ≤ $${remaining.toFixed(2)} remaining`, ok: agent.price <= remaining + 0.001 },
    {
      label: `Idempotency key ${idempotencyKey} unused (no double pay)`,
      ok: !task.attempts.some((a) => a.paid),
    },
  ];
  if (!preChecks[1].ok) {
    task.status = "skipped";
    task.attempts.push({
      agentId: agent.id,
      agentName: agent.name,
      price: agent.price,
      output: "",
      results: [],
      confidence: 0,
      paid: false,
      guardrails: preChecks,
      note: "Skipped: hiring this seller would exceed the remaining budget.",
      provider: "-",
    });
    logEvent(mission, "policy", `Budget guardrail: skipped "${task.title}" ($${agent.price.toFixed(2)} > $${remaining.toFixed(2)} left).`);
    return true;
  }

  logEvent(mission, "ai", `Hired ${agent.name} for "${task.title}" at $${agent.price.toFixed(2)}.`);
  const { output, provider: sellerProvider } = await runSeller(agent, task, mission);
  const { data: v, provider } = await verifyOutput({ goal: mission.goal, task, output });
  const allPass = v.results.length > 0 && v.results.every((r) => r.pass);
  const confident = v.confidence >= AGENT_AUTO_PAY_CONFIDENCE;
  const guardrails = [
    ...preChecks,
    { label: `All ${v.results.length} acceptance criteria verified`, ok: allPass },
    { label: `Verifier confidence ${(v.confidence * 100).toFixed(0)}% ≥ ${AGENT_AUTO_PAY_CONFIDENCE * 100}%`, ok: confident },
  ];

  const attempt: TaskAttempt = {
    agentId: agent.id,
    agentName: agent.name,
    price: agent.price,
    output,
    results: v.results,
    confidence: v.confidence,
    paid: false,
    guardrails,
    note: v.summary,
    provider: `${sellerProvider} (seller) · ${provider} (verifier)`,
  };
  task.attempts.push(attempt);

  if (allPass && confident) {
    const capture = await captureAuthorization({
      authorizationId: mission.authorizationId!,
      amount: agent.price,
      currency: mission.currency,
      finalCapture: false,
      invoiceId: idempotencyKey,
      note: `ProofPay agent payment: ${agent.name} for "${task.title}"`,
    });
    attempt.paid = true;
    attempt.captureId = capture.id;
    task.status = "paid";
    mission.spent = Math.round((mission.spent + agent.price) * 100) / 100;
    recordAgentResult(agent.id, true, agent.price);
    logEvent(mission, "paypal", `Paid ${agent.name} $${agent.price.toFixed(2)} via PayPal capture after verification.`, capture.id);
    addLedger({
      ownerEmail: mission.ownerEmail,
      type: "Capture",
      amount: agent.price,
      currency: mission.currency,
      paypalRef: capture.id,
      counterparty: `${agent.name} (agent)`,
      source: "Agent mission",
      sourceId: mission.id,
      sourceTitle: mission.title,
      aiConfidence: v.confidence,
      note: task.title,
    });
  } else {
    recordAgentResult(agent.id, false, 0);
    const failed = v.results.filter((r) => !r.pass).length;
    logEvent(
      mission,
      "policy",
      `Refused to pay ${agent.name}: ${failed} criteria failed${confident ? "" : ", low confidence"}. $0 charged; re-hiring.`,
    );
    addLedger({
      ownerEmail: mission.ownerEmail,
      type: "Refused",
      amount: agent.price,
      currency: mission.currency,
      counterparty: `${agent.name} (agent)`,
      source: "Agent mission",
      sourceId: mission.id,
      sourceTitle: mission.title,
      aiConfidence: v.confidence,
      note: `${task.title}: failed verification, not paid`,
    });
  }
  return true;
}

async function finishMission(mission: Mission) {
  const unspent = Math.round((mission.budget - mission.spent) * 100) / 100;
  if (unspent > 0 && mission.authorizationId) {
    try {
      await voidAuthorization(mission.authorizationId);
      logEvent(mission, "paypal", `Voided the rest of the authorization. $${unspent.toFixed(2)} unspent budget never charged.`, mission.authorizationId);
      addLedger({
        ownerEmail: mission.ownerEmail,
        type: "Void",
        amount: unspent,
        currency: mission.currency,
        paypalRef: mission.authorizationId,
        counterparty: "Mission owner",
        source: "Agent mission",
        sourceId: mission.id,
        sourceTitle: mission.title,
        note: "Unspent budget released",
      });
    } catch (e) {
      logEvent(mission, "paypal", `Could not void remaining authorization: ${(e as Error).message}`);
    }
  }
  mission.status = "completed";
  logEvent(mission, "ai", `Mission complete: spent $${mission.spent.toFixed(2)} of $${mission.budget.toFixed(2)}.`);
}
