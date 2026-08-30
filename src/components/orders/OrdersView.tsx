"use client";

import * as React from "react";
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  Utensils,
  Truck,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  OrderType,
  OrderStatus,
  OrderQueryFilters,
  PaginatedOrdersResult,
} from "@/domain/pos/types";
import { getPaginatedOrders } from "@/domain/orders/actions";
import { OrderDetailsModal } from "./OrderDetailsModal";

interface BranchOptionItem {
  id: string;
  name: string;
  isAll?: boolean;
}

interface OrdersViewProps {
  initialResult: PaginatedOrdersResult;
  branches: BranchOptionItem[];
  currentBranchId: string;
  isMultiBranchEntitled: boolean;
}

export function OrdersView({
  initialResult,
  branches,
  currentBranchId,
}: OrdersViewProps) {
  const { addToast } = useToast();

  const [result, setResult] = React.useState<PaginatedOrdersResult>(initialResult);
  const [isLoading, setIsLoading] = React.useState(false);

  // Filters State
  const [search, setSearch] = React.useState("");
  const [orderType, setOrderType] = React.useState<OrderType | "all">("all");
  const [status, setStatus] = React.useState<OrderStatus | "all">("all");
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(currentBranchId);
  const [dateRange, setDateRange] = React.useState<"today" | "yesterday" | "7days" | "30days" | "all">("today");
  const [page, setPage] = React.useState(1);

  // Details Modal State
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  // Fetch Orders with Current Filters
  const fetchOrders = React.useCallback(
    async (overridePage?: number) => {
      setIsLoading(true);
      const queryFilters: OrderQueryFilters = {
        search,
        order_type: orderType,
        status,
        branch_id: selectedBranchId,
        date_range: dateRange,
        page: overridePage ?? page,
        page_size: 10,
      };

      try {
        const res = await getPaginatedOrders(queryFilters);
        setResult(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to fetch orders.";
        addToast({
          type: "error",
          title: "Fetch Error",
          description: msg,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [search, orderType, status, selectedBranchId, dateRange, page, addToast]
  );

  // Trigger Fetch when Filters Change
  React.useEffect(() => {
    fetchOrders(1);
    setPage(1);
  }, [search, orderType, status, selectedBranchId, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Page Changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= result.total_pages) {
      setPage(newPage);
      fetchOrders(newPage);
    }
  };

  // Supabase Realtime Subscription for Instant POS -> Orders Sync
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("orders_live_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const getStatusBadge = (s: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-300",
      confirmed: "bg-blue-100 text-blue-800 border-blue-300",
      preparing: "bg-purple-100 text-purple-800 border-purple-300",
      ready: "bg-teal-100 text-teal-800 border-teal-300",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${styles[s]}`}>
        {s}
      </span>
    );
  };

  const getTypeIcon = (type: OrderType) => {
    if (type === "dine_in") return <Utensils className="h-3.5 w-3.5 text-brand-500 inline mr-1" />;
    if (type === "takeaway") return <ShoppingBag className="h-3.5 w-3.5 text-blue-500 inline mr-1" />;
    return <Truck className="h-3.5 w-3.5 text-purple-500 inline mr-1" />;
  };

  return (
    <div className="space-y-5 p-6 max-w-7xl mx-auto font-sans">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-restro-900 tracking-tight">
            Order Management
          </h1>
          <p className="text-xs font-medium text-restro-500 flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-brand-500 inline" /> Real-time multi-tenant order fulfillment & audit timeline
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Branch Filter Selector */}
          {branches.length > 0 && (
            <div className="flex items-center space-x-2 bg-surface border border-restro-200 px-3 py-1.5 rounded-lg shadow-card">
              <Building2 className="h-4 w-4 text-brand-500" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-restro-800 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => fetchOrders()} isLoading={isLoading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3.5 bg-surface border-restro-200 shadow-card">
          <div className="flex justify-between items-center text-restro-500 text-xs">
            <span>Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-brand-500" />
          </div>
          <p className="text-xl font-extrabold text-restro-900 mt-1">{result.stats.total}</p>
        </Card>

        <Card className="p-3.5 bg-surface border-restro-200 shadow-card">
          <div className="flex justify-between items-center text-amber-600 text-xs font-semibold">
            <span>Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{result.stats.pending}</p>
        </Card>

        <Card className="p-3.5 bg-surface border-restro-200 shadow-card">
          <div className="flex justify-between items-center text-purple-600 text-xs font-semibold">
            <span>In Kitchen</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-purple-700 mt-1">
            {result.stats.preparing + result.stats.ready}
          </p>
        </Card>

        <Card className="p-3.5 bg-surface border-restro-200 shadow-card">
          <div className="flex justify-between items-center text-emerald-600 text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{result.stats.completed}</p>
        </Card>

        <Card className="p-3.5 bg-surface border-restro-200 shadow-card">
          <div className="flex justify-between items-center text-restro-500 text-xs">
            <span>Total Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            ${result.stats.total_revenue.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-3.5 bg-surface border-restro-200 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-restro-400" />
            <input
              type="text"
              placeholder="Search by Order # or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-restro-200 rounded-lg text-xs font-medium placeholder-restro-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Order Type Filter */}
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType | "all")}
              className="bg-background border border-restro-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-restro-800"
            >
              <option value="all">All Order Types</option>
              <option value="dine_in">Dine-In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
              className="bg-background border border-restro-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-restro-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="bg-background border border-restro-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-restro-800"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Data Table */}
      <Card className="bg-surface border-restro-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-restro-50 border-b border-restro-200 font-bold text-restro-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Customer / Table</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-right">Date & Time</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-restro-200">
              {result.orders.map((o) => (
                <tr key={o.id} className="hover:bg-restro-50/50 transition-colors">
                  <td className="p-3 font-extrabold text-restro-900">
                    {o.order_number}
                  </td>
                  <td className="p-3 font-semibold text-restro-800 capitalize">
                    {getTypeIcon(o.order_type)}
                    {o.order_type.replace("_", " ")}
                  </td>
                  <td className="p-3">{getStatusBadge(o.status)}</td>
                  <td className="p-3">
                    <span className="font-extrabold text-restro-900 block">
                      {o.customer?.name || "Walk-in Customer"}
                    </span>
                    {o.table && (
                      <span className="text-[11px] text-restro-500 block">
                        Table {o.table.table_number} ({o.table.section})
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-extrabold text-brand-600">
                    ${o.total_amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-restro-500">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrderId(o.id)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                    </Button>
                  </td>
                </tr>
              ))}

              {result.orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-restro-400">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-restro-300" />
                    <p className="font-semibold text-xs">No orders found matching the filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {result.total_pages > 1 && (
          <div className="p-3.5 border-t border-restro-200 bg-restro-50/50 flex items-center justify-between text-xs">
            <span className="text-restro-600 font-medium">
              Showing Page <span className="font-bold text-restro-900">{result.page}</span> of{" "}
              <span className="font-bold text-restro-900">{result.total_pages}</span> ({result.total_count} total orders)
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={result.page <= 1 || isLoading}
                onClick={() => handlePageChange(result.page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={result.page >= result.total_pages || isLoading}
                onClick={() => handlePageChange(result.page + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Details Drawer Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRefresh={() => fetchOrders()}
        />
      )}
    </div>
  );
}
