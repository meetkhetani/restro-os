"use client";

import * as React from "react";
import { Category, ModifierGroup } from "@/domain/pos/types";
import { MenuItemExtended, getMenuCatalog } from "@/domain/menu/actions";
import { MenuCatalogClient } from "./MenuCatalogClient";

interface MenuPageClientProps {
  initialCategories: Category[];
  initialItems: MenuItemExtended[];
  initialModifierGroups: ModifierGroup[];
  currentBranchId: string;
  branchName: string;
}

export function MenuPageClient({
  initialCategories = [],
  initialItems = [],
  initialModifierGroups = [],
  currentBranchId,
  branchName,
}: MenuPageClientProps) {
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [items, setItems] = React.useState<MenuItemExtended[]>(initialItems);
  const [modifierGroups, setModifierGroups] = React.useState<ModifierGroup[]>(initialModifierGroups);

  const fetchLatestMenu = async () => {
    const res = await getMenuCatalog(currentBranchId);
    if (res.success) {
      setCategories(res.categories || []);
      setItems(res.items || []);
      setModifierGroups(res.modifierGroups || []);
    }
  };

  return (
    <MenuCatalogClient
      initialCategories={categories}
      initialItems={items}
      initialModifierGroups={modifierGroups}
      currentBranchId={currentBranchId}
      branchName={branchName}
      onRefresh={fetchLatestMenu}
    />
  );
}
