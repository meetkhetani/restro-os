export interface PlanPriceConfig {
  planCode: "standard" | "multi_branch";
  name: string;
  monthlyPrice: number;
  annualPrice: number; // 2 months free rate
  currency: string;
  maxBranches: number;
  features: string[];
}

export const BILLING_PLANS_CONFIG: Record<"standard" | "multi_branch", PlanPriceConfig> = {
  standard: {
    planCode: "standard",
    name: "Standard Plan",
    monthlyPrice: 2999,
    annualPrice: 29990,
    currency: "INR",
    maxBranches: 1,
    features: [
      "1 Organization Tenant",
      "1 Active Branch Outlet Limit",
      "Single-Branch Sales & Operational Analytics",
      "Full POS, Menu, Inventory & Order Processing",
      "Restro OS AI Copilot & Insights",
    ],
  },
  multi_branch: {
    planCode: "multi_branch",
    name: "Multi-Branch Plan",
    monthlyPrice: 7999,
    annualPrice: 79990,
    currency: "INR",
    maxBranches: 99,
    features: [
      "1 Organization Tenant",
      "Multiple Branch Outlets (Configured Capacity)",
      "Inter-Branch Stock Transfers & Inventory Balancing",
      "Cross-Branch Analytics & Revenue Rankings",
      "Organization-Wide Multi-Branch RBAC Staff Roles",
      "Organization-Level AI Copilot & Insights",
    ],
  },
};
