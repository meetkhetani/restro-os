"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Store,
  Users,
  ShieldCheck,
  Settings,
  UtensilsCrossed,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Organizations", href: "/dashboard/organizations", icon: Building2 },
  { name: "Locations", href: "/dashboard/locations", icon: Store },
  { name: "Team & Profiles", href: "/dashboard/team", icon: Users },
  { name: "Roles & Permissions", href: "/dashboard/roles", icon: ShieldCheck },
  { name: "System Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-restro-200 bg-surface flex flex-col h-screen sticky top-0 shadow-subtle select-none">
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
              Enterprise v1.0
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-restro-400 mb-2">
            Core Architecture
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all",
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
            Infrastructure Status
          </p>
          <div className="px-3 py-3 rounded-md bg-restro-50 border border-restro-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-restro-600">Database RLS:</span>
              <span className="font-semibold text-emerald-600">Strict Multi-Tenant</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-restro-600">Provider:</span>
              <span className="font-semibold text-restro-900">Supabase DB</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-restro-600">Auth Engine:</span>
              <span className="font-semibold text-restro-900">Supabase Auth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Profile badge */}
      <div className="p-4 border-t border-restro-100 bg-restro-50/50">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-restro-900 truncate">Admin Operator</p>
            <p className="text-[10px] text-restro-500 truncate">admin@restro-os.dev</p>
          </div>
          <Layers className="h-4 w-4 text-restro-400" />
        </div>
      </div>
    </aside>
  );
}
