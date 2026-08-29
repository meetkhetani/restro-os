import * as React from "react";
import { BarChart2, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SalesTrendPoint } from "@/domain/dashboard/types";
import { formatCurrency } from "@/lib/utils";

export function SalesTrendSection({ trends }: { trends: SalesTrendPoint[] }) {
  const maxRevenue = Math.max(...trends.map((t) => t.revenue), 1);

  return (
    <Card className="bg-surface border-restro-200 shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center">
            <BarChart2 className="h-4 w-4 text-brand-600 mr-2" />
            Sales Trend & Hourly Volume
          </CardTitle>
          <CardDescription>
            Hourly revenue distribution for active branch context
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          <TrendingUp className="h-3.5 w-3.5 mr-1" />
          Peak Hour: 7:00 PM - 9:00 PM
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 border-b border-restro-100 pb-2">
          {trends.map((point) => {
            const heightPercent = Math.round((point.revenue / maxRevenue) * 100);
            return (
              <div key={point.timeLabel} className="flex flex-col items-center space-y-2 group">
                <span className="text-[10px] font-bold text-restro-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatCurrency(point.revenue, "INR")}
                </span>
                <div className="w-full bg-restro-100 rounded-t-md relative flex items-end justify-center h-32 overflow-hidden">
                  <div
                    className="w-full bg-brand-500 rounded-t-md group-hover:bg-brand-600 transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-restro-500 truncate">
                  {point.timeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
