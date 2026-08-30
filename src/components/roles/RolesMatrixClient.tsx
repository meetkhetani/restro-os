"use client";

import * as React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Utensils,
  Boxes,
  Truck,
  Users,
  CreditCard,
  BarChart3,
  Tv,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { RolePermissions } from "@/domain/staff/actions";

interface RolesMatrixClientProps {
  matrix: RolePermissions[];
}

export function RolesMatrixClient({ matrix = [] }: RolesMatrixClientProps) {
  const modules = [
    { key: "pos_access", label: "Point of Sale (POS)", icon: Utensils },
    { key: "kds_access", label: "Kitchen Display (KDS)", icon: Tv },
    { key: "menu_management", label: "Menu Catalog Management", icon: Utensils },
    { key: "inventory_control", label: "Stock & Inventory Control", icon: Boxes },
    { key: "purchasing_control", label: "Purchasing & Vendor POs", icon: Truck },
    { key: "crm_access", label: "Customer CRM & Directory", icon: Users },
    { key: "billing_access", label: "SaaS Plan & Billing", icon: CreditCard },
    { key: "reports_access", label: "Analytics & Executive Reports", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-500" />
            Role-Based Access Control (RBAC) Permissions Matrix
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Database-enforced permission bounds for system roles across all Restro OS modules.
          </p>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <Card className="overflow-hidden border shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Module / Feature</th>
              <th className="p-3.5 text-center">Owner</th>
              <th className="p-3.5 text-center">Manager</th>
              <th className="p-3.5 text-center">Cashier</th>
              <th className="p-3.5 text-center">Kitchen</th>
              <th className="p-3.5 text-center">Waiter</th>
              <th className="p-3.5 text-center">Inventory Mgr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {modules.map((mod) => (
              <tr key={mod.key} className="hover:bg-gray-50 font-medium">
                <td className="p-3.5 font-bold text-gray-900 flex items-center gap-2">
                  <mod.icon className="h-4 w-4 text-brand-500" />
                  {mod.label}
                </td>

                {["owner", "manager", "cashier", "kitchen", "waiter", "inventory_manager"].map((roleKey) => {
                  const permRow = matrix.find((r) => r.role === roleKey);
                  const isAllowed = permRow ? (permRow as unknown as Record<string, boolean>)[mod.key] : false;

                  return (
                    <td key={roleKey} className="p-3.5 text-center">
                      {isAllowed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <XCircle className="h-3.5 w-3.5 text-gray-300" /> Blocked
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
