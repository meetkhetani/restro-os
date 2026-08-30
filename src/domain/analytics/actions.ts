"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";

export interface BranchPerformanceSummary {
  branch_id: string;
  branch_name: string;
  gross_revenue: number;
  total_orders: number;
  total_expenses: number;
  net_profit: number;
  rank: number;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  upi: number;
  other: number;
  total: number;
}

export interface TopProductSummary {
  menu_item_id: string;
  item_name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface AnalyticsData {
  grossRevenue: number;
  totalOrders: number;
  completedOrders: number;
  totalExpenses: number;
  netProfit: number;
  customerCount: number;
  paymentBreakdown: PaymentBreakdown;
  topProducts: TopProductSummary[];
  branchComparisons: BranchPerformanceSummary[];
  isMultiBranchEntitled: boolean;
}

/**
 * Server Action: Fetch Comprehensive SaaS Analytics & Multi-Branch Aggregations
 */
export async function getAnalyticsOverview(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org) {
      return {
        success: false,
        error: "Authenticated context required.",
        analytics: null,
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const isMultiBranch = context.plan?.code === "multi_branch" || (context.plan?.max_branches || 1) > 1;
    const branchId = branchIdParam && branchIdParam !== "all" ? branchIdParam : context.selectedBranch?.id || "";

    // Parallel fetch for Orders, Expenses, Payments, Order Items, Customers, and Branches
    const [ordersRes, expensesRes, paymentsRes, orderItemsRes, customersRes, branchesRes] = await Promise.all([
      supabase.from("orders").select("id, branch_id, total_amount, status, created_at").eq("org_id", orgId),
      supabase.from("expenses").select("id, branch_id, category, amount, created_at").eq("org_id", orgId),
      supabase.from("payments").select("id, branch_id, amount, payment_method, status").eq("org_id", orgId),
      supabase.from("order_items").select("item_name, quantity, total_price, order_id"),
      supabase.from("customers").select("id").eq("org_id", orgId),
      supabase.from("branches").select("id, name").eq("org_id", orgId),
    ]);

    const allOrders = ordersRes.data || [];
    const allExpenses = expensesRes.data || [];
    const allPayments = paymentsRes.data || [];
    const allOrderItems = orderItemsRes.data || [];
    const allCustomers = customersRes.data || [];
    const branches = branchesRes.data || [];

    // Filter by branch if user is in Standard mode or filtered to specific branch
    const targetOrders = branchId && !isMultiBranch ? allOrders.filter((o) => o.branch_id === branchId) : allOrders;
    const targetExpenses = branchId && !isMultiBranch ? allExpenses.filter((e) => e.branch_id === branchId) : allExpenses;
    const targetPayments = branchId && !isMultiBranch ? allPayments.filter((p) => p.branch_id === branchId) : allPayments;

    // 1. Core Financial Totals
    const grossRevenue = targetOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const totalOrders = targetOrders.length;
    const completedOrders = targetOrders.filter((o) => o.status === "completed").length;

    const totalExpenses = targetExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = grossRevenue - totalExpenses;

    // 2. Payment Method Breakdown
    const paymentBreakdown: PaymentBreakdown = { cash: 0, card: 0, upi: 0, other: 0, total: 0 };
    targetPayments.forEach((p) => {
      const amt = Number(p.amount || 0);
      paymentBreakdown.total += amt;
      const method = (p.payment_method || "cash").toLowerCase();
      if (method === "cash") paymentBreakdown.cash += amt;
      else if (method === "card") paymentBreakdown.card += amt;
      else if (method === "upi") paymentBreakdown.upi += amt;
      else paymentBreakdown.other += amt;
    });

    // 3. Top Selling Products
    const productMap = new Map<string, { item_name: string; quantity: number; revenue: number }>();
    allOrderItems.forEach((item) => {
      const name = item.item_name || "Unknown Dish";
      const existing = productMap.get(name) || { item_name: name, quantity: 0, revenue: 0 };
      existing.quantity += Number(item.quantity || 1);
      existing.revenue += Number(item.total_price || 0);
      productMap.set(name, existing);
    });

    const topProducts: TopProductSummary[] = Array.from(productMap.entries())
      .map(([name, data]) => ({
        menu_item_id: name,
        item_name: name,
        quantity_sold: data.quantity,
        total_revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);

    // 4. Cross-Branch Performance Comparison & Rankings (Multi-Branch Plan Feature)
    const branchComparisons: BranchPerformanceSummary[] = branches
      .map((b) => {
        const bOrders = allOrders.filter((o) => o.branch_id === b.id && o.status !== "cancelled");
        const bExpenses = allExpenses.filter((e) => e.branch_id === b.id);
        const bRev = bOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const bExp = bExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        return {
          branch_id: b.id,
          branch_name: b.name,
          gross_revenue: bRev,
          total_orders: bOrders.length,
          total_expenses: bExp,
          net_profit: bRev - bExp,
          rank: 0,
        };
      })
      .sort((a, b) => b.gross_revenue - a.gross_revenue)
      .map((b, idx) => ({ ...b, rank: idx + 1 }));

    const analytics: AnalyticsData = {
      grossRevenue,
      totalOrders,
      completedOrders,
      totalExpenses,
      netProfit,
      customerCount: allCustomers.length,
      paymentBreakdown,
      topProducts,
      branchComparisons,
      isMultiBranchEntitled: isMultiBranch,
    };

    return {
      success: true,
      analytics,
      branch: context.selectedBranch,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load analytics.";
    return {
      success: false,
      error: msg,
      analytics: null,
    };
  }
}
