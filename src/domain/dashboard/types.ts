export interface DashboardKPIs {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  estimatedProfit: number;
  activeCustomers: number;
  tableOccupancyRate: number; // Percentage 0-100
}

export interface SalesTrendPoint {
  timeLabel: string;
  revenue: number;
  orderCount: number;
}

export interface TopProductItem {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  sharePercentage: number;
}

export interface RecentOrderRecord {
  id: string;
  orderNumber: string;
  branchName: string;
  customerName: string;
  totalAmount: number;
  status: "preparing" | "ready" | "served" | "delivered" | "cancelled";
  orderType: "dine_in" | "takeaway" | "delivery";
  createdAt: string;
}

export interface LowStockAlertItem {
  id: string;
  ingredientName: string;
  branchName: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  urgency: "critical" | "warning";
}

export interface KitchenStatusSummary {
  pendingTickets: number;
  inPrepTickets: number;
  readyTickets: number;
  avgPrepTimeMinutes: number;
}

export interface ExpenseCategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

export interface BranchComparisonItem {
  branchId: string;
  branchName: string;
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  occupancyRate: number;
  isBestPerformer?: boolean;
}

export interface AiInsightItem {
  id: string;
  type: "opportunity" | "warning" | "efficiency";
  title: string;
  description: string;
  suggestedAction?: string;
}
