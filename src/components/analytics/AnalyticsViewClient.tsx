"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Receipt,
  Users,
  CreditCard,
  QrCode,
  Banknote,
  Trophy,
  Layers,
  Utensils,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnalyticsData } from "@/domain/analytics/actions";

interface AnalyticsViewClientProps {
  analytics: AnalyticsData | null;
  branchName: string;
}

type AnalyticsTab = "revenue" | "branches" | "products";

export function AnalyticsViewClient({
  analytics,
  branchName,
}: AnalyticsViewClientProps) {
  const [activeTab, setActiveTab] = React.useState<AnalyticsTab>("revenue");

  if (!analytics) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
        <BarChart3 className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="text-sm font-bold text-gray-700">Analytics temporarily unavailable.</p>
      </div>
    );
  }

  const {
    grossRevenue,
    totalOrders,
    completedOrders,
    totalExpenses,
    netProfit,
    customerCount,
    paymentBreakdown,
    topProducts,
    branchComparisons,
    isMultiBranchEntitled,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-500" />
            Restaurant Analytics & Performance Intelligence
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              {isMultiBranchEntitled ? "Multi-Branch Consolidated" : branchName}
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Real-time database analytics: Revenue, Net Profit, Payment Settlements, Top Dishes, and Branch Performance.
          </p>
        </div>
      </div>

      {/* Top Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-gray-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-emerald-500" /> Gross Sales Revenue
          </span>
          <h2 className="text-3xl font-black text-gray-900">${grossRevenue.toFixed(2)}</h2>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center pt-1">
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Real-time order totals
          </p>
        </Card>

        <Card className="p-5 border border-emerald-200 bg-emerald-50/50 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Net Estimated Profit
          </span>
          <h2 className="text-3xl font-black text-emerald-900">${netProfit.toFixed(2)}</h2>
          <p className="text-[11px] text-emerald-700 font-semibold pt-1">
            Gross Revenue minus Store Expenses
          </p>
        </Card>

        <Card className="p-5 border border-blue-200 bg-blue-50/50 shadow-sm space-y-1">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag className="h-4 w-4 text-blue-600" /> Total Orders
          </span>
          <h2 className="text-3xl font-black text-blue-900">{totalOrders}</h2>
          <p className="text-[11px] text-blue-700 font-semibold pt-1">
            {completedOrders} orders completed cleanly
          </p>
        </Card>

        <Card className="p-5 border border-rose-200 bg-rose-50/50 shadow-sm space-y-1">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <Receipt className="h-4 w-4 text-rose-600" /> Store Expenses
          </span>
          <h2 className="text-3xl font-black text-rose-900">${totalExpenses.toFixed(2)}</h2>
          <p className="text-[11px] text-rose-700 font-semibold pt-1">
            Operational costs & payouts
          </p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "revenue"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Revenue & Payment Methods</span>
          </button>

          {isMultiBranchEntitled && (
            <button
              onClick={() => setActiveTab("branches")}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
                activeTab === "branches"
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Multi-Branch Performance & Rankings</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "products"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>Top Selling Dishes ({topProducts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REVENUE & PAYMENT METHODS */}
      {activeTab === "revenue" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Payment Gateway Settlements Split</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border bg-emerald-50/50 space-y-1">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <Banknote className="h-4 w-4 text-emerald-600" /> Cash Settlements
              </span>
              <p className="text-2xl font-black text-emerald-950">${paymentBreakdown.cash.toFixed(2)}</p>
            </Card>

            <Card className="p-4 border bg-blue-50/50 space-y-1">
              <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-blue-600" /> Card Settlements
              </span>
              <p className="text-2xl font-black text-blue-950">${paymentBreakdown.card.toFixed(2)}</p>
            </Card>

            <Card className="p-4 border bg-purple-50/50 space-y-1">
              <span className="text-xs font-bold text-purple-800 flex items-center gap-1">
                <QrCode className="h-4 w-4 text-purple-600" /> UPI Transactions
              </span>
              <p className="text-2xl font-black text-purple-950">${paymentBreakdown.upi.toFixed(2)}</p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-BRANCH RANKINGS & COMPARISONS */}
      {activeTab === "branches" && isMultiBranchEntitled && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Consolidated Branch Revenue Rankings</h3>
              <p className="text-xs text-gray-500">Cross-branch sales, order volumes, store expenses, and net profitability.</p>
            </div>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Branch Name</th>
                  <th className="p-3.5">Gross Revenue</th>
                  <th className="p-3.5">Order Volume</th>
                  <th className="p-3.5">Expenses</th>
                  <th className="p-3.5">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branchComparisons.map((b) => (
                  <tr key={b.branch_id} className="hover:bg-gray-50 font-medium">
                    <td className="p-3.5 font-bold">
                      {b.rank === 1 ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 w-fit">
                          <Trophy className="h-3 w-3 text-amber-500 fill-amber-500" /> #1 Rank
                        </span>
                      ) : (
                        <span className="text-gray-500">#{b.rank}</span>
                      )}
                    </td>
                    <td className="p-3.5 font-extrabold text-gray-900">{b.branch_name}</td>
                    <td className="p-3.5 font-extrabold text-emerald-700">${b.gross_revenue.toFixed(2)}</td>
                    <td className="p-3.5 text-gray-800">{b.total_orders} orders</td>
                    <td className="p-3.5 text-rose-600">${b.total_expenses.toFixed(2)}</td>
                    <td className="p-3.5 font-black text-gray-900">${b.net_profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 3: TOP SELLING DISHES */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <Card className="overflow-hidden border shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Dish / Menu Item</th>
                  <th className="p-3">Quantity Sold</th>
                  <th className="p-3">Total Sales Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 font-medium">
                    <td className="p-3 font-bold text-gray-500">#{idx + 1}</td>
                    <td className="p-3 font-extrabold text-gray-900">{p.item_name}</td>
                    <td className="p-3 font-bold text-brand-600">{p.quantity_sold} units</td>
                    <td className="p-3 font-black text-gray-900">${p.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
