"use client";

import * as React from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Search,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  Paperclip,
  ArrowUpRight,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  ExpenseRecord,
  ExpenseCategory,
  createExpense,
  deleteExpense,
} from "@/domain/finance/actions";

interface ExpensesCatalogClientProps {
  initialExpenses: ExpenseRecord[];
  totalExpense: number;
  branchName: string;
  onRefresh: () => void;
}

export function ExpensesCatalogClient({
  initialExpenses = [],
  totalExpense = 0,
  branchName,
  onRefresh,
}: ExpensesCatalogClientProps) {
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  // Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);

  // Form Inputs
  const [expCategory, setExpCategory] = React.useState<ExpenseCategory>("Utilities");
  const [expAmount, setExpAmount] = React.useState(50.0);
  const [expDate, setExpDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [expVendor, setExpVendor] = React.useState("");
  const [expNotes, setExpNotes] = React.useState("");
  const [expAttachmentUrl, setExpAttachmentUrl] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) return;

    setIsSubmitting(true);
    const res = await createExpense({
      category: expCategory,
      amount: expAmount,
      expense_date: expDate,
      vendor: expVendor,
      notes: expNotes,
      attachment_url: expAttachmentUrl,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Expense Logged", description: `$${expAmount.toFixed(2)} logged under ${expCategory}.` });
      setExpVendor("");
      setExpNotes("");
      setExpAttachmentUrl("");
      setIsAddExpenseOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Failed to log expense", description: res.error });
    }
  };

  const handleDeleteExpense = async (id: string, cat: string, amt: number) => {
    if (!confirm(`Delete expense of $${amt.toFixed(2)} (${cat})?`)) return;
    const res = await deleteExpense(id);
    if (res.success) {
      addToast({ type: "success", title: "Expense Deleted" });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Delete Failed", description: res.error });
    }
  };

  // Filter Expenses
  const filteredExpenses = React.useMemo(() => {
    return initialExpenses.filter((e) => {
      const matchesSearch =
        e.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [initialExpenses, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-brand-500" />
            Store Expenses & Petty Cash
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              {branchName}
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Track operational costs, utility bills, inventory purchases, and daily payouts.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddExpenseOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Log New Expense
        </Button>
      </div>

      {/* Expense Summary KPI Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-5 flex items-center justify-between shadow-md">
        <div className="space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Branch Expenses</span>
          <h2 className="text-3xl font-black">${totalExpense.toFixed(2)}</h2>
        </div>
        <div className="h-12 w-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
          <TrendingDown className="h-6 w-6" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search vendor or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Supplies">Supplies</option>
            <option value="Payroll">Payroll</option>
            <option value="Marketing">Marketing</option>
            <option value="Repairs">Repairs</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
          <Receipt className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No expenses recorded for this branch.</p>
          <p className="text-xs text-gray-500">Click &quot;Log New Expense&quot; to log a store payout or utility bill.</p>
        </div>
      ) : (
        <Card className="overflow-hidden border shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Vendor / Payee</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 font-medium">
                  <td className="p-3 text-gray-500 font-mono">{exp.expense_date}</td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-gray-900">{exp.vendor || "-"}</td>
                  <td className="p-3 font-extrabold text-red-600">${Number(exp.amount).toFixed(2)}</td>
                  <td className="p-3 text-gray-600 italic">{exp.notes || "-"}</td>
                  <td className="p-3 text-right space-x-2">
                    {exp.attachment_url && (
                      <a
                        href={exp.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-brand-600 font-bold hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5 mr-0.5" /> Receipt
                      </a>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteExpense(exp.id, exp.category, Number(exp.amount))}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* MODAL: LOG EXPENSE */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateExpense} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Log Store Expense</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Category *</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none bg-white font-medium"
              >
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Supplies">Supplies</option>
                <option value="Payroll">Payroll</option>
                <option value="Marketing">Marketing</option>
                <option value="Repairs">Repairs</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Amount ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Date *</label>
                <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vendor / Payee</label>
              <Input value={expVendor} onChange={(e) => setExpVendor(e.target.value)} placeholder="e.g. City Power & Electric" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
              <Input value={expNotes} onChange={(e) => setExpNotes(e.target.value)} placeholder="Monthly electricity bill..." />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Receipt Attachment URL</label>
              <Input value={expAttachmentUrl} onChange={(e) => setExpAttachmentUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">Save Expense</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
