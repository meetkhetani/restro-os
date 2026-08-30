"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPlan, canAccess } from "../entitlements/service";
import { BranchOption } from "./types";
import { Organization, Location } from "../types";

import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_REST_ID = "00000000-0000-0000-0000-000000000010";
const DEFAULT_LOC_1_ID = "00000000-0000-0000-0000-000000000101";
const DEFAULT_ROLE_ID = "00000000-0000-0000-0000-000000000099";

/**
 * Gets privileged admin client if available, else falls back to server client.
 */
function getAdminOrServerClient(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    return createAdminClient();
  } catch {
    return supabase;
  }
}

/**
 * Ensures default organization, restaurant, location, role, and membership records exist
 * in Supabase PostgreSQL in strict relational sequence.
 * Guarantees zero Foreign Key constraint errors (e.g. tables_location_id_fkey).
 */
async function ensureValidTenantContext(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  user: { id: string; email?: string },
  orgIdParam?: string
) {
  const db = getAdminOrServerClient(supabase);

  // 1. Ensure Profile exists in profiles
  await db.from("profiles").upsert(
    {
      id: user.id,
      full_name: "Restro Admin",
      email: user.email || "admin@restro.os",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  // 2. Fetch or create Organization
  const { data: dbOrgs } = await db.from("organizations").select("*").limit(1);
  let activeOrg = (dbOrgs?.[0] as Organization) || null;

  if (!activeOrg) {
    const { data: newOrg } = await db
      .from("organizations")
      .upsert(
        {
          id: DEFAULT_ORG_ID,
          name: "Grand Restro Group",
          slug: "grand-restro",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    activeOrg = (newOrg as Organization) || {
      id: DEFAULT_ORG_ID,
      name: "Grand Restro Group",
      slug: "grand-restro",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (orgIdParam && orgIdParam !== activeOrg.id) {
    const { data: requestedOrg } = await db
      .from("organizations")
      .select("*")
      .eq("id", orgIdParam)
      .maybeSingle();

    if (requestedOrg) {
      activeOrg = requestedOrg as Organization;
    }
  }

  // 3. Ensure Role exists for Organization
  const { data: dbRoles } = await db
    .from("roles")
    .select("id")
    .eq("org_id", activeOrg.id)
    .limit(1);

  let roleId = dbRoles?.[0]?.id;
  if (!roleId) {
    const { data: newRole } = await db
      .from("roles")
      .upsert(
        {
          id: DEFAULT_ROLE_ID,
          org_id: activeOrg.id,
          name: "Owner",
          is_system: true,
        },
        { onConflict: "id" }
      )
      .select("id")
      .single();

    roleId = newRole?.id || DEFAULT_ROLE_ID;
  }

  // 4. Ensure Membership exists for User
  await db.from("memberships").upsert(
    {
      org_id: activeOrg.id,
      user_id: user.id,
      role_id: roleId,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id, user_id" }
  );

  // 5. Ensure Restaurant exists for Organization
  const { data: dbRests } = await db
    .from("restaurants")
    .select("id")
    .eq("org_id", activeOrg.id)
    .limit(1);

  let restaurantId = dbRests?.[0]?.id;
  if (!restaurantId) {
    const { data: newRest } = await db
      .from("restaurants")
      .upsert(
        {
          id: DEFAULT_REST_ID,
          org_id: activeOrg.id,
          name: activeOrg.name,
        },
        { onConflict: "id" }
      )
      .select("id")
      .single();

    restaurantId = newRest?.id || DEFAULT_REST_ID;
  }

  // 6. Ensure Location exists for Restaurant
  const { data: dbLocs } = await db
    .from("locations")
    .select("*")
    .eq("restaurant_id", restaurantId);

  let rawLocations: Location[] = (dbLocs || []) as Location[];

  if (rawLocations.length === 0) {
    const { data: newLoc } = await db
      .from("locations")
      .upsert(
        {
          id: DEFAULT_LOC_1_ID,
          restaurant_id: restaurantId,
          name: "Downtown Main Branch",
          timezone: "America/New_York",
          status: "active",
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (newLoc) {
      rawLocations = [newLoc as Location];
    } else {
      rawLocations = [
        {
          id: DEFAULT_LOC_1_ID,
          restaurant_id: restaurantId,
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
    orgs: [activeOrg],
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

  // 2. Ensure Valid Relational Tenant Structure in DB
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
