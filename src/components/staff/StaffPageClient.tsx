"use client";

import * as React from "react";
import { StaffMember, getStaffOverview } from "@/domain/staff/actions";
import { StaffCatalogClient } from "./StaffCatalogClient";

interface StaffPageClientProps {
  initialStaff: StaffMember[];
  availableBranches: Array<{ id: string; name: string }>;
}

export function StaffPageClient({
  initialStaff = [],
  availableBranches = [],
}: StaffPageClientProps) {
  const [staff, setStaff] = React.useState<StaffMember[]>(initialStaff);

  const fetchLatestStaff = async () => {
    const res = await getStaffOverview();
    if (res.success) {
      setStaff(res.staff || []);
    }
  };

  return (
    <StaffCatalogClient
      initialStaff={staff}
      availableBranches={availableBranches}
      onRefresh={fetchLatestStaff}
    />
  );
}
