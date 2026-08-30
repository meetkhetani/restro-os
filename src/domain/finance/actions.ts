"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";

export type ExpenseCategory = "Rent" | "Utilities" | "Supplies" | "Payroll" | "Marketing" | "Repairs" | "Other";
export type PaymentMethod = "cash" | "card" | "upi" | "other";

export interface ExpenseRecord {
  id: string;
  org_id: string;
  branch_id: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  vendor?: string;
  notes?: string;
  attachment_url?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  org_id: string;
  branch_id?: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: "pending" | "completed" | "failed" | "refunded";
  transaction_reference?: string;
  created_at: string;
  order_number?: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  expense_date?: string;
  vendor?: string;
  notes?: string;
  attachment_url?: string;
}

export interface RecordPaymentInput {
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
}

/**
 * Server Action: Fetch Branch Expenses Overview & Category Totals
 */
export async function getExpensesOverview(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Authenticated branch context required.",
        expenses: [],
        totalExpense: 0,
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const branchId = branchIdParam && branchIdParam !== "all" ? branchIdParam : context.selectedBranch.id;

    const { data: expensesData, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("org_id", orgId)
      .eq("branch_id", branchId)
      .order("expense_date", { ascending: false });

    if (error) return { success: false, error: error.message, expenses: [], totalExpense: 0 };

    const expenses = (expensesData || []) as ExpenseRecord[];
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      success: true,
      expenses,
      totalExpense,
      branch: context.selectedBranch,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load expenses.";
    return { success: false, error: msg, expenses: [], totalExpense: 0 };
  }
}

/**
 * Server Action: Create New Branch Expense Entry
 */
export async function createExpense(input: CreateExpenseInput) {
  try {
    const context = await resolveUserContext();
    if (!context.org || !context.selectedBranch) {
      return { success: false, error: "Active branch context required." };
    }

    const supabase = await createClient();

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        org_id: context.org.id,
        branch_id: context.selectedBranch.id,
        category: input.category,
        amount: input.amount,
        expense_date: input.expense_date || new Date().toISOString().split("T")[0],
        vendor: input.vendor?.trim() || null,
        notes: input.notes?.trim() || null,
        attachment_url: input.attachment_url?.trim() || null,
        created_by: context.user?.id || null,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, expense };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to log expense." };
  }
}

/**
 * Server Action: Delete Expense Entry
 */
export async function deleteExpense(expenseId: string) {
  try {
    const context = await resolveUserContext();
    if (!context.org) return { success: false, error: "Organization context required." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("org_id", context.org.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete expense." };
  }
}

/**
 * Server Action: Fetch Payments & Settlement Breakdown
 */
export async function getPaymentsOverview(branchIdParam?: string) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Authenticated branch context required.",
        payments: [],
        totals: { total: 0, cash: 0, card: 0, upi: 0, other: 0 },
      };
    }

    const supabase = await createClient();
    const orgId = context.org.id;
    const branchId = branchIdParam && branchIdParam !== "all" ? branchIdParam : context.selectedBranch.id;

    const { data: paymentsData, error } = await supabase
      .from("payments")
      .select("*, order:orders(order_number)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return { success: false, error: error.message, payments: [], totals: { total: 0, cash: 0, card: 0, upi: 0, other: 0 } };

    const rawPayments = paymentsData || [];
    const totals = { total: 0, cash: 0, card: 0, upi: 0, other: 0 };

    const payments: PaymentTransaction[] = rawPayments.map((p) => {
      const amt = Number(p.amount);
      totals.total += amt;
      const method = (p.payment_method || "cash").toLowerCase();

      if (method === "cash") totals.cash += amt;
      else if (method === "card") totals.card += amt;
      else if (method === "upi") totals.upi += amt;
      else totals.other += amt;

      return {
        ...p,
        amount: amt,
        payment_method: method as PaymentMethod,
        order_number: p.order?.order_number || "Direct Order",
      };
    });

    return {
      success: true,
      payments,
      totals,
      branch: context.selectedBranch,
      organization: context.org,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load payments.";
    return {
      success: false,
      error: msg,
      payments: [],
      totals: { total: 0, cash: 0, card: 0, upi: 0, other: 0 },
    };
  }
}
