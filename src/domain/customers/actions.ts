"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";

export interface CustomerPreferences {
  dietary?: string[]; // e.g. ["Vegan", "Gluten-Free", "Nut Allergy"]
  favorite_items?: string[];
  seating?: string | null; // e.g. "Window", "Booth", "Quiet Area"
}

export interface CustomerBranchActivity {
  customer_id: string;
  branch_id: string;
  visit_count: number;
  total_spent: number;
  last_visit_at: string;
}

export interface CustomerProfile {
  id: string;
  org_id: string;
  name: string;
  phone?: string;
  email?: string;
  preferences?: CustomerPreferences;
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_visit_at?: string;
  created_at: string;
  tier?: "VIP" | "Regular" | "New Guest";
  branch_activity?: CustomerBranchActivity[];
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  preferences?: CustomerPreferences;
  notes?: string;
}

/**
 * Server Action: Fetch Customers Overview with Organization-wide identities and branch breakdown
 */
export async function getCustomersOverview(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org) {
      return {
        success: false,
        error: "Authenticated context required.",
        customers: [],
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;

    // Parallel fetch for Customers and Per-Branch Activity
    const [customersRes, activityRes] = await Promise.all([
      supabase.from("customers").select("*").eq("org_id", orgId).order("total_spent", { ascending: false }),
      supabase.from("customer_branch_activity").select("*"),
    ]);

    const rawCustomers = customersRes.data || [];
    const activities = (activityRes.data || []) as CustomerBranchActivity[];

    const customers: CustomerProfile[] = rawCustomers.map((c) => {
      const customerActivities = activities.filter((a) => a.customer_id === c.id);
      const spent = Number(c.total_spent || 0);
      const orders = Number(c.total_orders || 0);

      // VIP calculation rule: Spent > $500 OR > 5 orders
      let tier: "VIP" | "Regular" | "New Guest" = "New Guest";
      if (spent >= 500 || orders >= 5) {
        tier = "VIP";
      } else if (orders >= 2) {
        tier = "Regular";
      }

      return {
        ...c,
        total_spent: spent,
        total_orders: orders,
        preferences: (c.preferences || { dietary: [], favorite_items: [], seating: null }) as CustomerPreferences,
        tier,
        branch_activity: customerActivities,
      };
    });

    return {
      success: true,
      customers,
      organization: context.org,
      selectedBranch: context.selectedBranch,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load customers.";
    return {
      success: false,
      error: msg,
      customers: [],
    };
  }
}

/**
 * Server Action: Create or Upsert Organization-Wide Customer Profile
 */
export async function createCustomer(input: CreateCustomerInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        org_id: context.org.id,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        preferences: input.preferences || { dietary: [], favorite_items: [], seating: null },
        notes: input.notes?.trim() || null,
        total_orders: 0,
        total_spent: 0.0,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, customer };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create customer." };
  }
}

/**
 * Server Action: Update Guest Preferences & Staff Notes
 */
export async function updateCustomerPreferences(
  customerId: string,
  preferences: CustomerPreferences,
  notes?: string
) {
  try {
    const supabase = await createClient();
    const { data: customer, error } = await supabase
      .from("customers")
      .update({
        preferences,
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, customer };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update preferences." };
  }
}
