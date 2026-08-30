import { resolveUserContext } from "@/domain/context/service";
import { getPurchasingOverview } from "@/domain/purchasing/actions";
import { PurchasingPageClient } from "@/components/purchasing/PurchasingPageClient";

export default async function PurchasingPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getPurchasingOverview(branchId);

  return (
    <PurchasingPageClient
      initialSuppliers={res.suppliers || []}
      initialPurchaseOrders={res.purchaseOrders || []}
      currentBranchId={branchId}
      branchName={branchName}
    />
  );
}
