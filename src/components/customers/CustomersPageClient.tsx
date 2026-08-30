"use client";

import * as React from "react";
import { CustomerProfile, getCustomersOverview } from "@/domain/customers/actions";
import { CustomersCatalogClient } from "./CustomersCatalogClient";

interface CustomersPageClientProps {
  initialCustomers: CustomerProfile[];
  branchName: string;
}

export function CustomersPageClient({
  initialCustomers = [],
  branchName,
}: CustomersPageClientProps) {
  const [customers, setCustomers] = React.useState<CustomerProfile[]>(initialCustomers);

  const fetchLatestCustomers = async () => {
    const res = await getCustomersOverview();
    if (res.success) {
      setCustomers(res.customers || []);
    }
  };

  return (
    <CustomersCatalogClient
      initialCustomers={customers}
      branchName={branchName}
      onRefresh={fetchLatestCustomers}
    />
  );
}
