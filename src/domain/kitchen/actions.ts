"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";
import { Order, OrderStatus } from "../pos/types";

/**
 * Server Action: Fetch Kitchen Display System (KDS) Active Orders
 * Scoped by Organization and Branch Context
 */
export async function getKitchenOrders(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Authenticated active branch context required.",
        orders: [],
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    let branchId = context.selectedBranch.id;

    if (branchIdParam && branchIdParam !== "all") {
      branchId = branchIdParam;
    }

    // Query active kitchen orders
    let query = supabase
      .from("orders")
      .select(
        "*, table:tables(*), customer:customers(*), items:order_items(*, modifiers:order_item_modifiers(*))"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (branchId && branchId !== "all") {
      query = query.eq("branch_id", branchId);
    }

    query = query.in("status", ["pending", "confirmed", "preparing", "ready", "completed"]);

    const { data: rawOrders, error } = await query;

    if (error) {
      console.error("KDS Fetch Error:", error);
      return { success: false, error: error.message, orders: [] };
    }

    const orders = (rawOrders || []) as Order[];

    return {
      success: true,
      orders,
      branch: context.selectedBranch,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load kitchen orders.";
    return { success: false, error: msg, orders: [] };
  }
}

/**
 * Server Action: Update Kitchen Ticket Status & Log Audit Event
 */
export async function updateKitchenOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.user || !context.org) {
      return { success: false, error: "Unauthorized operation." };
    }

    const supabase = await createClient();

    // 1. Update Order Status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("org_id", context.org.id)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      return {
        success: false,
        error: updateError?.message || "Failed to update kitchen ticket status.",
      };
    }

    // 2. Log Order Audit Event
    await supabase.from("order_events").insert({
      order_id: orderId,
      status: newStatus,
      actor_id: context.user.id,
      notes: notes || `Kitchen status updated to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      order: updatedOrder as Order,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update order status.";
    return { success: false, error: msg };
  }
}
