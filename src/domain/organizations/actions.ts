"use server";

import { createClient } from "@/lib/supabase/server";
import { OrganizationSchema, type CreateOrganizationInput } from "@/lib/validations";
import { Organization } from "../types";

export async function getUserOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }

  return data as Organization[];
}

export async function createOrganization(input: CreateOrganizationInput) {
  const validated = OrganizationSchema.parse(input);
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  // Insert Organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: validated.name,
      slug: validated.slug,
      logo_url: validated.logo_url || null,
    })
    .select()
    .single();

  if (orgError) throw new Error(orgError.message);

  // Retrieve Owner System Role
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "Owner")
    .single();

  if (role) {
    // Create Owner Membership
    await supabase.from("memberships").insert({
      org_id: org.id,
      user_id: user.id,
      role_id: role.id,
      status: "active",
    });
  }

  return org as Organization;
}
