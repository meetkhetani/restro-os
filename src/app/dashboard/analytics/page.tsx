import { resolveUserContext } from "@/domain/context/service";
import { getAnalyticsOverview } from "@/domain/analytics/actions";
import { AnalyticsPageClient } from "@/components/analytics/AnalyticsPageClient";

export default async function AnalyticsPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getAnalyticsOverview(branchId);

  return (
    <AnalyticsPageClient
      initialAnalytics={res.analytics || null}
      branchName={branchName}
    />
  );
}
