"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPlan, canAccess } from "../entitlements/service";
import { BranchOption } from "./types";
import { Organization, Location } from "../types";

/**
 * High-performance memoized context resolver.
 * Parallelizes independent database queries to eliminate waterfalls.
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

  // 1. Parallel execution of Profile & Memberships queries
  const [profileRes, membershipsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("memberships")
      .select("*, organization:organizations(*), role:roles(*)")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const profile = profileRes.data;
  const memberships = membershipsRes.data || [];

  const orgs = memberships.map((m) => m.organization as Organization).filter(Boolean);
  const activeOrg = orgs.find((o) => o.id === orgIdParam) || orgs[0] || {
    id: "demo-org-1",
    name: "Grand Restro Group",
    slug: "grand-restro",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 2. Parallel execution of Plan, Entitlement, and Restaurants queries
  const [plan, isMultiBranchEntitled, restaurantsRes] = await Promise.all([
    getCurrentPlan(activeOrg.id),
    canAccess(activeOrg.id, "analytics.cross_branch"),
    supabase.from("restaurants").select("id").eq("org_id", activeOrg.id),
  ]);

  const restaurantIds = (restaurantsRes.data || []).map((r) => r.id);

  let rawLocations: Location[] = [];
  if (restaurantIds.length > 0) {
    const { data: locs } = await supabase
      .from("locations")
      .select("*")
      .in("restaurant_id", restaurantIds);
    rawLocations = (locs || []) as Location[];
  }

  // Default fallback demo locations if DB is empty for demo setup
  if (rawLocations.length === 0) {
    rawLocations = [
      {
        id: "loc-101",
        restaurant_id: "r-1",
        name: "Downtown Main Branch",
        timezone: "America/New_York",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "loc-102",
        restaurant_id: "r-1",
        name: "Uptown Express Outlet",
        timezone: "America/New_York",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // 3. Construct Available Branch Options
  const availableBranches: BranchOption[] = [];

  if (isMultiBranchEntitled) {
    availableBranches.push({
      id: "all",
      name: "All Branches (Central View)",
      isAll: true,
    });
  }

  rawLocations.forEach((loc) => {
    availableBranches.push({
      id: loc.id,
      name: loc.name,
      code: loc.id.substring(0, 6).toUpperCase(),
    });
  });

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
    orgs,
    branches: availableBranches,
    selectedBranch,
    plan,
    isMultiBranchEntitled,
  };
});
