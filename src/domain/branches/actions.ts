"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";

export interface BranchRecord {
  id: string;
  org_id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateBranchInput {
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchInput {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

/**
 * Server Action: Fetch Organization Branches & Entitlement Status
 */
export async function getBranchesCatalog() {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org) {
      return {
        success: false,
        error: "Authenticated organization context required.",
        branches: [],
        maxBranches: 1,
        allowedToCreate: false,
        isMultiBranch: false,
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const isMultiBranch = context.plan?.code === "multi_branch" || (context.plan?.max_branches || 1) > 1;
    const maxBranches = isMultiBranch ? context.plan?.max_branches || 99 : 1;

    const { data: branchesData, error } = await supabase
      .from("branches")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (error) {
      return {
        success: false,
        error: error.message,
        branches: [],
        maxBranches,
        allowedToCreate: false,
        isMultiBranch,
      };
    }

    const branches = (branchesData || []) as BranchRecord[];
    const activeCount = branches.filter((b) => b.is_active).length;
    const allowedToCreate = isMultiBranch ? activeCount < maxBranches : activeCount < 1;

    return {
      success: true,
      branches,
      activeCount,
      maxBranches,
      allowedToCreate,
      isMultiBranch,
      selectedBranchId: context.selectedBranch?.id,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load branches.";
    return {
      success: false,
      error: msg,
      branches: [],
      maxBranches: 1,
      allowedToCreate: false,
      isMultiBranch: false,
    };
  }
}

/**
 * Server Action: Provision New Branch Outlet (Strictly Enforces Entitlement Limit)
 */
export async function createBranch(input: CreateBranchInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) {
      return { success: false, error: "Active organization context required." };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const isMultiBranch = context.plan?.code === "multi_branch" || (context.plan?.max_branches || 1) > 1;
    const maxBranches = isMultiBranch ? context.plan?.max_branches || 99 : 1;

    // Count existing active branches
    const { count } = await supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true);

    const currentActive = count || 0;

    // Entitlement Check: Block if count >= maxBranches
    if (currentActive >= maxBranches) {
      return {
        success: false,
        upgradeRequired: true,
        error: `Branch creation limit reached (${currentActive}/${maxBranches}). Upgrade to the Multi-Branch plan to manage additional outlets.`,
      };
    }

    // Insert new branch
    const { data: branch, error } = await supabase
      .from("branches")
      .insert({
        org_id: orgId,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, branch };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create branch.",
    };
  }
}

/**
 * Server Action: Update Branch Outlet Details
 */
export async function updateBranch(branchId: string, input: UpdateBranchInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();
    const { data: branch, error } = await supabase
      .from("branches")
      .update({
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", branchId)
      .eq("org_id", context.org.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, branch };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update branch." };
  }
}

/**
 * Server Action: Toggle Branch Active / Inactive Status
 */
export async function toggleBranchStatus(branchId: string, isActive: boolean) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("branches")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", branchId)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to toggle branch status." };
  }
}

/**
 * Server Action: Switch Active Branch Context Cookie
 */
export async function switchActiveBranch(branchId: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set("restro_branch_id", branchId, { path: "/", maxAge: 60 * 60 * 24 * 30 });
    return { success: true, selectedBranchId: branchId };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to switch active branch." };
  }
}
