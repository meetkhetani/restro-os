"use server";

import { createClient } from "@/lib/supabase/server";
import { LocationSchema, type CreateLocationInput } from "@/lib/validations";
import { Location } from "../types";

export async function getLocationsForRestaurant(restaurantId: string): Promise<Location[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }

  return data as Location[];
}

export async function createLocation(input: CreateLocationInput) {
  const validated = LocationSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .insert({
      restaurant_id: validated.restaurant_id,
      name: validated.name,
      timezone: validated.timezone,
      phone: validated.phone || null,
      address: validated.address || {},
      status: validated.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Location;
}
