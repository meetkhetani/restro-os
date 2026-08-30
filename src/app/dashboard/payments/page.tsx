import { resolveUserContext } from "@/domain/context/service";
import { getPaymentsOverview } from "@/domain/finance/actions";
import { PaymentsPageClient } from "@/components/finance/PaymentsPageClient";

export default async function PaymentsPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getPaymentsOverview(branchId);

  return (
    <PaymentsPageClient
      initialPayments={res.payments || []}
      totals={res.totals || { total: 0, cash: 0, card: 0, upi: 0, other: 0 }}
      branchName={branchName}
    />
  );
}
