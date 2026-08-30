import { resolveUserContext } from "@/domain/context/service";
import { getCustomersOverview } from "@/domain/customers/actions";
import { CustomersPageClient } from "@/components/customers/CustomersPageClient";

export default async function CustomersPage() {
  const context = await resolveUserContext();
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getCustomersOverview();

  return (
    <CustomersPageClient
      initialCustomers={res.customers || []}
      branchName={branchName}
    />
  );
}
