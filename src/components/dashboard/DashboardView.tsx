"use client";

import * as React from "react";
import {
  Building2,
  Store,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useOrgBranch } from "@/components/context/OrgBranchProvider";
import { KpiCardGrid } from "./KpiCardGrid";
import { SalesTrendSection } from "./SalesTrendSection";
import { TopProductsSection } from "./TopProductsSection";
import { RecentOrdersSection } from "./RecentOrdersSection";
import { LowStockAlerts } from "./LowStockAlerts";
import { KitchenStatusWidget } from "./KitchenStatusWidget";
import { ExpensesBreakdown } from "./ExpensesBreakdown";
import { AiInsightsCopilot } from "./AiInsightsCopilot";
import { BranchComparisonView } from "./BranchComparisonView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader, Skeleton } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getDashboardKPIs,
  getSalesTrends,
  getTopProducts,
  getRecentOrders,
  getLowStockAlerts,
  getKitchenStatusSummary,
  getExpensesSummary,
  getAiInsights,
  getBranchComparisonLeaderboard,
} from "@/domain/dashboard/actions";
import {
  DashboardKPIs,
  SalesTrendPoint,
  TopProductItem,
  RecentOrderRecord,
  LowStockAlertItem,
  KitchenStatusSummary,
  ExpenseCategorySummary,
  AiInsightItem,
  BranchComparisonItem,
} from "@/domain/dashboard/types";

export function DashboardView() {
  const {
    currentOrg,
    currentBranch,
    availableBranches,
    setBranch,
    isMultiBranchEntitled,
    plan,
  } = useOrgBranch();

  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const [kpis, setKpis] = React.useState<DashboardKPIs | null>(null);
  const [trends, setTrends] = React.useState<SalesTrendPoint[]>([]);
  const [products, setProducts] = React.useState<TopProductItem[]>([]);
  const [orders, setOrders] = React.useState<RecentOrderRecord[]>([]);
  const [alerts, setAlerts] = React.useState<LowStockAlertItem[]>([]);
  const [kitchenStatus, setKitchenStatus] = React.useState<KitchenStatusSummary | null>(null);
  const [expenses, setExpenses] = React.useState<ExpenseCategorySummary[]>([]);
  const [insights, setInsights] = React.useState<AiInsightItem[]>([]);
  const [comparison, setComparison] = React.useState<{ entitled: boolean; branches: BranchComparisonItem[] }>({
    entitled: false,
    branches: [],
  });

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const orgId = currentOrg?.id || "demo-org-1";
      const branchId = currentBranch?.id || "all";

      const [
        kpiData,
        trendData,
        productData,
        orderData,
        alertData,
        kdsData,
        expenseData,
        aiData,
        compData,
      ] = await Promise.all([
        getDashboardKPIs(orgId, branchId),
        getSalesTrends(orgId, branchId),
        getTopProducts(orgId, branchId),
        getRecentOrders(orgId, branchId),
        getLowStockAlerts(orgId, branchId),
        getKitchenStatusSummary(orgId, branchId),
        getExpensesSummary(orgId, branchId),
        getAiInsights(orgId, branchId),
        getBranchComparisonLeaderboard(orgId),
      ]);

      setKpis(kpiData);
      setTrends(trendData);
      setProducts(productData);
      setOrders(orderData);
      setAlerts(alertData);
      setKitchenStatus(kdsData);
      setExpenses(expenseData);
      setInsights(aiData);
      setComparison(compData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, currentBranch?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (hasError) {
    return (
      <ErrorState
        title="Failed to Load Dashboard Context"
        message="An unexpected network error occurred while querying Supabase data for the selected branch context."
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Context Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-restro-200 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-restro-900 tracking-tight">
              Operational Control Center
            </h1>
            <Badge variant={isMultiBranchEntitled ? "brand" : "default"}>
              {isMultiBranchEntitled ? "Multi-Branch Plan" : "Standard Plan"}
            </Badge>
          </div>
          <p className="text-xs text-restro-500 mt-1">
            Scoped Context: <span className="font-semibold text-restro-800">{currentOrg?.name}</span> •{" "}
            <span className="font-semibold text-brand-600">{currentBranch?.name}</span>
          </p>
        </div>

        {/* Branch Context Switcher Widget */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-restro-400 mb-1">
              Active Store Context
            </label>
            <select
              className="h-9 w-60 rounded-md border border-restro-300 bg-surface px-3 text-xs font-semibold text-restro-900 shadow-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={currentBranch?.id}
              onChange={(e) => setBranch(e.target.value)}
            >
              {availableBranches.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                  disabled={b.isAll && !isMultiBranchEntitled}
                >
                  {b.name} {b.isAll && !isMultiBranchEntitled ? " (Upgrade Required)" : ""}
                </option>
              ))}
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={loadData} className="mt-4">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isLoading || !kpis || !kitchenStatus ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <>
          {/* Section 1: KPI Metrics Grid */}
          <KpiCardGrid kpis={kpis} />

          {/* Section 2: 2-Column Operational Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <SalesTrendSection trends={trends} />
              <RecentOrdersSection orders={orders} />
              <BranchComparisonView
                entitled={comparison.entitled}
                branches={comparison.branches}
              />
            </div>

            {/* Right Column (1/3 width) */}
            <div className="space-y-6">
              <AiInsightsCopilot insights={insights} />
              <KitchenStatusWidget status={kitchenStatus} />
              <LowStockAlerts alerts={alerts} />
              <TopProductsSection products={products} />
              <ExpensesBreakdown expenses={expenses} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
