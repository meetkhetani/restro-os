"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserContext } from "../context/service";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolCalls?: Array<{ toolName: string; args?: Record<string, unknown>; resultSummary?: string }>;
}

/**
 * CONTROLLED SERVER-SIDE DATA TOOLS (RESTRICTED TO USER ORGANIZATIONAL CONTEXT)
 */

async function toolGetSales(orgId: string, branchId: string) {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("total_amount, status")
    .eq("org_id", orgId)
    .eq("branch_id", branchId)
    .neq("status", "cancelled");

  const totalSales = (orders || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const count = (orders || []).length;
  const avgValue = count > 0 ? totalSales / count : 0;

  return { totalSales, orderCount: count, averageOrderValue: avgValue };
}

async function toolGetOrders(orgId: string, branchId: string) {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, status, created_at")
    .eq("org_id", orgId)
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(20);

  const completed = (orders || []).filter((o) => o.status === "completed").length;
  const preparing = (orders || []).filter((o) => o.status === "preparing" || o.status === "new").length;
  const cancelled = (orders || []).filter((o) => o.status === "cancelled").length;

  return { totalOrders: (orders || []).length, completed, preparing, cancelled, recentOrders: orders || [] };
}

async function toolGetInventory(orgId: string, branchId: string) {
  const supabase = await createClient();
  const [ingredientsRes, invRes] = await Promise.all([
    supabase.from("ingredients").select("*").eq("org_id", orgId),
    supabase.from("branch_inventory").select("*").eq("org_id", orgId).eq("branch_id", branchId),
  ]);

  const ingredients = ingredientsRes.data || [];
  const inventory = invRes.data || [];

  const lowStockItems = ingredients.filter((ing) => {
    const inv = inventory.find((i) => i.ingredient_id === ing.id);
    const qty = inv ? Number(inv.quantity_on_hand) : 0;
    return qty <= Number(ing.min_threshold || 10);
  });

  return {
    totalIngredients: ingredients.length,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.map((i) => ({ name: i.name, unit: i.unit, minThreshold: i.min_threshold })),
  };
}

async function toolGetExpenses(orgId: string, branchId: string) {
  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("org_id", orgId)
    .eq("branch_id", branchId);

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const byCategory: Record<string, number> = {};
  (expenses || []).forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
  });

  return { totalExpenses, categoryBreakdown: byCategory };
}

async function toolGetTopProducts(orgId: string) {
  const supabase = await createClient();
  const { data: items } = await supabase.from("order_items").select("item_name, quantity, total_price");

  const map = new Map<string, { name: string; quantity: number; revenue: number }>();
  (items || []).forEach((i) => {
    const name = i.item_name || "Unknown Dish";
    const existing = map.get(name) || { name, quantity: 0, revenue: 0 };
    existing.quantity += Number(i.quantity || 1);
    existing.revenue += Number(i.total_price || 0);
    map.set(name, existing);
  });

  const top = Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return { topProducts: top };
}

async function toolGetCustomerMetrics(orgId: string) {
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers").select("*").eq("org_id", orgId);
  const total = (customers || []).length;
  const vipCount = (customers || []).filter((c) => Number(c.total_spent || 0) >= 500 || Number(c.total_orders || 0) >= 5).length;

  return { totalCustomers: total, vipCount };
}

async function toolGetBranchPerformance(orgId: string, isMultiBranchEntitled: boolean) {
  if (!isMultiBranchEntitled) {
    return { authorized: false, reason: "Single-branch plan users cannot query multi-branch comparison." };
  }

  const supabase = await createClient();
  const [branchesRes, ordersRes, expensesRes] = await Promise.all([
    supabase.from("branches").select("id, name").eq("org_id", orgId),
    supabase.from("orders").select("branch_id, total_amount, status").eq("org_id", orgId).neq("status", "cancelled"),
    supabase.from("expenses").select("branch_id, amount").eq("org_id", orgId),
  ]);

  const branches = branchesRes.data || [];
  const orders = ordersRes.data || [];
  const expenses = expensesRes.data || [];

  const branchStats = branches.map((b) => {
    const bOrders = orders.filter((o) => o.branch_id === b.id);
    const bExpenses = expenses.filter((e) => e.branch_id === b.id);
    const rev = bOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const exp = bExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      branchId: b.id,
      branchName: b.name,
      revenue: rev,
      ordersCount: bOrders.length,
      expenses: exp,
      netProfit: rev - exp,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return { authorized: true, rankings: branchStats };
}

/**
 * Main AI Assistant Server Action: Process User Prompt and Execute Controlled Tools
 */
export async function processAiChatMessage(
  prompt: string,
  currentBranchIdParam?: string
) {
  try {
    const context = await resolveUserContext();
    if (!context.authenticated || !context.org || !context.selectedBranch) {
      return {
        success: false,
        error: "Authenticated organization context required for AI Copilot.",
      };
    }

    const orgId = context.org.id;
    const branchId = currentBranchIdParam || context.selectedBranch.id;
    const branchName = context.selectedBranch.name;
    const isMultiBranch = context.plan?.code === "multi_branch" || (context.plan?.max_branches || 1) > 1;

    const lowerPrompt = prompt.toLowerCase();
    const toolCalls: Array<{ toolName: string; args?: Record<string, unknown>; resultSummary?: string }> = [];

    let aiContent = "";

    // 1. Branch Comparison / Performance Intent
    if (lowerPrompt.includes("compare") || lowerPrompt.includes("best") || lowerPrompt.includes("ranking") || lowerPrompt.includes("performance")) {
      toolCalls.push({ toolName: "getBranchPerformance", args: { orgId } });
      const perfRes = await toolGetBranchPerformance(orgId, isMultiBranch);

      if (!perfRes.authorized) {
        aiContent = `⚠️ **Multi-Branch Entitlement Required**\n\nYour current organization subscription is on the **Standard Single-Branch Plan**. Cross-branch comparative analytics is restricted to Multi-Branch tier users. You are currently viewing operational analytics for **${branchName}**.`;
      } else {
        const rankings = perfRes.rankings || [];
        const topBranch = rankings[0];

        aiContent = `### 📊 Cross-Branch Performance Intelligence Report\n\nBased on real-time database aggregations across your **${rankings.length} restaurant branches**:\n\n`;

        if (topBranch) {
          aiContent += `🏆 **Top Performing Branch**: **${topBranch.branchName}** with **$${topBranch.revenue.toFixed(2)}** gross sales revenue and **${topBranch.ordersCount} completed orders**.\n\n`;
        }

        aiContent += `| Rank | Branch Name | Gross Revenue | Orders | Expenses | Net Profit |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        rankings.forEach((r, idx) => {
          aiContent += `| **#${idx + 1}** | **${r.branchName}** | $${r.revenue.toFixed(2)} | ${r.ordersCount} | $${r.expenses.toFixed(2)} | **$${r.netProfit.toFixed(2)}** |\n`;
        });

        aiContent += `\n> 💡 **Executive Insight**: Focus inventory replenishment on **${topBranch?.branchName || "top store"}** to sustain peak dining throughput.`;
      }
    }
    // 2. Inventory / Low Stock Intent
    else if (lowerPrompt.includes("inventory") || lowerPrompt.includes("stock") || lowerPrompt.includes("reorder") || lowerPrompt.includes("ingredient")) {
      toolCalls.push({ toolName: "getInventory", args: { branchId } });
      const invRes = await toolGetInventory(orgId, branchId);

      aiContent = `### 📦 Inventory & Reorder Intelligence (${branchName})\n\n`;
      aiContent += `- **Total Raw Ingredients Tracked**: ${invRes.totalIngredients}\n`;
      aiContent += `- **Items Below Reorder Threshold**: **${invRes.lowStockCount} items**\n\n`;

      if (invRes.lowStockCount > 0) {
        aiContent += `⚠️ **Low Stock Reorder Alerts**:\n`;
        invRes.lowStockItems.forEach((item) => {
          aiContent += `- **${item.name}** (Min Threshold: ${item.minThreshold} ${item.unit})\n`;
        });
        aiContent += `\n*Action Recommended*: Generate a Purchase Order in **Purchasing & Vendors** to prevent kitchen stockouts.`;
      } else {
        aiContent += `✅ **Stock Levels Optimal**: All ingredient stocks are safely above reorder threshold levels.`;
      }
    }
    // 3. Top Products / Menu Intent
    else if (lowerPrompt.includes("top") || lowerPrompt.includes("product") || lowerPrompt.includes("dish") || lowerPrompt.includes("popular") || lowerPrompt.includes("menu")) {
      toolCalls.push({ toolName: "getTopProducts", args: { orgId } });
      const prodRes = await toolGetTopProducts(orgId);

      aiContent = `### 🍕 Top Selling Dishes & Recipe Popularity\n\nHere are your highest-performing menu items by order volume:\n\n`;
      aiContent += `| Rank | Dish Name | Volume Sold | Total Revenue |\n| :--- | :--- | :--- | :--- |\n`;
      prodRes.topProducts.forEach((p, idx) => {
        aiContent += `| **#${idx + 1}** | **${p.name}** | ${p.quantity} units | **$${p.revenue.toFixed(2)}** |\n`;
      });
    }
    // 4. Default / General Financial & Sales Executive Summary
    else {
      toolCalls.push({ toolName: "getSales", args: { branchId } });
      toolCalls.push({ toolName: "getExpenses", args: { branchId } });
      toolCalls.push({ toolName: "getCustomerMetrics", args: { orgId } });

      const [sales, exp, cust] = await Promise.all([
        toolGetSales(orgId, branchId),
        toolGetExpenses(orgId, branchId),
        toolGetCustomerMetrics(orgId),
      ]);

      const netProfit = sales.totalSales - exp.totalExpenses;

      aiContent = `### 🤖 Restro OS Executive Intelligence Copilot (${branchName})\n\n`;
      aiContent += `Here is your current operational snapshot:\n\n`;
      aiContent += `- 💰 **Gross Sales Revenue**: **$${sales.totalSales.toFixed(2)}** (${sales.orderCount} orders, avg **$${sales.averageOrderValue.toFixed(2)}** / order)\n`;
      aiContent += `- 💸 **Store Expenses**: **$${exp.totalExpenses.toFixed(2)}**\n`;
      aiContent += `- 📈 **Net Estimated Profit**: **$${netProfit.toFixed(2)}**\n`;
      aiContent += `- 👥 **Guest CRM Database**: **${cust.totalCustomers} guests** (${cust.vipCount} ⭐ VIPs)\n\n`;
      aiContent += `*Ask me anything about your branches, sales trends, top dishes, low stock alerts, or expenses!*`;
    }

    const assistantMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: aiContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      toolCalls,
    };

    return {
      success: true,
      message: assistantMessage,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "AI Processing failed.",
    };
  }
}
