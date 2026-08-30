"use client";

import * as React from "react";
import { BranchRecord, getBranchesCatalog } from "@/domain/branches/actions";
import { BranchesCatalogClient } from "./BranchesCatalogClient";

interface BranchesPageClientProps {
  initialBranches: BranchRecord[];
  maxBranches: number;
  allowedToCreate: boolean;
  isMultiBranch: boolean;
  selectedBranchId: string;
}

export function BranchesPageClient({
  initialBranches = [],
  maxBranches = 1,
  allowedToCreate = false,
  isMultiBranch = false,
  selectedBranchId = "",
}: BranchesPageClientProps) {
  const [branches, setBranches] = React.useState<BranchRecord[]>(initialBranches);
  const [allowed, setAllowed] = React.useState<boolean>(allowedToCreate);

  const fetchLatestBranches = async () => {
    const res = await getBranchesCatalog();
    if (res.success) {
      setBranches(res.branches || []);
      setAllowed(res.allowedToCreate || false);
    }
  };

  return (
    <BranchesCatalogClient
      initialBranches={branches}
      maxBranches={maxBranches}
      allowedToCreate={allowed}
      isMultiBranch={isMultiBranch}
      selectedBranchId={selectedBranchId}
      onRefresh={fetchLatestBranches}
    />
  );
}
