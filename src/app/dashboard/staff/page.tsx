import { resolveUserContext } from "@/domain/context/service";
import { getStaffOverview } from "@/domain/staff/actions";
import { StaffPageClient } from "@/components/staff/StaffPageClient";

export default async function StaffPage() {
  const context = await resolveUserContext();
  const res = await getStaffOverview();

  return (
    <StaffPageClient
      initialStaff={res.staff || []}
      availableBranches={res.branches || []}
    />
  );
}
