"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/domain/context/service";
import {
  TableItemExtended,
  TableStatus,
  Reservation,
  ReservationStatus,
  CreateTableInput,
  UpdateTableInput,
  TransferOrderInput,
  MergeTablesInput,
  CreateReservationInput,
} from "./types";
import { Order } from "@/domain/pos/types";

/**
 * Fetch Floor Plan Tables, Active Orders, and Reservations concurrently for target branch context.
 */
export async function getTablesAndFloorData(branchIdParam?: string) {
  const context = await resolveUserContext();

  if (!context.org) {
    return {
      tables: [] as TableItemExtended[],
      reservations: [] as Reservation[],
      floorAreas: ["Main Floor"],
      stats: { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0, disabled: 0 },
      branch: null,
      organization: null,
    };
  }

  const supabase = await createClient();
  const orgId = context.org.id;

  let locationId = context.selectedBranch?.id || "";
  if (branchIdParam && branchIdParam !== "all") {
    locationId = branchIdParam;
  }

  // Concurrent Promise.all fetch for Tables, Active Orders, and Reservations
  const [tablesRes, activeOrdersRes, reservationsRes] = await Promise.all([
    supabase
      .from("tables")
      .select("*")
      .eq("org_id", orgId)
      .eq("location_id", locationId)
      .order("table_number", { ascending: true }),

    supabase
      .from("orders")
      .select("*, customer:customers(*), items:order_items(*)")
      .eq("org_id", orgId)
      .eq("location_id", locationId)
      .in("status", ["pending", "confirmed", "preparing", "ready"]),

    supabase
      .from("reservations")
      .select("*, table:tables(*)")
      .eq("org_id", orgId)
      .eq("location_id", locationId)
      .order("reservation_time", { ascending: true }),
  ]);

  const rawTables = tablesRes.data || [];
  const activeOrders = (activeOrdersRes.data || []) as Order[];
  const reservations = (reservationsRes.data || []) as Reservation[];

  // Map active order to occupied tables
  const tables: TableItemExtended[] = rawTables.map((tbl) => {
    const activeOrder = activeOrders.find((o) => o.table_id === tbl.id) || null;
    return {
      ...tbl,
      capacity: Number(tbl.capacity),
      floor_area: tbl.floor_area || tbl.section || "Main Floor",
      pos_x: Number(tbl.pos_x || 0),
      pos_y: Number(tbl.pos_y || 0),
      shape: tbl.shape || "square",
      active_order: activeOrder,
    };
  });

  // Extract unique floor areas
  const floorAreaSet = new Set<string>();
  tables.forEach((t) => floorAreaSet.add(t.floor_area));
  if (floorAreaSet.size === 0) floorAreaSet.add("Main Floor");
  const floorAreas = Array.from(floorAreaSet);

  // Compute Table Stats Summary
  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    cleaning: tables.filter((t) => t.status === "cleaning").length,
    disabled: tables.filter((t) => t.status === "disabled").length,
  };

  return {
    tables,
    reservations,
    floorAreas,
    stats,
    branch: context.selectedBranch,
    organization: context.org,
  };
}

/**
 * Server Action: Create New Floor Table
 */
export async function createTable(input: CreateTableInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org || !context.selectedBranch) {
      return { success: false, error: "Active branch context required." };
    }

    const supabase = await createClient();

    const { data: table, error } = await supabase
      .from("tables")
      .insert({
        org_id: context.org.id,
        location_id: context.selectedBranch.id,
        table_number: input.table_number.trim(),
        capacity: input.capacity,
        floor_area: input.floor_area.trim() || "Main Floor",
        section: input.floor_area.trim() || "Main Floor",
        shape: input.shape || "square",
        pos_x: input.pos_x || 0,
        pos_y: input.pos_y || 0,
        status: "available",
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, table };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create table.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Table Details & Layout Positioning
 */
export async function updateTable(input: UpdateTableInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Authentication required." };

    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.table_number) updatePayload.table_number = input.table_number.trim();
    if (input.capacity) updatePayload.capacity = input.capacity;
    if (input.floor_area) {
      updatePayload.floor_area = input.floor_area.trim();
      updatePayload.section = input.floor_area.trim();
    }
    if (input.shape) updatePayload.shape = input.shape;
    if (input.status) updatePayload.status = input.status;
    if (typeof input.pos_x === "number") updatePayload.pos_x = input.pos_x;
    if (typeof input.pos_y === "number") updatePayload.pos_y = input.pos_y;

    const { error } = await supabase
      .from("tables")
      .update(updatePayload)
      .eq("id", input.id)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };

    return { success: true, message: "Table updated successfully." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update table.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Update Table Status (Available, Occupied, Reserved, Cleaning, Disabled)
 */
export async function updateTableStatus(tableId: string, status: TableStatus) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Authentication required." };

    const supabase = await createClient();

    const { error } = await supabase
      .from("tables")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tableId)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };

    return { success: true, message: `Table status updated to ${status}.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update status.";
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Transfer Active Order from Table A to Table B
 */
export async function transferTableOrder(input: TransferOrderInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Authentication required." };

    const supabase = await createClient();
    const orgId = context.org.id;

    // 1. Fetch active order on source table
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("org_id", orgId)
      .eq("table_id", input.from_table_id)
      .in("status", ["pending", "confirmed", "preparing", "ready"])
      .maybeSingle();

    if (orderError || !order) {
      return { success: false, error: "No active order found on the source table." };
    }

    // 2. Transfer order table assignment to target table
    await supabase
      .from("orders")
      .update({ table_id: input.to_table_id, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    // 3. Update table statuses: source table -> available, target table -> occupied
    await supabase.from("tables").update({ status: "available" }).eq("id", input.from_table_id);
    await supabase.from("tables").update({ status: "occupied" }).eq("id", input.to_table_id);

    // 4. Log audit event
    await supabase.from("order_events").insert({
      order_id: order.id,
      status: "transferred",
      actor_id: context.user?.id || null,
      notes: `Order ${order.order_number} transferred from Table to Table.`,
    });

    return { success: true, message: `Order ${order.order_number} successfully transferred.` };
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
    if (!context.org) return { success: false, error: "Authentication required." };

    const supabase = await createClient();

    const { error } = await supabase
      .from("tables")
      .update({
        merged_into_table_id: input.target_table_id,
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
    if (!context.org) return { success: false, error: "Authentication required." };

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

    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        org_id: context.org.id,
        location_id: context.selectedBranch.id,
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

    // If table assigned during booking, set table status to reserved
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
 * Server Action: Update Reservation Status (e.g. Seating guests)
 */
export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
  tableId?: string
) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Authentication required." };

    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (tableId) updatePayload.table_id = tableId;

    const { error } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };

    // If seated, set table status to occupied
    if (status === "seated" && tableId) {
      await supabase
        .from("tables")
        .update({ status: "occupied" })
        .eq("id", tableId);
    }

    return { success: true, message: `Reservation status updated to ${status}.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update reservation.";
    return { success: false, error: msg };
  }
}
