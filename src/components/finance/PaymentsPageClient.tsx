"use client";

import * as React from "react";
import { PaymentTransaction, getPaymentsOverview } from "@/domain/finance/actions";
import { PaymentsCatalogClient } from "./PaymentsCatalogClient";

interface PaymentsPageClientProps {
  initialPayments: PaymentTransaction[];
  totals: { total: number; cash: number; card: number; upi: number; other: number };
  branchName: string;
}

export function PaymentsPageClient({
  initialPayments = [],
  totals = { total: 0, cash: 0, card: 0, upi: 0, other: 0 },
  branchName,
}: PaymentsPageClientProps) {
  return (
    <PaymentsCatalogClient
      initialPayments={initialPayments}
      totals={totals}
      branchName={branchName}
    />
  );
}
