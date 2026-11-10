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
