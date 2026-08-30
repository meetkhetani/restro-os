import { resolveUserContext } from "@/domain/context/service";
import { AiAssistantPageClient } from "@/components/ai/AiAssistantPageClient";

export default async function AIPage() {
  const context = await resolveUserContext();
  const branchId = context.selectedBranch?.id || "";
  const branchName = context.selectedBranch?.name || "Main Branch";
  const isMultiBranch = context.plan?.code === "multi_branch" || (context.plan?.max_branches || 1) > 1;

  return (
    <AiAssistantPageClient
      currentBranchId={branchId}
      branchName={branchName}
      isMultiBranch={isMultiBranch}
    />
  );
}
