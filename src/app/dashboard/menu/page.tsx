import { resolveUserContext } from "@/domain/context/service";
import { getMenuCatalog } from "@/domain/menu/actions";
import { MenuPageClient } from "@/components/menu/MenuPageClient";

export default async function MenuPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";

  const res = await getMenuCatalog(branchId);

  return (
    <MenuPageClient
      initialCategories={res.categories || []}
      initialItems={res.items || []}
      initialModifierGroups={res.modifierGroups || []}
      currentBranchId={branchId}
      branchName={branchName}
    />
  );
}
