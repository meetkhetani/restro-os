import { resolveUserContext } from "@/domain/context/service";
import { getTablesAndFloorData } from "@/domain/tables/actions";
import { TablesPageClient } from "@/components/tables/TablesPageClient";

export default async function TablesPage() {
  const context = await resolveUserContext();
  const initialData = await getTablesAndFloorData();

  const currentBranchId = context.selectedBranch?.id || "all";
  const branches = context.branches.map((b) => ({
    id: b.id,
    name: b.name,
    isAll: b.isAll,
  }));

  return (
    <TablesPageClient
      initialTables={initialData.tables}
      initialReservations={initialData.reservations}
      initialFloorAreas={initialData.floorAreas}
      initialStats={initialData.stats}
      branches={branches}
      currentBranchId={currentBranchId}
    />
  );
}
