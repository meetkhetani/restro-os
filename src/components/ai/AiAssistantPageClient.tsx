"use client";

import * as React from "react";
import { AiInsightRecord } from "@/domain/ai/insights";
import { AiAssistantClient } from "./AiAssistantClient";

interface AiAssistantPageClientProps {
  initialInsights: AiInsightRecord[];
  currentBranchId: string;
  branchName: string;
  isMultiBranch: boolean;
}

export function AiAssistantPageClient({
  initialInsights = [],
  currentBranchId,
  branchName,
  isMultiBranch,
}: AiAssistantPageClientProps) {
  return (
    <AiAssistantClient
      initialInsights={initialInsights}
      currentBranchId={currentBranchId}
      branchName={branchName}
      isMultiBranch={isMultiBranch}
    />
  );
}
