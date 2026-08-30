"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";

export type MovementType =
  | "purchase_received"
  | "adjustment"
  | "wastage"
  | "pos_deduction"
  | "transfer_in"
  | "transfer_out";

export interface Ingredient {
  id: string;
  org_id: string;
  sku?: string;
  name: string;
  category: string;
  unit: string;
  unit_cost: number;
  min_threshold: number;
  reorder_level: number;
  created_at: string;
}

export interface BranchInventoryItem {
  id: string;
  org_id: string;
  branch_id: string;
  ingredient_id: string;
  quantity_on_hand: number;
  unit_cost: number;
  ingredient?: Ingredient;
  is_low_stock?: boolean;
}

export interface StockMovement {
  id: string;
  org_id: string;
  branch_id: string;
  ingredient_id: string;
  movement_type: MovementType;
  quantity: number;
  balance_after: number;
  unit_cost: number;
  notes?: string;
  created_at: string;
  ingredient?: Ingredient;
}

export interface StockTransfer {
  id: string;
  org_id: string;
  from_branch_id: string;
  to_branch_id: string;
  ingredient_id: string;
  quantity: number;
  status: "pending" | "approved" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  ingredient?: Ingredient;
}

export interface CreateIngredientInput {
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  unit_cost: number;
  min_threshold: number;
  reorder_level: number;
}

export interface RecordMovementInput {
  ingredient_id: string;
  movement_type: MovementType;
  quantity: number; // positive for addition, negative for deduction
  notes?: string;
  unit_cost?: number;
  branch_id?: string;
}

export interface CreateTransferInput {
  from_branch_id: string;
  to_branch_id: string;
  ingredient_id: string;
  quantity: number;
  notes?: string;
}

/**
 * Server Action: Fetch Branch Inventory Catalog, Stock Levels, and Ledger Audit Trail
 */
export async function getBranchInventory(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Authenticated branch context required.",
        inventory: [],
        ingredients: [],
        movements: [],
        transfers: [],
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const branchId = branchIdParam && branchIdParam !== "all" ? branchIdParam : context.selectedBranch.id;

    // Parallel query for ingredients, branch_inventory, stock_movements, and stock_transfers
    const [ingredientsRes, inventoryRes, movementsRes, transfersRes] = await Promise.all([
      supabase.from("ingredients").select("*").eq("org_id", orgId).order("name", { ascending: true }),
      supabase.from("branch_inventory").select("*, ingredient:ingredients(*)").eq("org_id", orgId).eq("branch_id", branchId),
      supabase.from("stock_movements").select("*, ingredient:ingredients(*)").eq("org_id", orgId).eq("branch_id", branchId).order("created_at", { ascending: false }).limit(50),
      supabase.from("stock_transfers").select("*, ingredient:ingredients(*)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(30),
    ]);

    const ingredients = (ingredientsRes.data || []) as Ingredient[];
    const rawInventory = (inventoryRes.data || []) as BranchInventoryItem[];
    const movements = (movementsRes.data || []) as StockMovement[];
    const transfers = (transfersRes.data || []) as StockTransfer[];

    // Ensure every ingredient in catalog has a branch_inventory record
    const inventory: BranchInventoryItem[] = ingredients.map((ing) => {
      const existing = rawInventory.find((inv) => inv.ingredient_id === ing.id);
      const qty = existing ? Number(existing.quantity_on_hand) : 0;
      const minThresh = Number(ing.min_threshold || 10);
      return {
        id: existing?.id || `temp-${ing.id}`,
        org_id: orgId,
        branch_id: branchId,
        ingredient_id: ing.id,
        quantity_on_hand: qty,
        unit_cost: existing ? Number(existing.unit_cost) : Number(ing.unit_cost),
        ingredient: ing,
        is_low_stock: qty <= minThresh,
      };
    });

    return {
      success: true,
      inventory,
      ingredients,
      movements,
      transfers,
      branch: context.selectedBranch,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load inventory.";
    return {
      success: false,
      error: msg,
      inventory: [],
      ingredients: [],
      movements: [],
      transfers: [],
    };
  }
}

/**
 * Server Action: Create New Ingredient Record
 */
export async function createIngredient(input: CreateIngredientInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();
    const { data: ingredient, error } = await supabase
      .from("ingredients")
      .insert({
        org_id: context.org.id,
        sku: input.sku?.trim() || null,
        name: input.name.trim(),
        category: input.category?.trim() || "General",
        unit: input.unit || "kg",
        unit_cost: input.unit_cost,
        min_threshold: input.min_threshold,
        reorder_level: input.reorder_level,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, ingredient };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create ingredient." };
  }
}

/**
 * Server Action: Record Stock Movement Transaction (Immutable Ledger Audit Trail)
 * CRITICAL RULE: Never directly overwrite quantity_on_hand. Always insert a movement ledger entry.
 */
export async function recordStockMovement(input: RecordMovementInput) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.selectedBranch) {
      return { success: false, error: "Authenticated context required." };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const branchId = input.branch_id || context.selectedBranch.id;

    // 1. Fetch current stock on hand
    const { data: existingStock } = await supabase
      .from("branch_inventory")
      .select("id, quantity_on_hand, unit_cost")
      .eq("branch_id", branchId)
      .eq("ingredient_id", input.ingredient_id)
      .maybeSingle();

    const currentQty = existingStock ? Number(existingStock.quantity_on_hand) : 0;
    const newBalance = currentQty + Number(input.quantity);

    // 2. Insert Immutable Stock Ledger Record
    const { data: movement, error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        org_id: orgId,
        branch_id: branchId,
        ingredient_id: input.ingredient_id,
        movement_type: input.movement_type,
        quantity: input.quantity,
        balance_after: newBalance,
        unit_cost: input.unit_cost || existingStock?.unit_cost || 0,
        notes: input.notes?.trim() || null,
        created_by: context.user?.id || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (movementError) return { success: false, error: movementError.message };

    // 3. Upsert Branch Inventory Stock Level
    await supabase
      .from("branch_inventory")
      .upsert(
        {
          org_id: orgId,
          branch_id: branchId,
          ingredient_id: input.ingredient_id,
          quantity_on_hand: newBalance,
          unit_cost: input.unit_cost || existingStock?.unit_cost || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "branch_id, ingredient_id" }
      );

    return { success: true, movement, newBalance };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to record stock movement." };
  }
}

/**
 * Server Action: Initiate Inter-Branch Stock Transfer
 */
export async function createStockTransfer(input: CreateTransferInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    if (input.from_branch_id === input.to_branch_id) {
      return { success: false, error: "Source and destination branches must be different." };
    }

    const supabase = await createClient();
    const { data: transfer, error } = await supabase
      .from("stock_transfers")
      .insert({
        org_id: context.org.id,
        from_branch_id: input.from_branch_id,
        to_branch_id: input.to_branch_id,
        ingredient_id: input.ingredient_id,
        quantity: input.quantity,
        status: "pending",
        notes: input.notes?.trim() || null,
        created_by: context.user?.id || null,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, transfer };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to initiate transfer." };
  }
}

/**
 * Server Action: Complete Inter-Branch Stock Transfer (Updates both source and target ledgers)
 */
export async function completeStockTransfer(transferId: string) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();

    // 1. Fetch Transfer Record
    const { data: transfer, error: fetchErr } = await supabase
      .from("stock_transfers")
      .select("*")
      .eq("id", transferId)
      .single();

    if (fetchErr || !transfer || transfer.status === "completed") {
      return { success: false, error: "Invalid or already completed transfer." };
    }

    const qty = Number(transfer.quantity);

    // 2. Record transfer_out from Source Branch
    await recordStockMovement({
      branch_id: transfer.from_branch_id,
      ingredient_id: transfer.ingredient_id,
      movement_type: "transfer_out",
      quantity: -qty,
      notes: `Inter-branch transfer OUT to branch ${transfer.to_branch_id}`,
    });

    // 3. Record transfer_in to Target Branch
    await recordStockMovement({
      branch_id: transfer.to_branch_id,
      ingredient_id: transfer.ingredient_id,
      movement_type: "transfer_in",
      quantity: qty,
      notes: `Inter-branch transfer IN from branch ${transfer.from_branch_id}`,
    });

    // 4. Mark Transfer Completed
    await supabase
      .from("stock_transfers")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", transferId);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to complete transfer." };
  }
}
