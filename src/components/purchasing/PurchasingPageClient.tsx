"use client";

import * as React from "react";
import { PurchaseOrder, Supplier, getPurchasingOverview } from "@/domain/purchasing/actions";
import { Ingredient } from "@/domain/inventory/actions";
import { PurchasingCatalogClient } from "./PurchasingCatalogClient";

interface PurchasingPageClientProps {
  initialSuppliers: Supplier[];
  initialPurchaseOrders: PurchaseOrder[];
  initialIngredients?: Ingredient[];
  currentBranchId: string;
  branchName: string;
}

export function PurchasingPageClient({
  initialSuppliers = [],
  initialPurchaseOrders = [],
  initialIngredients = [],
  currentBranchId,
  branchName,
}: PurchasingPageClientProps) {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>(initialPurchaseOrders);

  const fetchLatestPurchasing = async () => {
    const res = await getPurchasingOverview(currentBranchId);
    if (res.success) {
      setSuppliers(res.suppliers || []);
      setPurchaseOrders(res.purchaseOrders || []);
    }
  };

  return (
    <PurchasingCatalogClient
      initialSuppliers={suppliers}
      initialPurchaseOrders={purchaseOrders}
      initialIngredients={initialIngredients}
      currentBranchId={currentBranchId}
      branchName={branchName}
      onRefresh={fetchLatestPurchasing}
    />
  );
}
