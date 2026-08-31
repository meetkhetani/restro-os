"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";
import { BILLING_PLANS_CONFIG, PlanPriceConfig } from "./config";
import { createNotification } from "../notifications/actions";

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
  isCredentialsPresent: boolean;
}

export interface RazorpayOrderErrorPayload {
  success: false;
  errorCode: "ORDER_CREATION_FAILED" | "RAZORPAY_CREDENTIALS_MISSING" | "UNAUTHENTICATED";
  provider: "razorpay";
  providerCode?: string;
  providerDescription?: string;
  providerField?: string | null;
  providerSource?: string | null;
  providerStep?: string | null;
  providerReason?: string | null;
  httpStatus?: number;
  error: string;
}

export interface RazorpayOrderSuccessPayload {
  success: true;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  planCode: "standard" | "multi_branch";
  orgName: string;
  userEmail: string;
}

export type CreateRazorpayOrderResult = RazorpayOrderSuccessPayload | RazorpayOrderErrorPayload;

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

    const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    const isCredentialsPresent = Boolean(keyId && keySecret);

    const overview: BillingOverviewData = {
      currentPlanCode,
      subscriptionStatus: subStatus,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      activeBranchCount,
      maxBranches: planConfig.maxBranches,
      planConfig,
      invoices,
      razorpayKeyId: keyId,
      isCredentialsPresent,
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
 * Server Action: Create Official Razorpay Order via Direct Razorpay REST API
 * (Step 5 of Razorpay Standard Checkout Architecture)
 */
export async function createRazorpayOrder(
  planCode: "standard" | "multi_branch",
  billingCycle: "monthly" | "annual"
): Promise<CreateRazorpayOrderResult> {
  try {
    const context = await resolveUserContext();
    if (!context.org) {
      return {
        success: false,
        errorCode: "UNAUTHENTICATED",
        provider: "razorpay",
        error: "Authenticated organization context required.",
      };
    }

    const orgId = context.org.id;
    const planConfig = BILLING_PLANS_CONFIG[planCode];
    const amountInRupees = billingCycle === "annual" ? planConfig.annualPrice : planConfig.monthlyPrice;
    const amountInPaise = amountInRupees * 100; // Integer subunit for INR

    const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!keyId || !keySecret) {
      console.error("[RAZORPAY_ORDER_ERROR] Credentials missing on server.");
      return {
        success: false,
        errorCode: "RAZORPAY_CREDENTIALS_MISSING",
        provider: "razorpay",
        error: "Razorpay Key ID or Key Secret is missing in Vercel environment settings. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      };
    }

    // Receipt format: <= 40 chars, alphanumeric ASCII only
    const receipt = `restro_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const mode = keyId.startsWith("rzp_test_") ? "test" : "live";

    console.log("[RAZORPAY_ORDER_REQUEST]", {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      mode,
      keyIdPrefix: keyId.substring(0, 8),
    });

    // Call Razorpay REST API (POST https://api.razorpay.com/v1/orders) using Basic Auth
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt,
      }),
      cache: "no-store",
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errObj = responseData.error || {};
      const providerCode = errObj.code || "BAD_REQUEST_ERROR";
      const providerDescription = errObj.description || responseData.message || "Razorpay API Order creation failed";
      const providerField = errObj.field || null;
      const providerSource = errObj.source || null;
      const providerStep = errObj.step || null;
      const providerReason = errObj.reason || null;

      console.error("[RAZORPAY_ORDER_ERROR]", {
        httpStatus: response.status,
        providerCode,
        providerDescription,
        providerField,
        providerSource,
        providerStep,
        providerReason,
      });

      return {
        success: false,
        errorCode: "ORDER_CREATION_FAILED",
        provider: "razorpay",
        providerCode,
        providerDescription,
        providerField,
        providerSource,
        providerStep,
        providerReason,
        httpStatus: response.status,
        error: `Razorpay API HTTP ${response.status} [${providerCode}]: ${providerDescription}${providerField ? ` (Field: ${providerField})` : ""}`,
      };
    }

    const orderId = responseData.id as string;
    console.log("[RAZORPAY_ORDER_SUCCESS]", {
      orderId,
      amount: responseData.amount,
      currency: responseData.currency,
      status: responseData.status,
    });

    // Log pending invoice ONLY after order creation HTTP 200 OK succeeds
    const supabase = await createClient();
    await supabase.from("billing_invoices").insert({
      org_id: orgId,
      amount: amountInRupees,
      currency: planConfig.currency,
      payment_method: "Razorpay",
      status: "pending",
    });

    return {
      success: true,
      keyId,
      orderId,
      amount: responseData.amount,
      currency: responseData.currency,
      planCode,
      orgName: context.org.name,
      userEmail: context.user?.email || "owner@restaurant.com",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network/Server Exception during Razorpay Order creation";
    console.error("[RAZORPAY_ORDER_EXCEPTION]", errorMsg);
    return {
      success: false,
      errorCode: "ORDER_CREATION_FAILED",
      provider: "razorpay",
      error: errorMsg,
    };
  }
}

/**
 * Server Action: Server-Side HMAC SHA256 Signature Verification & Entitlement Capture
 * (Step 11-13 of Razorpay Standard Checkout Architecture)
 */
export async function verifyRazorpayPaymentSignature(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planCode: "standard" | "multi_branch";
}) {
  try {
    console.log("[BILLING_VERIFICATION_START]", {
      orderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
    });

    const context = await resolveUserContext();
    if (!context.org) {
      return { success: false, errorCode: "UNAUTHENTICATED", error: "Organization context required." };
    }

    const razorpaySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!razorpaySecret) {
      return {
        success: false,
        errorCode: "RAZORPAY_CREDENTIALS_MISSING",
        error: "RAZORPAY_KEY_SECRET missing on server.",
      };
    }

    // Verify HMAC SHA256 signature using order_id + "|" + payment_id
    const signatureText = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(signatureText)
      .digest("hex");

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(payload.razorpay_signature, "utf-8"),
      Buffer.from(generatedSignature, "utf-8")
    );

    if (!isSignatureValid) {
      console.error("[BILLING_VERIFICATION_FAILED]", {
        orderId: payload.razorpay_order_id,
        error: "Invalid HMAC Signature Proof",
      });
      return {
        success: false,
        errorCode: "SIGNATURE_VERIFICATION_FAILED",
        error: "Razorpay HMAC SHA256 signature verification failed. Invalid payment proof.",
      };
    }

    console.log("[BILLING_VERIFICATION_SUCCESS]", { orderId: payload.razorpay_order_id });

    const supabase = await createClient();
    const orgId = context.org.id;

    // Fetch target plan UUID
    const { data: targetPlan } = await supabase
      .from("plans")
      .select("id")
      .eq("code", payload.planCode)
      .maybeSingle();

    if (targetPlan) {
      // Update subscription record in DB to ACTIVE
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
            provider_subscription_id: payload.razorpay_payment_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
      } else {
        await supabase.from("subscriptions").insert({
          org_id: orgId,
          plan_id: targetPlan.id,
          provider: "razorpay",
          provider_subscription_id: payload.razorpay_payment_id,
          status: "active",
        });
      }
    }

    console.log("[BILLING_SUBSCRIPTION_UPDATED]", { orgId, planCode: payload.planCode });

    // Update invoice status to PAID
    const planConfig = BILLING_PLANS_CONFIG[payload.planCode];
    await supabase.from("billing_invoices").insert({
      org_id: orgId,
      amount: planConfig.monthlyPrice,
      currency: planConfig.currency,
      payment_method: "Razorpay",
      status: "paid",
    });

    // Send system notification
    await createNotification({
      org_id: orgId,
      type: "subscription_issue",
      title: "Plan Upgraded to Multi-Branch",
      message: `Razorpay payment ${payload.razorpay_payment_id} verified. Multi-Branch features active.`,
    });

    return { success: true, planCode: payload.planCode };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Payment verification failed";
    console.error("[BILLING_VERIFICATION_EXCEPTION]", errorMsg);
    return {
      success: false,
      errorCode: "SUBSCRIPTION_UPDATE_FAILED",
      error: errorMsg,
    };
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

    await createNotification({
      org_id: orgId,
      type: "subscription_issue",
      title: "Plan Downgraded to Standard",
      message: "Branch capacity set to 1 active location. Existing store data preserved.",
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Safe downgrade failed." };
  }
}
