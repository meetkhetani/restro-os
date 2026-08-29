"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPlan, canAccess } from "../entitlements/service";
import { BranchOption } from "./types";
import { Organization, Location } from "../types";

export async function resolveUserContext(orgIdParam?: string, branchIdParam?: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      authenticated: false,
      user: null,
      org: null,
      branches: [],
      selectedBranch: null,
      plan: null,
      isMultiBranchEntitled: false,
    };
  }

  // 1. Fetch User Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch User Organizations & Active Memberships
  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, organization:organizations(*), role:roles(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const orgs = (memberships || []).map((m) => m.organization as Organization).filter(Boolean);
  const activeOrg = orgs.find((o) => o.id === orgIdParam) || orgs[0] || {
    id: "demo-org-1",
    name: "Grand Restro Group",
    slug: "grand-restro",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3. Resolve Active Plan & Entitlements
  const plan = await getCurrentPlan(activeOrg.id);
  const isMultiBranchEntitled = await canAccess(activeOrg.id, "analytics.cross_branch");

  // 4. Fetch Locations for Organization
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id")
    .eq("org_id", activeOrg.id);

  const restaurantIds = (restaurants || []).map((r) => r.id);

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

  // 5. Construct Available Branch Options
  const availableBranches: BranchOption[] = [];

  // If Multi-Branch plan entitled, add 'All Branches' option
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

  // Security Check: If user tries to select 'all' without Multi-Branch entitlement, fallback to 1st branch
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
}
