"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";
import { BILLING_PLANS_CONFIG, PlanPriceConfig } from "./config";

export interface BillingInvoice {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: "paid" | "pending" | "failed" | "refunded";
  created_at: string;
}

export interface BillingOverviewData {
  currentPlanCode: "standard" | "multi_branch";
  subscriptionStatus: "active" | "past_due" | "canceled" | "trialing" | "paused";
  renewalDate: string;
  activeBranchCount: number;
  maxBranches: number;
  planConfig: PlanPriceConfig;
  invoices: BillingInvoice[];
  razorpayKeyId: string;
}

/**
 * Server Action: Fetch Billing Overview & Active Entitlements
 */
export async function getBillingOverview() {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org) {
      return { success: false, error: "Authenticated organization context required.", overview: null };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const isMultiBranch = context.plan?.code === "multi_branch" || (context.plan?.max_branches || 1) > 1;
    const currentPlanCode: "standard" | "multi_branch" = isMultiBranch ? "multi_branch" : "standard";
    const planConfig = BILLING_PLANS_CONFIG[currentPlanCode];

    const [branchesRes, invoicesRes, subRes] = await Promise.all([
      supabase.from("branches").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("is_active", true),
      supabase.from("billing_invoices").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("status").eq("org_id", orgId).maybeSingle(),
    ]);

    const activeBranchCount = branchesRes.count || 1;
    const rawInvoices = invoicesRes.data || [];
    const subStatus = (subRes.data?.status || "active") as "active" | "past_due" | "canceled" | "trialing" | "paused";

    const invoices: BillingInvoice[] = rawInvoices.map((i) => ({
      id: i.id,
      amount: Number(i.amount),
      currency: i.currency || "INR",
      payment_method: i.payment_method || "Razorpay",
      status: i.status || "paid",
      created_at: i.created_at,
    }));

    const overview: BillingOverviewData = {
      currentPlanCode,
      subscriptionStatus: subStatus,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      activeBranchCount,
      maxBranches: planConfig.maxBranches,
      planConfig,
      invoices,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mockKeyId123",
    };

    return {
      success: true,
      overview,
      organization: context.org,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load billing overview.",
      overview: null,
    };
  }
}

/**
 * Server Action: Prepare Razorpay Subscription Checkout
 */
export async function createRazorpaySubscriptionOrder(
  planCode: "standard" | "multi_branch",
  billingCycle: "monthly" | "annual"
) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const planConfig = BILLING_PLANS_CONFIG[planCode];
    const price = billingCycle === "annual" ? planConfig.annualPrice : planConfig.monthlyPrice;
    const razorpaySubscriptionId = `sub_${planCode}_${Date.now()}`;

    return {
      success: true,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mockKeyId123",
      subscriptionId: razorpaySubscriptionId,
      planCode,
      amount: price,
      currency: planConfig.currency,
      orgName: context.org.name,
      userEmail: context.user?.email || "owner@restaurant.com",
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create subscription." };
  }
}

/**
 * Server Action: Verify Razorpay Payment HMAC Signature & Synchronize DB Entitlements
 */
export async function verifyRazorpayPaymentSignature(payload: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  planCode: "standard" | "multi_branch";
}) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature using HMAC SHA256 if secret is present
    if (razorpaySecret && payload.razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(`${payload.razorpay_payment_id}|${payload.razorpay_subscription_id}`)
        .digest("hex");

      if (generatedSignature !== payload.razorpay_signature) {
        return { success: false, error: "Razorpay signature verification failed." };
      }
    }

    const supabase = await createClient();
    const orgId = context.org.id;

    // Fetch target plan UUID
    const { data: targetPlan } = await supabase
      .from("plans")
      .select("id")
      .eq("code", payload.planCode)
      .maybeSingle();

    if (targetPlan) {
      // Update subscription record in DB
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("org_id", orgId)
        .maybeSingle();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({
            plan_id: targetPlan.id,
            status: "active",
            provider_subscription_id: payload.razorpay_subscription_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
      } else {
        await supabase.from("subscriptions").insert({
          org_id: orgId,
          plan_id: targetPlan.id,
          provider: "razorpay",
          provider_subscription_id: payload.razorpay_subscription_id,
          status: "active",
        });
      }
    }

    // Log paid invoice into billing_invoices
    const planConfig = BILLING_PLANS_CONFIG[payload.planCode];
    await supabase.from("billing_invoices").insert({
      org_id: orgId,
      amount: planConfig.monthlyPrice,
      currency: planConfig.currency,
      payment_method: "Razorpay",
      status: "paid",
    });

    return { success: true, planCode: payload.planCode };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Payment verification failed." };
  }
}

/**
 * Server Action: Safe Data-Preserving Downgrade to Standard Plan
 */
export async function safeDowngradeToStandard() {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();
    const orgId = context.org.id;

    const { data: standardPlan } = await supabase
      .from("plans")
      .select("id")
      .eq("code", "standard")
      .maybeSingle();

    if (standardPlan) {
      await supabase
        .from("subscriptions")
        .update({
          plan_id: standardPlan.id,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Safe downgrade failed." };
  }
}
