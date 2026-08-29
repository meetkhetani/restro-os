"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Command, ArrowRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const searchItems = [
  { title: "Dashboard Overview", category: "Navigation", href: "/dashboard" },
  { title: "POS Terminal", category: "Operations", href: "/dashboard/pos" },
  { title: "Active Orders", category: "Operations", href: "/dashboard/orders" },
  { title: "Table Floor Plan", category: "Operations", href: "/dashboard/tables" },
  { title: "Kitchen Display (KDS)", category: "Operations", href: "/dashboard/kitchen" },
  { title: "Menu & Item Recipes", category: "Management", href: "/dashboard/menu" },
  { title: "Inventory Stocks", category: "Management", href: "/dashboard/inventory" },
  { title: "Purchasing & Vendors", category: "Management", href: "/dashboard/purchasing" },
  { title: "Customers Database", category: "CRM", href: "/dashboard/customers" },
  { title: "Staff & Attendance", category: "Management", href: "/dashboard/staff" },
  { title: "Analytics & Reports", category: "Insights", href: "/dashboard/analytics" },
  { title: "AI Assistant Copilot", category: "Intelligence", href: "/dashboard/ai" },
  { title: "Branch Management", category: "Administration", href: "/dashboard/branches" },
  { title: "SaaS Plans & Billing", category: "Administration", href: "/dashboard/billing" },
];

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const filtered = searchItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
    setQuery("");
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-xl p-0 overflow-hidden">
      <div className="flex items-center border-b border-restro-200 px-4 py-3 bg-surface">
        <Search className="h-4 w-4 text-restro-400 mr-2" />
        <input
          type="text"
          placeholder="Search modules, branches, orders, settings..."
          className="flex-1 bg-transparent text-sm text-restro-900 placeholder:text-restro-400 focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="flex items-center text-[10px] text-restro-400 bg-restro-100 px-1.5 py-0.5 rounded border border-restro-200">
          <Command className="h-3 w-3 mr-0.5" /> K
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-2 divide-y divide-restro-100">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-restro-500">
            No search results matching &quot;{query}&quot;
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.href}
              onClick={() => handleSelect(item.href)}
              className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-restro-50 text-left transition-colors group"
            >
              <div>
                <span className="text-xs font-semibold text-restro-900 block group-hover:text-brand-600 transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] text-restro-500">{item.category}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-restro-300 group-hover:text-brand-600 transition-colors" />
            </button>
          ))
        )}
      </div>
    </Dialog>
  );
}
