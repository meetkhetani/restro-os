"use client";

import * as React from "react";
import {
  BranchInventoryItem,
  Ingredient,
  StockMovement,
  StockTransfer,
  getBranchInventory,
} from "@/domain/inventory/actions";
import { InventoryCatalogClient } from "./InventoryCatalogClient";

interface InventoryPageClientProps {
  initialInventory: BranchInventoryItem[];
  initialIngredients: Ingredient[];
  initialMovements: StockMovement[];
  initialTransfers: StockTransfer[];
  currentBranchId: string;
  branchName: string;
}

export function InventoryPageClient({
  initialInventory = [],
  initialIngredients = [],
  initialMovements = [],
  initialTransfers = [],
  currentBranchId,
  branchName,
}: InventoryPageClientProps) {
  const [inventory, setInventory] = React.useState<BranchInventoryItem[]>(initialInventory);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>(initialIngredients);
  const [movements, setMovements] = React.useState<StockMovement[]>(initialMovements);
  const [transfers, setTransfers] = React.useState<StockTransfer[]>(initialTransfers);

  const fetchLatestData = async () => {
    const res = await getBranchInventory(currentBranchId);
    if (res.success) {
      setInventory(res.inventory || []);
      setIngredients(res.ingredients || []);
      setMovements(res.movements || []);
      setTransfers(res.transfers || []);
    }
  };

  return (
    <InventoryCatalogClient
      initialInventory={inventory}
      initialIngredients={ingredients}
      initialMovements={movements}
      initialTransfers={transfers}
      currentBranchId={currentBranchId}
      branchName={branchName}
      onRefresh={fetchLatestData}
    />
  );
}
