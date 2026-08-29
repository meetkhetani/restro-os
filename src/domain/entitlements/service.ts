"use server";

import { createClient } from "@/lib/supabase/server";
import { EntitlementKey, Plan, Subscription, SubscriptionStatus } from "./types";

/**
 * Retrieves active subscription and associated plan details for an organization.
 * Defaults to 'standard' plan if no active subscription record is found.
 */
export async function getCurrentPlan(orgId: string): Promise<Plan> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("org_id", orgId)
    .eq("status", "active")
    .maybeSingle();

  if (sub && sub.plan) {
    return sub.plan as Plan;
  }

  // Fallback default plan (Standard)
  const { data: defaultPlan } = await supabase
    .from("plans")
    .select("*")
    .eq("code", "standard")
    .single();

  if (!defaultPlan) {
    return {
      id: "default-standard-id",
      code: "standard",
      name: "Standard Plan",
      description: "Default fallback standard plan",
      max_branches: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return defaultPlan as Plan;
}

/**
 * Retrieves the current subscription status for an organization.
 */
export async function getSubscriptionStatus(orgId: string): Promise<SubscriptionStatus> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("org_id", orgId)
    .maybeSingle();

  return (sub?.status as SubscriptionStatus) || "active";
}

/**
 * Fetches the resolved entitlement value for a specific feature key.
 */
export async function getEntitlement(orgId: string, featureKey: EntitlementKey): Promise<unknown> {
  const plan = await getCurrentPlan(orgId);
  const supabase = await createClient();

  const { data: entitlement } = await supabase
    .from("plan_entitlements")
    .select("entitlement_value")
    .eq("plan_id", plan.id)
    .eq("entitlement_key", featureKey)
    .maybeSingle();

  if (entitlement) {
    return entitlement.entitlement_value;
  }

  // Built-in defaults per plan code
  if (featureKey === "branches.max") return plan.max_branches;
  if (featureKey === "analytics.cross_branch") return plan.code === "multi_branch";
  if (featureKey === "staff.multi_branch") return plan.code === "multi_branch";
  return true;
}

/**
 * Checks whether an organization is entitled to access a specific feature.
 * MUST be called by business modules instead of inspecting raw plan strings.
 */
export async function canAccess(orgId: string, featureKey: EntitlementKey): Promise<boolean> {
  const val = await getEntitlement(orgId, featureKey);
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return Boolean(val);
}

/**
 * Returns maximum branch allowance for an organization (-1 means unlimited).
 */
export async function getBranchLimit(orgId: string): Promise<number> {
  const limit = await getEntitlement(orgId, "branches.max");
  if (typeof limit === "number") return limit;
  const plan = await getCurrentPlan(orgId);
  return plan.max_branches;
}

/**
 * Checks whether an organization can create an additional branch/location
 * based on current count and active plan entitlement.
 */
export async function canCreateBranch(orgId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  reason?: string;
}> {
  const supabase = await createClient();
  const maxLimit = await getBranchLimit(orgId);

  // If maxLimit is -1, multi-branch unlimited access is granted
  if (maxLimit === -1) {
    const { count } = await supabase
      .from("locations")
      .select("*", { count: "exact", head: true });

    return {
      allowed: true,
      currentCount: count || 0,
      maxLimit: -1,
    };
  }

  // Count existing locations under restaurants of the organization
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id")
    .eq("org_id", orgId);

  const restaurantIds = (restaurants || []).map((r) => r.id);

  let currentCount = 0;
  if (restaurantIds.length > 0) {
    const { count } = await supabase
      .from("locations")
      .select("*", { count: "exact", head: true })
      .in("restaurant_id", restaurantIds);
    currentCount = count || 0;
  }

  const allowed = currentCount < maxLimit;

  return {
    allowed,
    currentCount,
    maxLimit,
    reason: allowed
      ? undefined
      : `Branch limit reached (${currentCount}/${maxLimit}). Upgrade to Multi-Branch plan to manage additional branches.`,
  };
}
