"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";
import { Category, MenuItem, ModifierGroup, ModifierOption } from "../pos/types";

export interface ItemVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
}

export interface BranchItemOverride {
  menu_item_id: string;
  branch_id: string;
  price_override?: number | null;
  is_available: boolean;
}

export interface MenuItemExtended extends MenuItem {
  category_name?: string;
  variants?: ItemVariant[];
  branch_overrides?: BranchItemOverride[];
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  display_order?: number;
  branch_id?: string;
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  category_id?: string;
  price: number;
  tax_rate: number;
  image_url?: string;
  is_available?: boolean;
  branch_id?: string;
  modifier_group_ids?: string[];
}

export interface CreateModifierGroupInput {
  name: string;
  min_selection: number;
  max_selection: number;
  is_required: boolean;
}

/**
 * Server Action: Fetch Complete Menu Catalog (Categories, Dishes, Modifiers, Variants & Overrides)
 */
export async function getMenuCatalog(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org) {
      return {
        success: false,
        error: "Authenticated context required.",
        categories: [],
        items: [],
        modifierGroups: [],
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const branchId = branchIdParam && branchIdParam !== "all" ? branchIdParam : context.selectedBranch?.id || "";

    // Parallel execution for Categories, Menu Items, Variants, Modifiers, and Branch Overrides
    const [categoriesRes, itemsRes, variantsRes, modifiersRes, overridesRes] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("org_id", orgId)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),

      supabase
        .from("menu_items")
        .select("*, modifier_groups:menu_item_modifier_groups(modifier_group_id)")
        .eq("org_id", orgId)
        .order("name", { ascending: true }),

      supabase
        .from("item_variants")
        .select("*"),

      supabase
        .from("modifier_groups")
        .select("*, options:modifier_options(*)")
        .eq("org_id", orgId),

      supabase
        .from("branch_item_overrides")
        .select("*"),
    ]);

    const categories = (categoriesRes.data || []) as Category[];
    const rawItems = itemsRes.data || [];
    const variants = (variantsRes.data || []) as ItemVariant[];
    const modifierGroups = (modifiersRes.data || []) as ModifierGroup[];
    const overrides = (overridesRes.data || []) as BranchItemOverride[];

    const items: MenuItemExtended[] = rawItems.map((item) => {
      const cat = categories.find((c) => c.id === item.category_id);
      const itemVariants = variants.filter((v) => v.menu_item_id === item.id);
      const itemOverrides = overrides.filter((o) => o.menu_item_id === item.id);

      // Check if branch override exists for currently selected branch
      const branchOverride = branchId ? itemOverrides.find((o) => o.branch_id === branchId) : null;
      const effectivePrice = branchOverride?.price_override != null ? Number(branchOverride.price_override) : Number(item.price);
      const effectiveAvailability = branchOverride ? branchOverride.is_available : item.is_available;

      return {
        ...item,
        price: effectivePrice,
        is_available: effectiveAvailability,
        category_name: cat?.name || "Uncategorized",
        variants: itemVariants,
        branch_overrides: itemOverrides,
      };
    });

    return {
      success: true,
      categories,
      items,
      modifierGroups,
      branch: context.selectedBranch,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load menu catalog.";
    return {
      success: false,
      error: msg,
      categories: [],
      items: [],
      modifierGroups: [],
    };
  }
}

/**
 * Server Action: Create Category
 */
export async function createCategory(input: CreateCategoryInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Active organization context required." };

    const supabase = await createClient();
    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        org_id: context.org.id,
        branch_id: input.branch_id || null,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        display_order: input.display_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, category };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create category." };
  }
}

/**
 * Server Action: Delete Category
 */
export async function deleteCategory(categoryId: string) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Active organization context required." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete category." };
  }
}

/**
 * Server Action: Create Menu Item
 */
export async function createMenuItem(input: CreateMenuItemInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Active organization context required." };

    const supabase = await createClient();

    // 1. Insert Menu Item
    const { data: item, error: itemError } = await supabase
      .from("menu_items")
      .insert({
        org_id: context.org.id,
        branch_id: input.branch_id || null,
        category_id: input.category_id || null,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: input.price,
        tax_rate: input.tax_rate,
        image_url: input.image_url?.trim() || null,
        is_available: input.is_available ?? true,
      })
      .select()
      .single();

    if (itemError || !item) return { success: false, error: itemError?.message || "Failed to create menu item." };

    // 2. Link Modifier Groups if selected
    if (input.modifier_group_ids && input.modifier_group_ids.length > 0) {
      const junctionRows = input.modifier_group_ids.map((groupId) => ({
        menu_item_id: item.id,
        modifier_group_id: groupId,
      }));
      await supabase.from("menu_item_modifier_groups").insert(junctionRows);
    }

    return { success: true, item };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create menu item." };
  }
}

/**
 * Server Action: Delete Menu Item
 */
export async function deleteMenuItem(itemId: string) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Active organization context required." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete item." };
  }
}

/**
 * Server Action: Toggle Branch Item Availability / Price Override
 */
export async function toggleMenuItemBranchOverride(
  menuItemId: string,
  branchId: string,
  isAvailable: boolean,
  priceOverride?: number | null
) {
  try {
    const supabase = await createClient();

    const { data: override, error } = await supabase
      .from("branch_item_overrides")
      .upsert(
        {
          menu_item_id: menuItemId,
          branch_id: branchId,
          is_available: isAvailable,
          price_override: priceOverride != null ? priceOverride : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "menu_item_id, branch_id" }
      )
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, override };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to set branch override." };
  }
}

/**
 * Server Action: Create Modifier Group & Add Modifier Option
 */
export async function createModifierGroup(input: CreateModifierGroupInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Active organization context required." };

    const supabase = await createClient();
    const { data: group, error } = await supabase
      .from("modifier_groups")
      .insert({
        org_id: context.org.id,
        name: input.name.trim(),
        min_selection: input.min_selection,
        max_selection: input.max_selection,
        is_required: input.is_required,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, group };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create modifier group." };
  }
}

export async function addModifierOption(
  groupId: string,
  name: string,
  priceDelta: number
) {
  try {
    const supabase = await createClient();
    const { data: option, error } = await supabase
      .from("modifier_options")
      .insert({
        group_id: groupId,
        name: name.trim(),
        price_delta: priceDelta,
        is_available: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, option };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to add modifier option." };
  }
}

/**
 * Server Action: Create Item Variant
 */
export async function createItemVariant(
  menuItemId: string,
  name: string,
  priceDelta: number
) {
  try {
    const supabase = await createClient();
    const { data: variant, error } = await supabase
      .from("item_variants")
      .insert({
        menu_item_id: menuItemId,
        name: name.trim(),
        price_delta: priceDelta,
        is_available: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, variant };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create variant." };
  }
}
