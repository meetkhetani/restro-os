import * as React from "react";
import { DollarSign, ShoppingBag, TrendingUp, Users, PieChart, Percent } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardKPIs } from "@/domain/dashboard/types";
import { formatCurrency } from "@/lib/utils";

export function KpiCardGrid({ kpis }: { kpis: DashboardKPIs }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Revenue */}
      <Card className="bg-surface shadow-subtle border-restro-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-restro-500">
            Total Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-brand-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-extrabold text-restro-900">
            {formatCurrency(kpis.totalRevenue, "INR")}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            +14.2% vs yesterday
          </p>
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="bg-surface shadow-subtle border-restro-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-restro-500">
            Total Orders
          </CardTitle>
          <ShoppingBag className="h-4 w-4 text-restro-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-extrabold text-restro-900">
            {kpis.totalOrders}
          </div>
          <p className="text-[10px] text-restro-500 mt-0.5">
            18 active tickets
          </p>
        </CardContent>
      </Card>

      {/* Average Order Value (AOV) */}
      <Card className="bg-surface shadow-subtle border-restro-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-restro-500">
            Avg Order Value
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-extrabold text-restro-900">
            {formatCurrency(kpis.averageOrderValue, "INR")}
          </div>
          <p className="text-[10px] text-restro-500 mt-0.5">
            Per ticket average
          </p>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card className="bg-surface shadow-subtle border-restro-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-restro-500">
            Estimated Profit
          </CardTitle>
          <PieChart className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-extrabold text-emerald-700">
            {formatCurrency(kpis.estimatedProfit, "INR")}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            ~35% Net Margin
          </p>
        </CardContent>
      </Card>

      {/* Active Customers */}
      <Card className="bg-surface shadow-subtle border-restro-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-restro-500">
            Active Guests
          </CardTitle>
          <Users className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-extrabold text-restro-900">
            {kpis.activeCustomers}
          </div>
          <p className="text-[10px] text-restro-500 mt-0.5">
            Dine-in & Delivery
          </p>
        </CardContent>
      </Card>

      {/* Table Occupancy Rate */}
      <Card className="bg-surface shadow-subtle border-restro-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-restro-500">
            Table Occupancy
          </CardTitle>
          <Percent className="h-4 w-4 text-brand-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-extrabold text-restro-900">
            {kpis.tableOccupancyRate}%
          </div>
          <div className="mt-1 h-1.5 w-full bg-restro-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${kpis.tableOccupancyRate}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
