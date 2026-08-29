import { OrgBranchProvider } from "@/components/context/OrgBranchProvider";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { resolveUserContext } from "@/domain/context/service";

export default async function DashboardPage() {
  const context = await resolveUserContext();

  return (
    <OrgBranchProvider
      initialOrg={context.org}
      initialBranch={context.selectedBranch}
      initialBranches={context.branches}
      initialPlan={context.plan}
      initialIsMultiBranchEntitled={context.isMultiBranchEntitled}
    >
      <DashboardView />
    </OrgBranchProvider>
  );
}
