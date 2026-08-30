"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";
import { recordStockMovement } from "../inventory/actions";

export type POStatus = "draft" | "submitted" | "partially_received" | "received" | "cancelled";

export interface Supplier {
  id: string;
  org_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface POItem {
  id: string;
  purchase_order_id: string;
  ingredient_id?: string;
  item_name: string;
  unit_price: number;
  ordered_qty: number;
  received_qty: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  org_id: string;
  branch_id: string;
  supplier_id: string;
  po_number: string;
  status: POStatus;
  expected_delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  items?: POItem[];
}

export interface CreateSupplierInput {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
}

export interface CreatePOItemInput {
  ingredient_id?: string;
  item_name: string;
  unit_price: number;
  ordered_qty: number;
}

export interface CreatePOInput {
  supplier_id: string;
  expected_delivery_date?: string;
  notes?: string;
  items: CreatePOItemInput[];
}

/**
 * Server Action: Fetch Purchasing Overview (Suppliers, POs, Items)
 */
export async function getPurchasingOverview(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Authenticated branch context required.",
        suppliers: [],
        purchaseOrders: [],
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const branchId = branchIdParam && branchIdParam !== "all" ? branchIdParam : context.selectedBranch.id;

    // Parallel query for Suppliers and Purchase Orders
    const [suppliersRes, posRes] = await Promise.all([
      supabase.from("suppliers").select("*").eq("org_id", orgId).order("name", { ascending: true }),
      supabase
        .from("purchase_orders")
        .select("*, supplier:suppliers(*), items:purchase_order_items(*)")
        .eq("org_id", orgId)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false }),
    ]);

    const suppliers = (suppliersRes.data || []) as Supplier[];
    const purchaseOrders = (posRes.data || []) as PurchaseOrder[];

    return {
      success: true,
      suppliers,
      purchaseOrders,
      branch: context.selectedBranch,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load purchasing overview.";
    return {
      success: false,
      error: msg,
      suppliers: [],
      purchaseOrders: [],
    };
  }
}

/**
 * Server Action: Create Supplier Vendor Profile
 */
export async function createSupplier(input: CreateSupplierInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .insert({
        org_id: context.org.id,
        name: input.name.trim(),
        contact_person: input.contact_person?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        tax_id: input.tax_id?.trim() || null,
        payment_terms: input.payment_terms || "Net 30",
        status: "active",
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, supplier };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create supplier." };
  }
}

/**
 * Server Action: Create Purchase Order (PO)
 */
export async function createPurchaseOrder(input: CreatePOInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org || !context.selectedBranch) {
      return { success: false, error: "Active branch context required." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Purchase Order must contain at least one item." };
    }

    const supabase = await createClient();
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const subtotal = input.items.reduce((sum, item) => sum + item.unit_price * item.ordered_qty, 0);
    const taxAmount = subtotal * 0.05; // 5% standard tax estimate
    const totalAmount = subtotal + taxAmount;

    // 1. Insert Purchase Order Header
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        org_id: context.org.id,
        branch_id: context.selectedBranch.id,
        supplier_id: input.supplier_id,
        po_number: poNumber,
        status: "draft",
        expected_delivery_date: input.expected_delivery_date || null,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: input.notes?.trim() || null,
        created_by: context.user?.id || null,
      })
      .select()
      .single();

    if (poError || !po) {
      return { success: false, error: poError?.message || "Failed to create PO header." };
    }

    // 2. Insert Purchase Order Line Items
    const lineItems = input.items.map((item) => ({
      purchase_order_id: po.id,
      ingredient_id: item.ingredient_id || null,
      item_name: item.item_name.trim(),
      unit_price: item.unit_price,
      ordered_qty: item.ordered_qty,
      received_qty: 0,
      subtotal: item.unit_price * item.ordered_qty,
    }));

    await supabase.from("purchase_order_items").insert(lineItems);

    return { success: true, purchaseOrder: po as PurchaseOrder };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create purchase order." };
  }
}

/**
 * Server Action: Submit Purchase Order (Draft -> Submitted)
 */
export async function submitPurchaseOrder(poId: string) {
  try {
    const supabase = await createClient();
    const { data: po, error } = await supabase
      .from("purchase_orders")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", poId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, purchaseOrder: po };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to submit purchase order." };
  }
}

/**
 * Server Action: Receive PO Line Item Stock & Post Stock Ledger Movement
 * AUTOMATED STOCK LEDGER INTEGRATION
 */
export async function receivePOItemStock(
  poId: string,
  poItemId: string,
  ingredientId: string | undefined,
  qtyReceived: number,
  notes?: string
) {
  try {
    const context = await resolveUserContext();
    if (!context.org || !context.selectedBranch) {
      return { success: false, error: "Active branch context required." };
    }

    if (qtyReceived <= 0) return { success: false, error: "Received quantity must be greater than 0." };

    const supabase = await createClient();

    // 1. Fetch Item Record
    const { data: poItem, error: itemErr } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("id", poItemId)
      .single();

    if (itemErr || !poItem) return { success: false, error: "Purchase order item not found." };

    const newReceivedQty = Number(poItem.received_qty) + Number(qtyReceived);

    // 2. Insert Purchase Receiving Log
    await supabase.from("purchase_receivings").insert({
      purchase_order_id: poId,
      po_item_id: poItemId,
      quantity_received: qtyReceived,
      received_by: context.user?.id || null,
      notes: notes?.trim() || `Received ${qtyReceived} units for PO item ${poItem.item_name}`,
    });

    // 3. Update PO Line Item received_qty
    await supabase
      .from("purchase_order_items")
      .update({ received_qty: newReceivedQty })
      .eq("id", poItemId);

    // 4. CRITICAL: Automatically Post Stock Ledger Movement into stock_movements & branch_inventory
    const targetIngredientId = ingredientId || poItem.ingredient_id;
    if (targetIngredientId) {
      await recordStockMovement({
        branch_id: context.selectedBranch.id,
        ingredient_id: targetIngredientId,
        movement_type: "purchase_received",
        quantity: Number(qtyReceived),
        unit_cost: Number(poItem.unit_price),
        notes: `PO Stock Receiving: ${notes || "Incoming PO stock"}`,
      });
    }

    // 5. Recalculate Purchase Order Overall Status (Submitted -> Partially Received / Received)
    const { data: allItems } = await supabase
      .from("purchase_order_items")
      .select("ordered_qty, received_qty")
      .eq("purchase_order_id", poId);

    const totalOrdered = (allItems || []).reduce((sum, i) => sum + Number(i.ordered_qty), 0);
    const totalReceived = (allItems || []).reduce((sum, i) => sum + Number(i.received_qty), 0);

    let nextStatus: POStatus = "partially_received";
    if (totalReceived >= totalOrdered) {
      nextStatus = "received";
    }

    await supabase
      .from("purchase_orders")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", poId);

    return { success: true, nextStatus };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to receive PO stock." };
  }
}
