"use client";

import * as React from "react";
import {
  UserCheck,
  Plus,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Search,
  KeyRound,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  StaffMember,
  SystemRole,
  updateStaffRoleAndBranches,
} from "@/domain/staff/actions";

interface StaffCatalogClientProps {
  initialStaff: StaffMember[];
  availableBranches: Array<{ id: string; name: string }>;
  onRefresh: () => void;
}

export function StaffCatalogClient({
  initialStaff = [],
  availableBranches = [],
  onRefresh,
}: StaffCatalogClientProps) {
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = React.useState<string>("all");

  // Modal States
  const [editingStaff, setEditingStaff] = React.useState<StaffMember | null>(null);

  // Form Inputs for Editing Staff
  const [editRole, setEditRole] = React.useState<SystemRole>("cashier");
  const [editStatus, setEditStatus] = React.useState<"active" | "inactive">("active");
  const [selectedBranchIds, setSelectedBranchIds] = React.useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditRole(staff.role);
    setEditStatus(staff.status);
    setSelectedBranchIds((staff.branch_assignments || []).map((b) => b.branch_id));
  };

  const handleSaveStaffAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsSubmitting(true);
    const res = await updateStaffRoleAndBranches(
      editingStaff.user_id,
      editRole,
      selectedBranchIds,
      editStatus
    );
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: "success",
        title: "Permissions Updated",
        description: `Updated permissions and branch access for ${editingStaff.full_name}.`,
      });
      setEditingStaff(null);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Update Failed", description: res.error });
    }
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  // Filtered Staff
  const filteredStaff = React.useMemo(() => {
    return initialStaff.filter((s) => {
      const matchesSearch =
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRoleFilter === "all" || s.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [initialStaff, searchQuery, selectedRoleFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-brand-500" />
            Staff & Employee Roster
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Role-Based Access Control (RBAC), Multi-Branch Access Assignment, and Active/Inactive Control.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500">System Role:</span>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="waiter">Waiter</option>
            <option value="inventory_manager">Inventory Manager</option>
          </select>
        </div>
      </div>

      {/* Staff Roster Table */}
      <Card className="overflow-hidden border shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Staff Member</th>
              <th className="p-3">System Role</th>
              <th className="p-3">Assigned Branches</th>
              <th className="p-3">Account Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 font-medium">
                <td className="p-3">
                  <span className="font-bold text-gray-900 block">{member.full_name}</span>
                  <span className="text-[11px] text-gray-500">{member.email}</span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      member.role === "owner"
                        ? "bg-purple-100 text-purple-800 border border-purple-300"
                        : member.role === "manager"
                        ? "bg-blue-100 text-blue-800"
                        : member.role === "cashier"
                        ? "bg-emerald-100 text-emerald-800"
                        : member.role === "kitchen"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {member.role.replace("_", " ")}
                  </span>
                </td>
                <td className="p-3">
                  {member.role === "owner" || member.role === "manager" ? (
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-brand-200">
                      All Org Branches
                    </span>
                  ) : member.branch_assignments && member.branch_assignments.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {member.branch_assignments.map((b) => (
                        <span key={b.id} className="bg-gray-100 text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {b.branch_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No branch assigned</span>
                  )}
                </td>
                <td className="p-3">
                  {member.status === "active" ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                      <XCircle className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditModal(member)}
                    className="text-xs text-gray-700"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Access
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* MODAL: EDIT STAFF PERMISSIONS */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveStaffAccess} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Edit Access: {editingStaff.full_name}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">System Role *</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as SystemRole)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none bg-white font-medium"
              >
                <option value="owner">Owner (Full Org Control)</option>
                <option value="manager">Manager (Operations)</option>
                <option value="cashier">Cashier (POS Terminal)</option>
                <option value="kitchen">Kitchen Staff (KDS Display)</option>
                <option value="waiter">Waiter (Order Taking)</option>
                <option value="inventory_manager">Inventory Manager (Stock & POs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "active" | "inactive")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none bg-white font-medium"
              >
                <option value="active">Active (Access Granted)</option>
                <option value="inactive">Inactive (Access Blocked)</option>
              </select>
            </div>

            {/* Branch Access Selection */}
            {editRole !== "owner" && editRole !== "manager" && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800">Assigned Branch Access</label>
                <p className="text-[11px] text-gray-500">
                  Select which specific restaurant branches this staff member can access.
                </p>
                <div className="space-y-1.5 pt-1">
                  {availableBranches.map((b) => (
                    <label key={b.id} className="flex items-center space-x-2 text-xs font-medium text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBranchIds.includes(b.id)}
                        onChange={() => toggleBranchSelection(b.id)}
                        className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setEditingStaff(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">
                Save Access Settings
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
