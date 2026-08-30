"use client";

import * as React from "react";
import { AnalyticsData, getAnalyticsOverview } from "@/domain/analytics/actions";
import { AnalyticsViewClient } from "./AnalyticsViewClient";

interface AnalyticsPageClientProps {
  initialAnalytics: AnalyticsData | null;
  branchName: string;
}

export function AnalyticsPageClient({
  initialAnalytics,
  branchName,
}: AnalyticsPageClientProps) {
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(initialAnalytics);

  return (
    <AnalyticsViewClient
      analytics={analytics}
      branchName={branchName}
    />
  );
}
