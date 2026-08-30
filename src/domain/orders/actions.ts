"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/domain/context/service";
import {
  Order,
  OrderQueryFilters,
  PaginatedOrdersResult,
  OrderStatus,
  CancelOrderInput,
  OrderEvent,
} from "@/domain/pos/types";

/**
 * Server Action: Fetch Paginated & Filtered Orders with Server-Validated Multi-Branch Scoping
 */
export async function getPaginatedOrders(
  filters: OrderQueryFilters = {}
): Promise<PaginatedOrdersResult> {
  const context = await resolveUserContext();

  if (!context.org) {
    return {
      orders: [],
      total_count: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
      stats: {
        total: 0,
        pending: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
        total_revenue: 0,
      },
    };
  }

  const supabase = await createClient();
  const orgId = context.org.id;
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters.page_size || 10));

  // Determine Branch Scoping:
  // If user is entitled to Multi-Branch and requests specific branch or 'all'
  let targetLocationId: string | null = null;

  if (filters.branch_id && filters.branch_id !== "all") {
    targetLocationId = filters.branch_id;
  } else if (!context.isMultiBranchEntitled && context.selectedBranch) {
    targetLocationId = context.selectedBranch.id;
  }

  // Base Query Builder for Stats
  let statsQuery = supabase
    .from("orders")
    .select("status, total_amount, created_at, order_number, order_type", { count: "exact" })
    .eq("org_id", orgId);

  if (targetLocationId) {
    statsQuery = statsQuery.eq("location_id", targetLocationId);
  }

  // Date Range Filtering
  if (filters.date_range && filters.date_range !== "all") {
    const now = new Date();
    const startDate = new Date();

    if (filters.date_range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (filters.date_range === "yesterday") {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (filters.date_range === "7days") {
      startDate.setDate(now.getDate() - 7);
    } else if (filters.date_range === "30days") {
      startDate.setDate(now.getDate() - 30);
    }

    statsQuery = statsQuery.gte("created_at", startDate.toISOString());
  }

  const { data: statsData } = await statsQuery;
  const allRawOrders = statsData || [];

  // Compute Stats Summary
  const stats = {
    total: allRawOrders.length,
    pending: allRawOrders.filter((o) => o.status === "pending").length,
    preparing: allRawOrders.filter((o) => o.status === "preparing").length,
    ready: allRawOrders.filter((o) => o.status === "ready").length,
    completed: allRawOrders.filter((o) => o.status === "completed").length,
    cancelled: allRawOrders.filter((o) => o.status === "cancelled").length,
    total_revenue: allRawOrders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
  };

  // Main Paginated Orders Query
  let query = supabase
    .from("orders")
    .select(
      "*, table:tables(*), customer:customers(*), items:order_items(*, modifiers:order_item_modifiers(*)), payments(*)",
      { count: "exact" }
    )
    .eq("org_id", orgId);

  if (targetLocationId) {
    query = query.eq("location_id", targetLocationId);
  }

  if (filters.order_type && filters.order_type !== "all") {
    query = query.eq("order_type", filters.order_type);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.ilike("order_number", term);
  }

  if (filters.date_range && filters.date_range !== "all") {
    const now = new Date();
    const startDate = new Date();

    if (filters.date_range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (filters.date_range === "yesterday") {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (filters.date_range === "7days") {
      startDate.setDate(now.getDate() - 7);
    } else if (filters.date_range === "30days") {
      startDate.setDate(now.getDate() - 30);
    }

    query = query.gte("created_at", startDate.toISOString());
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: rawOrders, count } = await query;

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const orders: Order[] = (rawOrders || []).map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    discount_amount: Number(o.discount_amount),
    tax_amount: Number(o.tax_amount),
    total_amount: Number(o.total_amount),
  }));

  return {
    orders,
    total_count: totalCount,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    stats,
  };
}

/**
 * Server Action: Get Full Order Details with Items, Modifiers, Payments & Timeline Events
 */
export async function getOrderDetails(orderId: string) {
  const context = await resolveUserContext();

  if (!context.org) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createClient();

  // 1. Fetch Order Header
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, table:tables(*), customer:customers(*), payments(*)")
    .eq("id", orderId)
    .eq("org_id", context.org.id)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found or access denied." };
  }

  // 2. Fetch Order Items & Modifiers
  const { data: items } = await supabase
    .from("order_items")
    .select("*, modifiers:order_item_modifiers(*)")
    .eq("order_id", orderId);

  // 3. Fetch Order Timeline Events with Actor Profile info
  const { data: events } = await supabase
    .from("order_events")
    .select("*, actor:profiles(full_name, email)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const formattedOrder: Order = {
    ...order,
    subtotal: Number(order.subtotal),
    discount_amount: Number(order.discount_amount),
    tax_amount: Number(order.tax_amount),
    total_amount: Number(order.total_amount),
    items: (items || []).map((i) => ({
      ...i,
      unit_price: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
    events: (events || []) as OrderEvent[],
  };

  return {
    success: true,
    order: formattedOrder,
  };
}

/**
 * Server Action: Update Order Status & Log Audit Event
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
) {
  try {
    const context = await resolveUserContext();

    if (!context.org) {
      return { success: false, error: "Authentication required." };
    }

    const supabase = await createClient();

    // 1. Fetch Order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, table_id, order_number")
      .eq("id", orderId)
      .eq("org_id", context.org.id)
      .single();

    if (fetchError || !order) {
      return { success: false, error: "Order not found." };
    }

    const oldStatus = order.status;

    // 2. Update Order Status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 3. Release Table if Completed or Cancelled
    if ((newStatus === "completed" || newStatus === "cancelled") && order.table_id) {
      await supabase
        .from("tables")
        .update({ status: "available" })
        .eq("id", order.table_id);
    }

    // 4. Log Audit Event in order_events
    await supabase.from("order_events").insert({
      order_id: order.id,
      status: newStatus,
      actor_id: context.user?.id || null,
      notes: notes || `Order ${order.order_number} status updated from ${oldStatus} to ${newStatus}.`,
    });

    return {
      success: true,
      message: `Order status updated to ${newStatus}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update order status.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Cancel Order with Audit Reason & Table Release
 */
export async function cancelOrder(input: CancelOrderInput) {
  try {
    const context = await resolveUserContext();

    if (!context.org) {
      return { success: false, error: "Authentication required." };
    }

    if (!input.reason || !input.reason.trim()) {
      return { success: false, error: "Cancellation reason is required." };
    }

    const supabase = await createClient();

    // 1. Fetch Order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, table_id, order_number")
      .eq("id", input.order_id)
      .eq("org_id", context.org.id)
      .single();

    if (fetchError || !order) {
      return { success: false, error: "Order not found." };
    }

    if (order.status === "cancelled") {
      return { success: false, error: "Order is already cancelled." };
    }

    // 2. Set Status to Cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 3. Release Table if Dine-in
    if (order.table_id) {
      await supabase
        .from("tables")
        .update({ status: "available" })
        .eq("id", order.table_id);
    }

    // 4. Log Cancellation Audit Event
    await supabase.from("order_events").insert({
      order_id: order.id,
      status: "cancelled",
      actor_id: context.user?.id || null,
      notes: `Order ${order.order_number} cancelled. Reason: ${input.reason.trim()}`,
    });

    return {
      success: true,
      message: "Order cancelled successfully.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to cancel order.";
    return { success: false, error: msg };
  }
}
