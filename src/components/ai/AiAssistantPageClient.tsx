"use client";

import * as React from "react";
import { AiAssistantClient } from "./AiAssistantClient";

interface AiAssistantPageClientProps {
  currentBranchId: string;
  branchName: string;
  isMultiBranch: boolean;
}

export function AiAssistantPageClient({
  currentBranchId,
  branchName,
  isMultiBranch,
}: AiAssistantPageClientProps) {
  return (
    <AiAssistantClient
      currentBranchId={currentBranchId}
      branchName={branchName}
      isMultiBranch={isMultiBranch}
    />
  );
}
