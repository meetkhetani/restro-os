import { resolveUserContext } from "@/domain/context/service";
import { getKitchenOrders } from "@/domain/kitchen/actions";
import { KitchenDisplayClient } from "@/components/kitchen/KitchenDisplayClient";

export default async function KitchenPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getKitchenOrders(branchId);
  const initialOrders = res.orders || [];

  return (
    <KitchenDisplayClient
      initialOrders={initialOrders}
      currentBranchId={branchId}
      branchName={branchName}
    />
  );
}
