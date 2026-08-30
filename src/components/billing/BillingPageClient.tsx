"use client";

import * as React from "react";
import { BillingOverviewData, getBillingOverview } from "@/domain/billing/actions";
import { BillingPortalClient } from "./BillingPortalClient";

interface BillingPageClientProps {
  initialOverview: BillingOverviewData | null;
}

export function BillingPageClient({ initialOverview }: BillingPageClientProps) {
  const [overview, setOverview] = React.useState<BillingOverviewData | null>(initialOverview);

  const fetchLatestBilling = async () => {
    const res = await getBillingOverview();
    if (res.success && res.overview) {
      setOverview(res.overview);
    }
  };

  return (
    <BillingPortalClient
      initialOverview={overview}
      onRefresh={fetchLatestBilling}
    />
  );
}
