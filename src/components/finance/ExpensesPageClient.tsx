"use client";

import * as React from "react";
import { ExpenseRecord, getExpensesOverview } from "@/domain/finance/actions";
import { ExpensesCatalogClient } from "./ExpensesCatalogClient";

interface ExpensesPageClientProps {
  initialExpenses: ExpenseRecord[];
  totalExpense: number;
  branchName: string;
  branchId: string;
}

export function ExpensesPageClient({
  initialExpenses = [],
  totalExpense = 0,
  branchName,
  branchId,
}: ExpensesPageClientProps) {
  const [expenses, setExpenses] = React.useState<ExpenseRecord[]>(initialExpenses);
  const [total, setTotal] = React.useState<number>(totalExpense);

  const fetchLatestExpenses = async () => {
    const res = await getExpensesOverview(branchId);
    if (res.success) {
      setExpenses(res.expenses || []);
      setTotal(res.totalExpense || 0);
    }
  };

  return (
    <ExpensesCatalogClient
      initialExpenses={expenses}
      totalExpense={total}
      branchName={branchName}
      onRefresh={fetchLatestExpenses}
    />
  );
}
