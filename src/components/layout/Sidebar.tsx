"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  ShoppingBag,
  Grid,
  ChefHat,
  Utensils,
  Boxes,
  Truck,
  Users,
  UserCheck,
  Receipt,
  CreditCard,
  BarChart3,
  Sparkles,
  Building2,
  GitBranch,
  CreditCard as BillingIcon,
  ShieldCheck,
  Settings,
  FileText,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS", href: "/dashboard/pos", icon: Monitor },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Tables", href: "/dashboard/tables", icon: Grid },
  { name: "Kitchen", href: "/dashboard/kitchen", icon: ChefHat },
  { name: "Menu", href: "/dashboard/menu", icon: Utensils },
  { name: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { name: "Purchasing", href: "/dashboard/purchasing", icon: Truck },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Staff", href: "/dashboard/staff", icon: UserCheck },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "AI Assistant", href: "/dashboard/ai", icon: Sparkles },
];

export const adminNavigation = [
  { name: "Organization", href: "/dashboard/organization", icon: Building2 },
  { name: "Branches", href: "/dashboard/branches", icon: GitBranch },
  { name: "Billing", href: "/dashboard/billing", icon: BillingIcon },
  { name: "Users & Roles", href: "/dashboard/roles", icon: ShieldCheck },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Audit Logs", href: "/dashboard/audit", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 border-r border-restro-200 bg-surface flex-col h-screen sticky top-0 shadow-subtle select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-restro-100">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-9 w-9 rounded-md bg-brand-500 flex items-center justify-center text-white shadow-subtle group-hover:bg-brand-600 transition-colors">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-restro-900 block leading-none">
              RESTRO <span className="text-brand-500">OS</span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-restro-400 tracking-widest mt-1 block">
              SaaS Core v2.0
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-restro-400 mb-2">
            Main Operations
          </p>
          <nav className="space-y-0.5">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all",
                    isActive
                      ? "bg-brand-50 text-brand-700 font-bold border-l-2 border-brand-500"
                      : "text-restro-600 hover:bg-restro-50 hover:text-restro-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-brand-600" : "text-restro-400"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-restro-400 mb-2">
            Administration
          </p>
          <nav className="space-y-0.5">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-all",
                    isActive
                      ? "bg-brand-50 text-brand-700 font-bold border-l-2 border-brand-500"
                      : "text-restro-600 hover:bg-restro-50 hover:text-restro-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-brand-600" : "text-restro-400"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-restro-100 bg-restro-50/50">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center text-xs font-bold">
            AO
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-restro-900 truncate">Admin Operator</p>
            <p className="text-[10px] text-restro-500 truncate">Standard Plan Entitled</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
