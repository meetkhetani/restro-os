import * as React from "react";
import { Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ExpenseCategorySummary } from "@/domain/dashboard/types";
import { formatCurrency } from "@/lib/utils";

export function ExpensesBreakdown({ expenses }: { expenses: ExpenseCategorySummary[] }) {
  return (
    <Card className="bg-surface border-restro-200 shadow-subtle">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold flex items-center">
          <Receipt className="h-4 w-4 text-brand-600 mr-2" />
          Operating Expenses Breakdown
        </CardTitle>
        <CardDescription>
          Daily operational cost distribution
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {expenses.map((exp) => (
          <div key={exp.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-restro-800">{exp.category}</span>
              <span className="font-extrabold text-restro-900">{formatCurrency(exp.amount, "INR")}</span>
            </div>
            <div className="h-1.5 w-full bg-restro-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${exp.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
