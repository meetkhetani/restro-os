"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPlan, canAccess } from "../entitlements/service";
import { BranchOption } from "./types";
import { Organization, Location } from "../types";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_LOC_1_ID = "00000000-0000-0000-0000-000000000101";
const DEFAULT_LOC_2_ID = "00000000-0000-0000-0000-000000000102";

/**
 * Ensures default organization and location records exist in Supabase DB with valid UUIDs.
 * Prevents invalid UUID format errors and Foreign Key constraint violations.
 */
async function ensureValidTenantContext(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  user: { id: string },
  orgIdParam?: string
) {
  // 1. Check existing memberships & orgs
  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, organization:organizations(*), role:roles(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const orgs = (memberships || [])
    .map((m) => m.organization as Organization)
    .filter(Boolean);

  let activeOrg = orgs.find((o) => o.id === orgIdParam) || orgs[0];

  // If no org found, check database organizations table
  if (!activeOrg) {
    const { data: dbOrgs } = await supabase
      .from("organizations")
      .select("*")
      .limit(1);

    if (dbOrgs && dbOrgs.length > 0) {
      activeOrg = dbOrgs[0] as Organization;
    } else {
      // Auto-insert default organization into DB
      const { data: insertedOrg } = await supabase
        .from("organizations")
        .insert({
          id: DEFAULT_ORG_ID,
          name: "Grand Restro Group",
          slug: "grand-restro",
        })
        .select()
        .single();

      activeOrg = (insertedOrg as Organization) || {
        id: DEFAULT_ORG_ID,
        name: "Grand Restro Group",
        slug: "grand-restro",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  // 2. Fetch or create restaurants & locations
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id")
    .eq("org_id", activeOrg.id);

  let restaurantIds = (restaurants || []).map((r) => r.id);

  if (restaurantIds.length === 0) {
    const { data: insertedRest } = await supabase
      .from("restaurants")
      .insert({
        org_id: activeOrg.id,
        name: activeOrg.name,
      })
      .select("id")
      .single();

    if (insertedRest) {
      restaurantIds = [insertedRest.id];
    }
  }

  let rawLocations: Location[] = [];
  if (restaurantIds.length > 0) {
    const { data: locs } = await supabase
      .from("locations")
      .select("*")
      .in("restaurant_id", restaurantIds);
    rawLocations = (locs || []) as Location[];
  }

  // If no location exists in DB, auto-insert default location into locations table
  if (rawLocations.length === 0) {
    const { data: insertedLoc } = await supabase
      .from("locations")
      .insert({
        id: DEFAULT_LOC_1_ID,
        restaurant_id: restaurantIds[0] || activeOrg.id,
        name: "Downtown Main Branch",
        timezone: "America/New_York",
        status: "active",
      })
      .select()
      .single();

    if (insertedLoc) {
      rawLocations = [insertedLoc as Location];
    } else {
      rawLocations = [
        {
          id: DEFAULT_LOC_1_ID,
          restaurant_id: restaurantIds[0] || activeOrg.id,
          name: "Downtown Main Branch",
          timezone: "America/New_York",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
  }

  return {
    orgs: orgs.length > 0 ? orgs : [activeOrg],
    activeOrg,
    rawLocations,
  };
}

/**
 * High-performance memoized context resolver.
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

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Ensure Valid Tenant Org & Location Structure in DB
  const { orgs, activeOrg, rawLocations } = await ensureValidTenantContext(
    supabase,
    user,
    orgIdParam
  );

  // 3. Resolve Plan & Entitlements
  const [plan, isMultiBranchEntitled] = await Promise.all([
    getCurrentPlan(activeOrg.id),
    canAccess(activeOrg.id, "analytics.cross_branch"),
  ]);

  // 4. Construct Available Branch Options
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
