"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/domain/context/service";
import {
  Floor,
  TableItemExtended,
  Reservation,
  CreateTableInput,
  CreateFloorInput,
  UpdateTableInput,
  TransferOrderInput,
  MergeTablesInput,
  CreateReservationInput,
} from "./types";
import { Order } from "@/domain/pos/types";

const DEFAULT_BRANCH_1_ID = "00000000-0000-0000-0000-000000000101";

/**
 * Ensures valid branch ID and ensures at least one default Floor exists for the branch.
 */
async function resolveBranchAndFloorContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetOrgId: string,
  preferredBranchId: string
) {
  let branchId = preferredBranchId;
  if (branchId === "all" || !branchId.includes("-")) {
    const { data: dbBranches } = await supabase
      .from("branches")
      .select("id")
      .eq("org_id", targetOrgId)
      .limit(1);

    branchId = dbBranches?.[0]?.id || DEFAULT_BRANCH_1_ID;
  }

  // Ensure branch exists in branches table
  const { data: branchCheck } = await supabase
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .maybeSingle();

  if (!branchCheck) {
    await supabase.from("branches").upsert(
      {
        id: branchId,
        org_id: targetOrgId,
        name: "Main Branch",
        status: "active",
      },
      { onConflict: "id" }
    );
  }

  // Ensure default floor exists for this branch
  const { data: floorCheck } = await supabase
    .from("floors")
    .select("id")
    .eq("branch_id", branchId)
    .limit(1);

  if (!floorCheck || floorCheck.length === 0) {
    await supabase.from("floors").upsert(
      {
        org_id: targetOrgId,
        branch_id: branchId,
        name: "Main Floor",
        sort_order: 0,
        status: "active",
      },
      { onConflict: "branch_id, name" }
    );
  }

  return branchId;
}

/**
 * Server Action: Fetch Floors, Tables, Active Orders, and Reservations for target branch.
 */
export async function getTablesAndFloorData(branchIdParam?: string) {
  const context = await resolveUserContext();

  if (!context.org) {
    return {
      floors: [] as Floor[],
      tables: [] as TableItemExtended[],
      reservations: [] as Reservation[],
      stats: { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0, disabled: 0 },
      branch: null,
      organization: null,
    };
  }

  const supabase = await createClient();
  const orgId = context.org.id;

  let branchId = context.selectedBranch?.id || DEFAULT_BRANCH_1_ID;
  if (branchIdParam && branchIdParam !== "all") {
    branchId = branchIdParam;
  }

  // Parallel execution for Floors, Tables, Orders, and Reservations
  const [floorsRes, tablesRes, activeOrdersRes, reservationsRes] = await Promise.all([
    supabase
      .from("floors")
      .select("*")
      .eq("org_id", orgId)
      .eq("branch_id", branchId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),

    supabase
      .from("tables")
      .select("*, floor:floors(*)")
      .eq("org_id", orgId)
      .eq("branch_id", branchId)
      .order("table_number", { ascending: true }),

    supabase
      .from("orders")
      .select("*, customer:customers(*), items:order_items(*)")
      .eq("org_id", orgId)
      .eq("branch_id", branchId)
      .in("status", ["pending", "confirmed", "preparing", "ready"]),

    supabase
      .from("reservations")
      .select("*, table:tables(*)")
      .eq("org_id", orgId)
      .eq("branch_id", branchId)
      .order("reservation_time", { ascending: true }),
  ]);

  let floors = (floorsRes.data || []) as Floor[];
  if (floorsRes.error || floors.length === 0) {
    floors = [
      {
        id: "default-main-floor",
        org_id: orgId,
        branch_id: branchId,
        name: "Main Floor",
        sort_order: 0,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  let rawTables = tablesRes.data || [];
  if (tablesRes.error || !tablesRes.data) {
    const fallbackTables = await supabase
      .from("tables")
      .select("*")
      .eq("org_id", orgId)
      .order("table_number", { ascending: true });
    rawTables = fallbackTables.data || [];
  }

  let reservations = (reservationsRes.data || []) as Reservation[];
  if (reservationsRes.error || !reservationsRes.data) {
    const fallbackRes = await supabase
      .from("reservations")
      .select("*")
      .eq("org_id", orgId)
      .order("reservation_time", { ascending: true });
    reservations = (fallbackRes.data || []) as Reservation[];
  }

  const activeOrders = (activeOrdersRes.data || []) as Order[];

  const tables: TableItemExtended[] = rawTables.map((tbl) => {
    const activeOrder = activeOrders.find((o) => o.table_id === tbl.id) || null;
    return {
      ...tbl,
      capacity: Number(tbl.capacity || 4),
      floor_area: tbl.floor?.name || tbl.section || tbl.floor_area || "Main Floor",
      pos_x: Number(tbl.pos_x || 0),
      pos_y: Number(tbl.pos_y || 0),
      shape: tbl.shape || "square",
      active_order: activeOrder,
    };
  });

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    cleaning: tables.filter((t) => t.status === "cleaning").length,
    disabled: tables.filter((t) => t.status === "disabled").length,
  };

  return {
    floors,
    tables,
    reservations,
    stats,
    branch: context.selectedBranch,
    organization: context.org,
  };
}

/**
 * Server Action: Create New Floor Record
 */
export async function createFloor(input: CreateFloorInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org || !context.selectedBranch) {
      return { success: false, error: "Active branch context required." };
    }

    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Floor name is required." };
    }

    const supabase = await createClient();
    const branchId = await resolveBranchAndFloorContext(
      supabase,
      context.org.id,
      context.selectedBranch.id
    );

    const { data: floor, error } = await supabase
      .from("floors")
      .insert({
        org_id: context.org.id,
        branch_id: branchId,
        name: input.name.trim(),
        sort_order: input.sort_order || 0,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "A floor with this name already exists in this branch." };
      }
      return { success: false, error: error.message };
    }

    return { success: true, floor };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create floor.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Create New Floor Table with Canonical Validation
 */
export async function createTable(input: CreateTableInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org || !context.selectedBranch) {
      return { success: false, error: "Active branch context required." };
    }

    if (!input.table_number || !input.table_number.trim()) {
      return { success: false, error: "Table number is required." };
    }

    if (input.capacity <= 0) {
      return { success: false, error: "Table capacity must be greater than 0." };
    }

    const supabase = await createClient();
    const branchId = await resolveBranchAndFloorContext(
      supabase,
      context.org.id,
      context.selectedBranch.id
    );

    // Verify Floor Ownership & Security Context
    let floorId = input.floor_id;
    if (!floorId || !floorId.includes("-")) {
      const { data: firstFloor } = await supabase
        .from("floors")
        .select("id")
        .eq("branch_id", branchId)
        .limit(1)
        .single();

      floorId = firstFloor?.id || "";
    }

    if (!floorId) {
      return { success: false, error: "Valid floor selection required." };
    }

    // Insert Table with Canonical Foreign Keys
    const { data: table, error } = await supabase
      .from("tables")
      .insert({
        org_id: context.org.id,
        branch_id: branchId,
        floor_id: floorId,
        table_number: input.table_number.trim(),
        capacity: input.capacity,
        shape: input.shape || "square",
        pos_x: input.pos_x || 0,
        pos_y: input.pos_y || 0,
        status: "available",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: `Table "${input.table_number}" already exists in this branch.`,
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, table };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create table.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Floor Table Properties
 */
export async function updateTable(input: UpdateTableInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) {
      return { success: false, error: "Authenticated organization context required." };
    }

    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.floor_id) updatePayload.floor_id = input.floor_id;
    if (input.table_number) updatePayload.table_number = input.table_number.trim();
    if (input.capacity) updatePayload.capacity = input.capacity;
    if (input.shape) updatePayload.shape = input.shape;
    if (input.status) updatePayload.status = input.status;
    if (typeof input.pos_x === "number") updatePayload.pos_x = input.pos_x;
    if (typeof input.pos_y === "number") updatePayload.pos_y = input.pos_y;

    const { data: table, error } = await supabase
      .from("tables")
      .update(updatePayload)
      .eq("id", input.id)
      .eq("org_id", context.org.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, table };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update table.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Table Status
 */
export async function updateTableStatus(tableId: string, status: TableItemExtended["status"]) {
  return updateTable({ id: tableId, status });
}

/**
 * Server Action: Transfer Dine-in Order between Tables
 */
export async function transferTableOrder(input: TransferOrderInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) {
      return { success: false, error: "Authenticated organization context required." };
    }

    const supabase = await createClient();

    const { data: activeOrder, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", input.from_table_id)
      .in("status", ["pending", "confirmed", "preparing", "ready"])
      .single();

    if (orderErr || !activeOrder) {
      return { success: false, error: "No active order found on source table." };
    }

    await supabase.from("orders").update({ table_id: input.to_table_id }).eq("id", activeOrder.id);
    await supabase.from("tables").update({ status: "available" }).eq("id", input.from_table_id);
    await supabase.from("tables").update({ status: "occupied" }).eq("id", input.to_table_id);

    await supabase.from("order_events").insert({
      order_id: activeOrder.id,
      status: activeOrder.status,
      actor_id: context.user?.id || null,
      notes: `Order transferred from Table #${input.from_table_id} to Table #${input.to_table_id}`,
    });

    return { success: true, message: "Order transferred successfully." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to transfer order.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Merge Tables for Large Party Seating
 */
export async function mergeTables(input: MergeTablesInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) {
      return { success: false, error: "Authenticated organization context required." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("tables")
      .update({
        merged_into_table_id: input.target_table_id,
        status: "occupied",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.source_table_id)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };

    return { success: true, message: "Tables merged successfully." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to merge tables.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Split / Unmerge Table
 */
export async function splitTables(tableId: string) {
  try {
    const context = await resolveUserContext();
    if (!context.org) {
      return { success: false, error: "Authenticated organization context required." };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("tables")
      .update({
        merged_into_table_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tableId)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };

    return { success: true, message: "Table unmerged successfully." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to split tables.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Create Customer Reservation
 */
export async function createReservation(input: CreateReservationInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org || !context.selectedBranch) {
      return { success: false, error: "Active branch context required." };
    }

    if (!input.customer_name || !input.customer_name.trim()) {
      return { success: false, error: "Customer name is required." };
    }

    const supabase = await createClient();
    const branchId = await resolveBranchAndFloorContext(
      supabase,
      context.org.id,
      context.selectedBranch.id
    );

    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        org_id: context.org.id,
        branch_id: branchId,
        customer_name: input.customer_name.trim(),
        customer_phone: input.customer_phone?.trim() || null,
        customer_email: input.customer_email?.trim() || null,
        party_size: input.party_size || 2,
        reservation_time: input.reservation_time,
        table_id: input.table_id || null,
        notes: input.notes?.trim() || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    if (input.table_id) {
      await supabase
        .from("tables")
        .update({ status: "reserved" })
        .eq("id", input.table_id);
    }

    return { success: true, reservation };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create reservation.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Reservation Status
 */
export async function updateReservationStatus(
  reservationId: string,
  status: Reservation["status"]
) {
  try {
    const context = await resolveUserContext();
    if (!context.org) {
      return { success: false, error: "Authenticated organization context required." };
    }

    const supabase = await createClient();

    const { data: reservation, error } = await supabase
      .from("reservations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reservationId)
      .eq("org_id", context.org.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    if (status === "seated" && reservation?.table_id) {
      await supabase
        .from("tables")
        .update({ status: "occupied" })
        .eq("id", reservation.table_id);
    }

    return { success: true, reservation };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update reservation.";
    return { success: false, error: msg };
  }
}
