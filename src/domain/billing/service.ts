"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { razorpayProvider } from "./providers/razorpay";
import { WebhookEventPayload } from "./types";

/**
 * Handles incoming Razorpay webhooks with strict signature verification,
 * event idempotency logging, and database state synchronization.
 */
export async function processRazorpayWebhook(rawBody: string, signature: string): Promise<{
  success: boolean;
  message: string;
  eventId?: string;
}> {
  // 1. Verify Signature
  const isValid = razorpayProvider.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return { success: false, message: "Invalid webhook signature" };
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { success: false, message: "Invalid JSON payload" };
  }

  const eventId = (body.event_id as string) || (body.id as string) || `evt_${Date.now()}`;
  const eventType = (body.event as string) || "subscription.updated";

  // Use Admin Client to record events & sync DB across tenants
  let db;
  try {
    db = createAdminClient();
  } catch {
    db = await createClient();
  }

  // 2. Check Event Idempotency in billing_events table
  const { data: existingEvent } = await db
    .from("billing_events")
    .select("id, status")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return {
      success: true,
      eventId,
      message: `Idempotent duplicate event [${eventId}] already recorded. Skipping re-processing.`,
    };
  }

  // 3. Log Event Entry
  await db.from("billing_events").insert({
    provider: "razorpay",
    event_id: eventId,
    event_type: eventType,
    payload: body,
    status: "processed",
  });

  // 4. Extract Entity Details from Webhook Payload
  const payloadData = (body.payload as Record<string, unknown>) || {};
  const subscriptionEntity = (payloadData.subscription as Record<string, unknown>)?.entity as Record<string, unknown>;
  const providerSubscriptionId = (subscriptionEntity?.id as string) || (body.subscription_id as string);

  if (providerSubscriptionId) {
    let newStatus: "active" | "past_due" | "canceled" | "paused" = "active";

    if (eventType.includes("halted") || eventType.includes("failed")) {
      newStatus = "past_due";
    } else if (eventType.includes("cancelled")) {
      newStatus = "canceled";
    } else if (eventType.includes("paused")) {
      newStatus = "paused";
    }

    // Sync Subscription record
    await db
      .from("subscriptions")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("provider_subscription_id", providerSubscriptionId);
  }

  return {
    success: true,
    eventId,
    message: `Webhook event [${eventType}] processed successfully.`,
  };
}

/**
 * Initiates an upgrade or plan change request for an organization.
 */
export async function upgradeOrganizationPlan(orgId: string, planCode: "standard" | "multi_branch") {
  const supabase = await createClient();

  const { data: targetPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("code", planCode)
    .single();

  if (!targetPlan) throw new Error(`Plan code ${planCode} not found.`);

  // Create or update subscription record
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);
  } else {
    await supabase.from("subscriptions").insert({
      org_id: orgId,
      plan_id: targetPlan.id,
      provider: "razorpay",
      provider_subscription_id: `sub_${planCode}_${Date.now()}`,
      status: "active",
    });
  }

  return { success: true, planCode };
}
