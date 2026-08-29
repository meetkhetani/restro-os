export type PlanCode = "standard" | "multi_branch";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing" | "paused";

export type EntitlementKey =
  | "branches.max"
  | "analytics.cross_branch"
  | "analytics.single_branch"
  | "pos.enabled"
  | "inventory.enabled"
  | "staff.multi_branch"
  | "ai.assistant";

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  max_branches: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanEntitlement {
  id: string;
  plan_id: string;
  entitlement_key: EntitlementKey;
  entitlement_value: unknown;
}

export interface Subscription {
  id: string;
  org_id: string;
  plan_id: string;
  provider: string;
  provider_subscription_id?: string | null;
  status: SubscriptionStatus;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}
