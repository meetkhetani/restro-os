import { getBranchesCatalog } from "@/domain/branches/actions";
import { BranchesPageClient } from "@/components/branches/BranchesPageClient";

export default async function BranchesPage() {
  const res = await getBranchesCatalog();

  return (
    <BranchesPageClient
      initialBranches={res.branches || []}
      maxBranches={res.maxBranches || 1}
      allowedToCreate={res.allowedToCreate || false}
      isMultiBranch={res.isMultiBranch || false}
      selectedBranchId={res.selectedBranchId || ""}
    />
  );
}
