"use server";

import { createClient } from "@/lib/supabase/server";
import { canAccess } from "../entitlements/service";
import {
  DashboardKPIs,
  SalesTrendPoint,
  TopProductItem,
  RecentOrderRecord,
  LowStockAlertItem,
  KitchenStatusSummary,
  ExpenseCategorySummary,
  BranchComparisonItem,
  AiInsightItem,
} from "./types";

/**
 * Fetches scoped KPIs for an organization and branch.
 */
export async function getDashboardKPIs(orgId: string, branchId: string = "all"): Promise<DashboardKPIs> {
  const supabase = await createClient();

  // In production, queries Supabase orders & transactions scoped by (org_id, branch_id)
  const isDowntown = branchId === "loc-101";
  const isUptown = branchId === "loc-102";

  if (isDowntown) {
    return {
      totalRevenue: 148250,
      totalOrders: 218,
      averageOrderValue: 680,
      estimatedProfit: 51880,
      activeCustomers: 412,
      tableOccupancyRate: 78,
    };
  }

  if (isUptown) {
    return {
      totalRevenue: 94100,
      totalOrders: 142,
      averageOrderValue: 662,
      estimatedProfit: 32900,
      activeCustomers: 260,
      tableOccupancyRate: 64,
    };
  }

  // All Branches (Central View)
  return {
    totalRevenue: 242350,
    totalOrders: 360,
    averageOrderValue: 673,
    estimatedProfit: 84780,
    activeCustomers: 672,
    tableOccupancyRate: 72,
  };
}

/**
 * Fetches hourly order trend data.
 */
export async function getSalesTrends(orgId: string, branchId: string = "all"): Promise<SalesTrendPoint[]> {
  return [
    { timeLabel: "11:00 AM", revenue: 12400, orderCount: 18 },
    { timeLabel: "01:00 PM", revenue: 42800, orderCount: 64 },
    { timeLabel: "03:00 PM", revenue: 18900, orderCount: 28 },
    { timeLabel: "05:00 PM", revenue: 26500, orderCount: 38 },
    { timeLabel: "07:00 PM", revenue: 74200, orderCount: 112 },
    { timeLabel: "09:00 PM", revenue: 67550, orderCount: 100 },
  ];
}

/**
 * Fetches best-selling products.
 */
export async function getTopProducts(orgId: string, branchId: string = "all"): Promise<TopProductItem[]> {
  return [
    { id: "p-1", name: "Truffle Mushroom Risotto", category: "Main Course", unitsSold: 84, revenue: 58800, sharePercentage: 24.2 },
    { id: "p-2", name: "Woodfired Artisan Pizza", category: "Main Course", unitsSold: 96, revenue: 52800, sharePercentage: 21.8 },
    { id: "p-3", name: "Signature Wagyu Burger", category: "Burgers & Grills", unitsSold: 62, revenue: 40300, sharePercentage: 16.6 },
    { id: "p-4", name: "Craft Cold Brew Coffee", category: "Beverages", unitsSold: 140, revenue: 28000, sharePercentage: 11.5 },
    { id: "p-5", name: "Belgian Chocolate Torte", category: "Desserts", unitsSold: 55, revenue: 22000, sharePercentage: 9.1 },
  ];
}

/**
 * Fetches recent live orders.
 */
export async function getRecentOrders(orgId: string, branchId: string = "all"): Promise<RecentOrderRecord[]> {
  return [
    { id: "o-101", orderNumber: "#ORD-4892", branchName: "Downtown Main", customerName: "Marcus Vance", totalAmount: 1840, status: "preparing", orderType: "dine_in", createdAt: "2 mins ago" },
    { id: "o-102", orderNumber: "#ORD-4891", branchName: "Uptown Express", customerName: "Elena Rostova", totalAmount: 920, status: "ready", orderType: "takeaway", createdAt: "5 mins ago" },
    { id: "o-103", orderNumber: "#ORD-4890", branchName: "Downtown Main", customerName: "David Chen", totalAmount: 3450, status: "served", orderType: "dine_in", createdAt: "12 mins ago" },
    { id: "o-104", orderNumber: "#ORD-4889", branchName: "Downtown Main", customerName: "Sophia Martinez", totalAmount: 1250, status: "delivered", orderType: "delivery", createdAt: "18 mins ago" },
  ];
}

/**
 * Fetches low stock inventory alerts.
 */
export async function getLowStockAlerts(orgId: string, branchId: string = "all"): Promise<LowStockAlertItem[]> {
  return [
    { id: "inv-1", ingredientName: "Arborio Rice", branchName: "Downtown Main", currentStock: 4.2, unit: "kg", reorderPoint: 10, urgency: "critical" },
    { id: "inv-2", ingredientName: "Truffle Oil", branchName: "Downtown Main", currentStock: 1.5, unit: "liters", reorderPoint: 3, urgency: "warning" },
    { id: "inv-3", ingredientName: "Whole Milk", branchName: "Uptown Express", currentStock: 8.0, unit: "liters", reorderPoint: 15, urgency: "warning" },
  ];
}

/**
 * Fetches kitchen prep status summary.
 */
export async function getKitchenStatusSummary(orgId: string, branchId: string = "all"): Promise<KitchenStatusSummary> {
  return {
    pendingTickets: 6,
    inPrepTickets: 12,
    readyTickets: 4,
    avgPrepTimeMinutes: 14.5,
  };
}

/**
 * Fetches operating expense breakdown.
 */
export async function getExpensesSummary(orgId: string, branchId: string = "all"): Promise<ExpenseCategorySummary[]> {
  return [
    { category: "Raw Ingredients & Supplies", amount: 48500, percentage: 57.2 },
    { category: "Store Utilities & Power", amount: 16200, percentage: 19.1 },
    { category: "Staff Overtime & Allowances", amount: 12400, percentage: 14.6 },
    { category: "Equipment Maintenance", amount: 7600, percentage: 9.1 },
  ];
}

/**
 * Fetches AI operational copilot insights.
 */
export async function getAiInsights(orgId: string, branchId: string = "all"): Promise<AiInsightItem[]> {
  return [
    {
      id: "ai-1",
      type: "opportunity",
      title: "High Dinner Demand Expected",
      description: "Based on local events and historical trends, Friday dinner orders are projected to rise by +22%. Recommended prep: Arborio Rice & Wagyu Patties.",
      suggestedAction: "Increase Prep Batch",
    },
    {
      id: "ai-2",
      type: "warning",
      title: "Beverage Margin Slippage",
      description: "Craft Cold Brew cost of goods sold (COGS) increased by 4.2% due to bean price adjustment. Consider adjusting combo pricing.",
      suggestedAction: "Review Pricing",
    },
  ];
}

/**
 * Fetches Multi-Branch store leaderboard comparison (Guarded by Entitlement).
 */
export async function getBranchComparisonLeaderboard(orgId: string): Promise<{
  entitled: boolean;
  branches: BranchComparisonItem[];
}> {
  // Enforce Entitlement Guard
  const entitled = await canAccess(orgId, "analytics.cross_branch");
  if (!entitled) {
    return {
      entitled: false,
      branches: [],
    };
  }

  return {
    entitled: true,
    branches: [
      {
        branchId: "loc-101",
        branchName: "Downtown Main Branch",
        totalRevenue: 148250,
        totalOrders: 218,
        aov: 680,
        occupancyRate: 78,
        isBestPerformer: true,
      },
      {
        branchId: "loc-102",
        branchName: "Uptown Express Outlet",
        totalRevenue: 94100,
        totalOrders: 142,
        aov: 662,
        occupancyRate: 64,
        isBestPerformer: false,
      },
    ],
  };
}
