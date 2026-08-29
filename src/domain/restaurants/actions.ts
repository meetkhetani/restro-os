"use server";

import { createClient } from "@/lib/supabase/server";
import { RestaurantSchema, type CreateRestaurantInput } from "@/lib/validations";
import { Restaurant } from "../types";

export async function getRestaurantsForOrg(orgId: string): Promise<Restaurant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }

  return data as Restaurant[];
}

export async function createRestaurant(orgId: string, input: CreateRestaurantInput) {
  const validated = RestaurantSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      org_id: orgId,
      name: validated.name,
      code: validated.code.toUpperCase(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Restaurant;
}
