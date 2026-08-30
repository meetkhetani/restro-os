import { resolveUserContext } from "@/domain/context/service";
import { getExpensesOverview } from "@/domain/finance/actions";
import { ExpensesPageClient } from "@/components/finance/ExpensesPageClient";

export default async function ExpensesPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getExpensesOverview(branchId);

  return (
    <ExpensesPageClient
      initialExpenses={res.expenses || []}
      totalExpense={res.totalExpense || 0}
      branchName={branchName}
      branchId={branchId}
    />
  );
}
