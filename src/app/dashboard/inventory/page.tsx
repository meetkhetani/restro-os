import { resolveUserContext } from "@/domain/context/service";
import { getBranchInventory } from "@/domain/inventory/actions";
import { InventoryPageClient } from "@/components/inventory/InventoryPageClient";

export default async function InventoryPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getBranchInventory(branchId);

  return (
    <InventoryPageClient
      initialInventory={res.inventory || []}
      initialIngredients={res.ingredients || []}
      initialMovements={res.movements || []}
      initialTransfers={res.transfers || []}
      currentBranchId={branchId}
      branchName={branchName}
    />
  );
}
