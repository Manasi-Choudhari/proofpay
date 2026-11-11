export type JobStatus = "draft" | "funded" | "completed" | "cancelled";
export type MilestoneStatus = "pending" | "rejected" | "needs_review" | "released";
export type Decision = "release" | "reject" | "review";

export interface CriterionResult {
  criterion: string;
  pass: boolean;
  evidence: string;
}

export interface Verdict {
  at: string;
  provider: string;
  proofUrl?: string;
  proofText?: string;
  hasImage: boolean;
  results: CriterionResult[];
  confidence: number;
  summary: string;
  feedback: string;
  decision: Decision;
  policyNote: string;
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  criteria: string[];
  status: MilestoneStatus;
  attempts: Verdict[];
  captureId?: string;
  payoutBatchId?: string;
}

export interface JobEvent {
  at: string;
  kind: "ai" | "paypal" | "policy" | "user";
  message: string;
  ref?: string;
}

export interface Job {
  id: string;
  ownerEmail: string;
  createdAt: string;
  description: string;
  title: string;
  summary: string;
  clientName: string;
  freelancerName: string;
  freelancerEmail: string;
  currency: string;
  total: number;
  milestones: Milestone[];
  status: JobStatus;
  orderId?: string;
  authorizationId?: string;
  authorizationExpires?: string;
  capturedTotal: number;
  events: JobEvent[];
}

export type LedgerType = "Authorization" | "Capture" | "Void" | "Payout" | "Refused";

export interface LedgerEntry {
  id: string;
  at: string;
  ownerEmail: string;
  type: LedgerType;
  amount: number;
  currency: string;
  paypalRef?: string;
  counterparty: string;
  source: "Human job" | "Agent mission";
  sourceId: string;
  sourceTitle: string;
  aiConfidence?: number;
  note: string;
}

export type AgentSkill = "copywriting" | "translation" | "research" | "seo";

export interface SellerAgent {
  id: string;
  name: string;
  skill: AgentSkill;
  price: number;
  tagline: string;
  persona: string;
  lowQuality?: boolean;
  /** Quoted price at hire time = price × quoteMultiplier (simulates sellers that try to overcharge). */
  quoteMultiplier?: number;
}

export interface AgentStats {
  hires: number;
  paid: number;
  refused: number;
  earned: number;
}

export type TaskStatus = "queued" | "working" | "verifying" | "paid" | "refused" | "skipped";

export interface TaskAttempt {
  agentId: string;
  agentName: string;
  price: number;
  output: string;
  results: CriterionResult[];
  confidence: number;
  paid: boolean;
  captureId?: string;
  guardrails: { label: string; ok: boolean }[];
  note: string;
  provider: string;
}

export interface MissionTask {
  id: string;
  title: string;
  skill: AgentSkill;
  brief: string;
  criteria: string[];
  status: TaskStatus;
  candidates: string[];
  attempts: TaskAttempt[];
}

export type MissionStatus = "planned" | "funded" | "running" | "completed" | "cancelled";

export interface Mission {
  id: string;
  ownerEmail: string;
  createdAt: string;
  goal: string;
  title: string;
  budget: number;
  currency: string;
  spent: number;
  status: MissionStatus;
  tasks: MissionTask[];
  orderId?: string;
  authorizationId?: string;
  events: JobEvent[];
}
