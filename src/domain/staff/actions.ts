"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";

export type SystemRole = "owner" | "manager" | "cashier" | "kitchen" | "waiter" | "inventory_manager";

export interface BranchMembership {
  id: string;
  org_id: string;
  branch_id: string;
  user_id: string;
  is_primary: boolean;
  branch_name?: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  org_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: SystemRole;
  status: "active" | "inactive";
  created_at: string;
  branch_assignments?: BranchMembership[];
}

export interface RolePermissions {
  role: SystemRole;
  pos_access: boolean;
  kds_access: boolean;
  menu_management: boolean;
  inventory_control: boolean;
  purchasing_control: boolean;
  crm_access: boolean;
  billing_access: boolean;
  reports_access: boolean;
}

export interface CreateStaffInput {
  email: string;
  full_name: string;
  role: SystemRole;
  branch_ids: string[];
}

/**
 * Server Action: Fetch Staff Roster & Branch Assignments
 */
export async function getStaffOverview() {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org) {
      return {
        success: false,
        error: "Authenticated organization context required.",
        staff: [],
        branches: [],
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;

    // Parallel fetch for Memberships (with profiles), Branches, and Branch Memberships
    const [membershipsRes, branchesRes, branchMembershipsRes] = await Promise.all([
      supabase.from("memberships").select("*, profile:profiles(*)").eq("org_id", orgId),
      supabase.from("branches").select("id, name").eq("org_id", orgId),
      supabase.from("branch_memberships").select("*").eq("org_id", orgId),
    ]);

    const memberships = membershipsRes.data || [];
    const branches = branchesRes.data || [];
    const branchMemberships = branchMembershipsRes.data || [];

    const staff: StaffMember[] = memberships.map((m) => {
      const userBranchMemberships = branchMemberships
        .filter((bm) => bm.user_id === m.user_id)
        .map((bm) => {
          const b = branches.find((br) => br.id === bm.branch_id);
          return {
            ...bm,
            branch_name: b?.name || "Unknown Branch",
          };
        });

      const profile = m.profile;

      return {
        id: m.id,
        user_id: m.user_id,
        org_id: m.org_id,
        full_name: profile?.full_name || m.email || "Staff Member",
        email: profile?.email || m.email || "No email",
        phone: profile?.phone || undefined,
        role: m.role as SystemRole,
        status: (m.status || "active") as "active" | "inactive",
        created_at: m.created_at,
        branch_assignments: userBranchMemberships,
      };
    });

    return {
      success: true,
      staff,
      branches,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load staff roster.";
    return {
      success: false,
      error: msg,
      staff: [],
      branches: [],
    };
  }
}

/**
 * Server Action: Fetch Role Permissions Matrix
 */
export async function getRolePermissionsMatrix() {
  try {
    const supabase = await createClient();
    const { data: matrix, error } = await supabase.from("system_role_permissions").select("*");
    if (error) return { success: false, error: error.message, matrix: [] };
    return { success: true, matrix: (matrix || []) as RolePermissions[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch matrix.", matrix: [] };
  }
}

/**
 * Server Action: Update Staff Role, Active Status, and Branch Assignments
 */
export async function updateStaffRoleAndBranches(
  userId: string,
  role: SystemRole,
  branchIds: string[],
  status: "active" | "inactive"
) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Active organization context required." };

    const supabase = await createClient();
    const orgId = context.org.id;

    // 1. Update Membership Role & Status
    const { error: memErr } = await supabase
      .from("memberships")
      .update({ role, status, updated_at: new Date().toISOString() })
      .eq("org_id", orgId)
      .eq("user_id", userId);

    if (memErr) return { success: false, error: memErr.message };

    // 2. Refresh Branch Memberships
    await supabase.from("branch_memberships").delete().eq("org_id", orgId).eq("user_id", userId);

    if (branchIds && branchIds.length > 0) {
      const newRows = branchIds.map((branchId, idx) => ({
        org_id: orgId,
        branch_id: branchId,
        user_id: userId,
        is_primary: idx === 0,
      }));
      await supabase.from("branch_memberships").insert(newRows);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update staff access." };
  }
}

/**
 * Server Action: DATABASE & SERVER-ENFORCED BRANCH ACCESS AUTHORIZATION VERIFICATION
 * CRITICAL RULE: Server-side database enforcement prevents unauthorized cross-branch data access.
 */
export async function verifyBranchAccess(branchId: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.user) {
      return { authorized: false, reason: "Unauthenticated user context." };
    }

    const supabase = await createClient();
    const userId = context.user.id;
    const orgId = context.org.id;

    // 1. Fetch User Membership in Org
    const { data: membership } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership || membership.status === "inactive") {
      return { authorized: false, reason: "Account inactive or no organization membership." };
    }

    // 2. Owners and Managers have org-wide access to all branches
    if (membership.role === "owner" || membership.role === "manager") {
      return { authorized: true, role: membership.role };
    }

    // 3. Check specific branch membership for standard branch staff
    const { data: branchMem } = await supabase
      .from("branch_memberships")
      .select("id")
      .eq("org_id", orgId)
      .eq("branch_id", branchId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!branchMem) {
      return { authorized: false, reason: `User unauthorized for branch ID: ${branchId}` };
    }

    return { authorized: true, role: membership.role };
  } catch (err: unknown) {
    return { authorized: false, reason: err instanceof Error ? err.message : "Authorization verification error." };
  }
}
