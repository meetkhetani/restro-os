"use client";

import * as React from "react";
import {
  GitBranch,
  Plus,
  Lock,
  CheckCircle,
  AlertTriangle,
  Building2,
  Edit2,
  Power,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  BranchRecord,
  createBranch,
  updateBranch,
  toggleBranchStatus,
  switchActiveBranch,
} from "@/domain/branches/actions";

interface BranchesCatalogClientProps {
  initialBranches: BranchRecord[];
  maxBranches: number;
  allowedToCreate: boolean;
  isMultiBranch: boolean;
  selectedBranchId: string;
  onRefresh: () => void;
}

export function BranchesCatalogClient({
  initialBranches = [],
  maxBranches = 1,
  allowedToCreate = false,
  isMultiBranch = false,
  selectedBranchId,
  onRefresh,
}: BranchesCatalogClientProps) {
  const { addToast } = useToast();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<BranchRecord | null>(null);

  // Form Inputs
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleOpenAddModal = () => {
    if (!allowedToCreate) {
      setIsUpgradeModalOpen(true);
    } else {
      setName("");
      setCode("");
      setAddress("");
      setPhone("");
      setIsAddModalOpen(true);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    const res = await createBranch({ name, code, address, phone });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Branch Provisioned", description: `Registered "${name}" under organization.` });
      setIsAddModalOpen(false);
      onRefresh();
    } else if (res.upgradeRequired) {
      setIsAddModalOpen(false);
      setIsUpgradeModalOpen(true);
    } else {
      addToast({ type: "error", title: "Provisioning Failed", description: res.error });
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    const res = await updateBranch(editingBranch.id, { name, code, address, phone });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Branch Updated" });
      setEditingBranch(null);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Update Failed", description: res.error });
    }
  };

  const handleToggleStatus = async (branchId: string, currentStatus: boolean) => {
    const res = await toggleBranchStatus(branchId, !currentStatus);
    if (res.success) {
      addToast({ type: "success", title: `Branch ${!currentStatus ? "Activated" : "Deactivated"}` });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Status Toggle Failed", description: res.error });
    }
  };

  const handleSwitchStore = async (branchId: string, branchName: string) => {
    const res = await switchActiveBranch(branchId);
    if (res.success) {
      addToast({ type: "success", title: "Switched Active Store", description: `Active outlet changed to ${branchName}.` });
      window.location.reload();
    } else {
      addToast({ type: "error", title: "Switch Failed", description: res.error });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-brand-500" />
            Branch Outlet Management & Multi-Store Control
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isMultiBranch ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
              {isMultiBranch ? "Multi-Branch Plan" : "Standard Plan (1 Branch Max)"}
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Centralized multi-store provisioning, store switching, and tenant isolation policies.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md">
          {allowedToCreate ? <Plus className="h-4 w-4 mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5 text-amber-300" />}
          Provision Branch Outlet
        </Button>
      </div>

      {/* Plan Entitlement Warning Banner if Limit Reached */}
      {!allowedToCreate && (
        <Card className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
          <CardContent className="p-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Branch Limit Reached ({initialBranches.length}/{maxBranches})</h4>
                <p className="text-xs text-amber-700">
                  Your Standard Plan entitlement limits active store locations to {maxBranches}. Upgrade to Multi-Branch to add additional outlets.
                </p>
              </div>
            </div>

            <Button size="sm" onClick={() => setIsUpgradeModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">
              Upgrade to Multi-Branch Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Branches Table */}
      <Card className="overflow-hidden border shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Branch Name</th>
              <th className="p-3.5">Store Code</th>
              <th className="p-3.5">Address / Region</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialBranches.map((b) => {
              const isCurrent = b.id === selectedBranchId;
              return (
                <tr key={b.id} className={`hover:bg-gray-50 font-medium ${isCurrent ? "bg-brand-50/30" : ""}`}>
                  <td className="p-3.5 font-extrabold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand-500" />
                    {b.name}
                    {isCurrent && (
                      <span className="bg-brand-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Active Selection
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-gray-700 font-bold">{b.code}</td>
                  <td className="p-3.5 text-gray-600">{b.address || "Main City Center"}</td>
                  <td className="p-3.5 text-gray-600">{b.phone || "-"}</td>
                  <td className="p-3.5">
                    {b.is_active ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {!isCurrent && b.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSwitchStore(b.id, b.name)}
                        className="text-xs font-bold text-brand-700 border-brand-300 hover:bg-brand-50"
                      >
                        Switch Store
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingBranch(b);
                        setName(b.name);
                        setCode(b.code);
                        setAddress(b.address || "");
                        setPhone(b.phone || "");
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(b.id, b.is_active)}
                      className={b.is_active ? "text-amber-600" : "text-emerald-600"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* MODAL: PROVISION BRANCH */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateBranch} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Provision Branch Outlet</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Uptown Express Branch" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Code *</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. UT-02" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="456 Uptown Blvd..." />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 234-5678" />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">Save Branch</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT BRANCH */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleUpdateBranch} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Edit Branch Details</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Code *</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setEditingBranch(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">Update Details</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: UPGRADE TO MULTI-BRANCH PLAN */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-brand-600 border-b pb-3">
              <div className="p-2 bg-brand-50 rounded-xl">
                <Lock className="h-6 w-6 text-brand-500" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Upgrade to Multi-Branch Plan</h3>
                <p className="text-xs text-gray-500">Expand your restaurant chain with unlimited store locations.</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 uppercase">Multi-Branch Entitlements Include:</h4>
              <ul className="space-y-1.5 text-gray-700 font-medium">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Unlimited Branch Outlet Provisioning</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Inter-Branch Stock Transfers & Inventory Balancing</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Cross-Branch Revenue Rankings & Performance Analytics</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Organization-Wide Staff RBAC Assignment</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500 italic">
              Note: Existing branch records are safely preserved without any data loss.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => setIsUpgradeModalOpen(false)}>Close</Button>
              <a href="/dashboard/billing">
                <Button className="bg-brand-500 text-white font-bold shadow-md">
                  View Billing & Plans <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
