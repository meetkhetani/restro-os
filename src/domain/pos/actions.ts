"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/domain/context/service";
import {
  Category,
  MenuItem,
  TableItem,
  Customer,
  CreateOrderInput,
  ProcessPaymentInput,
  Order,
} from "./types";
import { calculateOrderTotals, generateOrderNumber } from "./service";
import { paymentRegistry } from "./payment-adapter";

/**
 * Fetch initial POS menu data, categories, floor tables, and customers for current branch context.
 */
export async function getPosInitialData() {
  const context = await resolveUserContext();

  if (!context.org || !context.selectedBranch) {
    return {
      categories: [] as Category[],
      menuItems: [] as MenuItem[],
      tables: [] as TableItem[],
      customers: [] as Customer[],
      activeLocation: null,
      activeRestaurant: null,
      organization: context.org,
    };
  }

  const supabase = await createClient();
  const orgId = context.org.id;
  const branchId = context.selectedBranch.id;

  // Execute all POS queries concurrently using Promise.all to eliminate sequential network roundtrips
  const [categoriesRes, menuItemsRes, modifierGroupsRes, tablesRes, customersRes] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("org_id", orgId)
        .order("display_order", { ascending: true }),

      supabase
        .from("menu_items")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_available", true),

      supabase
        .from("modifier_groups")
        .select("*, options:modifier_options(*)")
        .eq("org_id", orgId),

      supabase
        .from("tables")
        .select("*")
        .eq("org_id", orgId)
        .eq("branch_id", branchId)
        .order("table_number", { ascending: true }),

      supabase
        .from("customers")
        .select("*")
        .eq("org_id", orgId)
        .order("name", { ascending: true }),
    ]);

  const categories = categoriesRes.data || [];
  const menuItems = menuItemsRes.data || [];
  const modifierGroups = modifierGroupsRes.data || [];
  const tables = tablesRes.data || [];
  const customers = customersRes.data || [];

  // Attach modifier groups to menu items
  const formattedItems: MenuItem[] = menuItems.map((item) => ({
    ...item,
    price: Number(item.price),
    tax_rate: Number(item.tax_rate),
    modifier_groups: modifierGroups || [],
  }));

  return {
    categories: (categories || []) as Category[],
    menuItems: formattedItems,
    tables: (tables || []) as TableItem[],
    customers: (customers || []) as Customer[],
    activeLocation: { id: context.selectedBranch.id, name: context.selectedBranch.name },
    activeRestaurant: { name: context.org.name },
    organization: context.org,
  };
}

/**
 * Server Action: Create Order with Server-Side Financial Calculations
 */
export async function createOrder(input: CreateOrderInput) {
  try {
    const context = await resolveUserContext();

    if (!context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Active organization or branch context is required.",
      };
    }

    if (!input.items || input.items.length === 0) {
      return {
        success: false,
        error: "Order must contain at least one item.",
      };
    }

    const orgId = context.org.id;
    const branchId = context.selectedBranch.id;
    const userId = context.user?.id;

    // Financial Calculation Server-Side
    const calculations = calculateOrderTotals(input);
    const orderNumber = generateOrderNumber(context.selectedBranch.name.slice(0, 3).toUpperCase() || "ORD");

    const supabase = await createClient();

    // 1. Insert Order Header
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        org_id: orgId,
        branch_id: branchId,
        order_number: orderNumber,
        order_type: input.order_type,
        status: "pending",
        table_id: input.table_id || null,
        customer_id: input.customer_id || null,
        subtotal: calculations.subtotal,
        discount_type: input.discount_type || "amount",
        discount_value: input.discount_value || 0,
        discount_amount: calculations.discount_amount,
        tax_amount: calculations.tax_amount,
        total_amount: calculations.total_amount,
        notes: input.notes || null,
        created_by: userId || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Create order DB error:", orderError);
      return {
        success: false,
        error: orderError?.message || "Failed to create order.",
      };
    }

    // 2. Insert Order Items & Item Modifiers
    for (let i = 0; i < input.items.length; i++) {
      const itemInput = input.items[i];
      const itemCalc = calculations.item_totals[i];

      const { data: orderItem, error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          menu_item_id: itemInput.menu_item_id,
          item_name: itemInput.item_name,
          unit_price: itemCalc.effective_unit_price,
          quantity: itemInput.quantity,
          tax_rate: itemInput.tax_rate,
          subtotal: itemCalc.subtotal,
          notes: itemInput.notes || null,
        })
        .select()
        .single();

      if (orderItem && itemInput.modifiers && itemInput.modifiers.length > 0) {
        const modifierInserts = itemInput.modifiers.map((m) => ({
          order_item_id: orderItem.id,
          modifier_option_id: m.modifier_option_id || null,
          modifier_name: m.modifier_name,
          price_delta: m.price_delta,
        }));

        await supabase.from("order_item_modifiers").insert(modifierInserts);
      }
    }

    // 3. Update Table Status if Dine-in
    if (input.order_type === "dine_in" && input.table_id) {
      await supabase
        .from("tables")
        .update({ status: "occupied" })
        .eq("id", input.table_id);
    }

    // 4. Record Order Audit Event
    await supabase.from("order_events").insert({
      order_id: order.id,
      status: "pending",
      actor_id: userId || null,
      notes: `Order ${orderNumber} created (${input.order_type}). Total: $${calculations.total_amount}`,
    });

    return {
      success: true,
      order: order as Order,
      calculations,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create order.";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Server Action: Process Order Payment
 */
export async function processOrderPayment(input: ProcessPaymentInput) {
  try {
    const context = await resolveUserContext();

    if (!context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Active organization or branch context is required.",
      };
    }

    const orgId = context.org.id;
    const locationId = context.selectedBranch.id;
    const userId = context.user?.id;
    const supabase = await createClient();

    // 1. Fetch Order to verify status and amount
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", input.order_id)
      .eq("org_id", orgId)
      .single();

    if (fetchError || !order) {
      return {
        success: false,
        error: "Order not found or access denied.",
      };
    }

    // Execute Payment via Payment Registry Abstraction
    const adapter = paymentRegistry.getAdapter(input.payment_method);
    const paymentResult = await adapter.processPayment({
      order_id: order.id,
      amount: input.amount,
      payment_method: input.payment_method,
      transaction_reference: input.transaction_reference,
    });

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error || "Payment gateway processing failed.",
      };
    }

    // 2. Record Payment Record in DB
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .insert({
        org_id: orgId,
        location_id: locationId,
        order_id: order.id,
        amount: input.amount,
        payment_method: input.payment_method,
        status: paymentResult.status,
        transaction_reference: paymentResult.transaction_reference,
        gateway_provider: paymentResult.gateway_provider,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
    }

    // 3. Update Order Status to Completed
    await supabase
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // 4. Update Table Status to Available if Dine-in
    if (order.table_id) {
      await supabase
        .from("tables")
        .update({ status: "available" })
        .eq("id", order.table_id);
    }

    // 5. Update Customer Total Spend stats if customer tied
    if (order.customer_id) {
      const { data: cust } = await supabase
        .from("customers")
        .select("total_orders, total_spent")
        .eq("id", order.customer_id)
        .single();

      if (cust) {
        await supabase
          .from("customers")
          .update({
            total_orders: (cust.total_orders || 0) + 1,
            total_spent: Number(cust.total_spent || 0) + Number(input.amount),
          })
          .eq("id", order.customer_id);
      }
    }

    // 6. Log Order Event
    await supabase.from("order_events").insert({
      order_id: order.id,
      status: "completed",
      actor_id: userId || null,
      notes: `Payment of $${input.amount} completed via ${input.payment_method.toUpperCase()} (Ref: ${paymentResult.transaction_reference}).`,
    });

    return {
      success: true,
      payment: paymentRecord,
      message: "Order payment completed successfully.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process payment.";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Fetch Recent Orders for active branch
 */
export async function getRecentOrders() {
  const context = await resolveUserContext();
  if (!context.org || !context.selectedBranch) return [];

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, table:tables(*), customer:customers(*), items:order_items(*)")
    .eq("org_id", context.org.id)
    .eq("location_id", context.selectedBranch.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (orders || []) as Order[];
}
