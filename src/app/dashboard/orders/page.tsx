import { resolveUserContext } from "@/domain/context/service";
import { getPaginatedOrders } from "@/domain/orders/actions";
import { OrdersView } from "@/components/orders/OrdersView";

export default async function OrdersPage() {
  const context = await resolveUserContext();
  const initialResult = await getPaginatedOrders({ date_range: "today", page: 1, page_size: 10 });

  const currentBranchId = context.selectedBranch?.id || "all";
  const branches = context.branches.map((b) => ({
    id: b.id,
    name: b.name,
    isAll: b.isAll,
  }));

  return (
    <OrdersView
      initialResult={initialResult}
      branches={branches}
      currentBranchId={currentBranchId}
      isMultiBranchEntitled={context.isMultiBranchEntitled}
    />
  );
}
