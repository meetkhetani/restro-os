"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPlan, canAccess } from "../entitlements/service";
import { BranchOption } from "./types";
import { Organization, Branch } from "../types";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_BRANCH_1_ID = "00000000-0000-0000-0000-000000000101";

/**
 * High-performance memoized context resolver.
 * Executes a single parallel Promise.all read query across auth, memberships, and branches.
 * Eliminates sequential database writes on page navigation requests.
 */
export const resolveUserContext = cache(async function (
  orgIdParam?: string,
  branchIdParam?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authenticated: false,
      user: null,
      org: null,
      orgs: [],
      branches: [],
      selectedBranch: null,
      plan: null,
      isMultiBranchEntitled: false,
    };
  }

  // Single Parallel Promise.all execution for Profile, Memberships, and Branches
  const [profileRes, membershipsRes, branchesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("*, organization:organizations(*), role:roles(*)")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase.from("branches").select("*").eq("status", "active"),
  ]);

  const profile = profileRes.data || {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email || "Restro User",
    email: user.email || "user@restro.os",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const memberships = membershipsRes.data || [];
  const orgs = memberships.map((m) => m.organization as Organization).filter(Boolean);

  let activeOrg = orgs.find((o) => o.id === orgIdParam) || orgs[0];

  if (!activeOrg) {
    activeOrg = {
      id: DEFAULT_ORG_ID,
      name: "Grand Restro Group",
      slug: "grand-restro",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Resolve Plan & Multi-Branch Entitlements in Parallel
  const [plan, isMultiBranchEntitled] = await Promise.all([
    getCurrentPlan(activeOrg.id),
    canAccess(activeOrg.id, "analytics.cross_branch"),
  ]);

  const dbBranches = (branchesRes.data || []) as Branch[];
  const activeOrgBranches = dbBranches.filter((b) => b.org_id === activeOrg.id);

  const availableBranches: BranchOption[] = [];

  if (isMultiBranchEntitled) {
    availableBranches.push({
      id: "all",
      name: "All Branches (Central View)",
      isAll: true,
    });
  }

  if (activeOrgBranches.length > 0) {
    activeOrgBranches.forEach((b) => {
      availableBranches.push({
        id: b.id,
        name: b.name,
        code: b.code || b.id.substring(0, 6).toUpperCase(),
      });
    });
  } else {
    availableBranches.push({
      id: DEFAULT_BRANCH_1_ID,
      name: "Downtown Main Branch",
      code: "DTMain",
    });
  }

  // Resolve Selected Branch
  let selectedBranch = availableBranches.find((b) => b.id === branchIdParam);
  if (!selectedBranch) {
    selectedBranch = availableBranches[0];
  }

  if (selectedBranch?.id === "all" && !isMultiBranchEntitled) {
    selectedBranch = availableBranches.find((b) => !b.isAll) || availableBranches[0];
  }

  return {
    authenticated: true,
    user: profile,
    org: activeOrg,
    orgs: orgs.length > 0 ? orgs : [activeOrg],
    branches: availableBranches,
    selectedBranch,
    plan,
    isMultiBranchEntitled,
  };
});
