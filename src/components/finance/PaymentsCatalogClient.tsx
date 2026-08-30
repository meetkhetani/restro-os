"use client";

import * as React from "react";
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  QrCode,
  Banknote,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentTransaction } from "@/domain/finance/actions";

interface PaymentsCatalogClientProps {
  initialPayments: PaymentTransaction[];
  totals: { total: number; cash: number; card: number; upi: number; other: number };
  branchName: string;
}

export function PaymentsCatalogClient({
  initialPayments = [],
  totals = { total: 0, cash: 0, card: 0, upi: 0, other: 0 },
  branchName,
}: PaymentsCatalogClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [methodFilter, setMethodFilter] = React.useState<string>("all");

  const filteredPayments = React.useMemo(() => {
    return initialPayments.filter((p) => {
      const matchesSearch =
        p.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMethod = methodFilter === "all" || p.payment_method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [initialPayments, searchQuery, methodFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-brand-500" />
            Payment Settlements & Reconciliations
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              {branchName}
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Real-time settlement tracking across Cash, Card, UPI, and Digital Wallet gateways.
          </p>
        </div>
      </div>

      {/* Payment Settlement Method KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Total Revenue
          </span>
          <h2 className="text-2xl font-black text-gray-900">${totals.total.toFixed(2)}</h2>
        </Card>

        <Card className="p-4 border border-emerald-200 bg-emerald-50/50 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5 text-emerald-600" /> Cash Settlements
          </span>
          <h2 className="text-2xl font-black text-emerald-900">${totals.cash.toFixed(2)}</h2>
        </Card>

        <Card className="p-4 border border-blue-200 bg-blue-50/50 shadow-sm space-y-1">
          <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Card Payments
          </span>
          <h2 className="text-2xl font-black text-blue-900">${totals.card.toFixed(2)}</h2>
        </Card>

        <Card className="p-4 border border-purple-200 bg-purple-50/50 shadow-sm space-y-1">
          <span className="text-xs font-bold text-purple-700 uppercase flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5 text-purple-600" /> UPI Transactions
          </span>
          <h2 className="text-2xl font-black text-purple-900">${totals.upi.toFixed(2)}</h2>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search order number or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500">Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash 💵</option>
            <option value="card">Card 💳</option>
            <option value="upi">UPI 📱</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden border shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Order Number</th>
              <th className="p-3">Payment Method</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Transaction Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 font-medium">
                <td className="p-3 text-gray-500 font-mono">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td className="p-3 font-bold text-gray-900">{p.order_number}</td>
                <td className="p-3">
                  <span className="bg-gray-100 text-gray-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                    {p.payment_method}
                  </span>
                </td>
                <td className="p-3 font-black text-emerald-700">${p.amount.toFixed(2)}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {p.status}
                  </span>
                </td>
                <td className="p-3 font-mono text-gray-500">{p.transaction_reference || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
