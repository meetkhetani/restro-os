"use client";

import * as React from "react";
import { GitBranch, Plus, Lock, CheckCircle, AlertTriangle, Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { canCreateBranch, getBranchLimit } from "@/domain/entitlements/service";

export default function BranchesPage() {
  const [branches, setBranches] = React.useState([
    {
      id: "b-1",
      name: "Downtown Main Branch",
      code: "DT-01",
      city: "New York",
      timezone: "America/New_York",
      status: "active",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [branchName, setBranchName] = React.useState("");
  const [branchCode, setBranchCode] = React.useState("");
  const [entitlementState, setEntitlementState] = React.useState<{
    allowed: boolean;
    currentCount: number;
    maxLimit: number;
    reason?: string;
  }>({
    allowed: false,
    currentCount: 1,
    maxLimit: 1,
    reason: "Branch limit reached (1/1). Upgrade to Multi-Branch plan.",
  });

  const { addToast } = useToast();

  // Load live entitlement check on mount / branch update
  React.useEffect(() => {
    async function checkEntitlement() {
      try {
        const check = await canCreateBranch("demo-org-id");
        // Override with local state count for client interactive demo
        const localAllowed = check.maxLimit === -1 || branches.length < check.maxLimit;
        setEntitlementState({
          allowed: localAllowed,
          currentCount: branches.length,
          maxLimit: check.maxLimit,
          reason: localAllowed
            ? undefined
            : `Branch limit reached (${branches.length}/${check.maxLimit}). Upgrade to Multi-Branch plan to manage additional branches.`,
        });
      } catch {
        // Fallback entitlement logic
        setEntitlementState({
          allowed: branches.length < 1,
          currentCount: branches.length,
          maxLimit: 1,
          reason: "Branch limit reached (1/1). Upgrade to Multi-Branch plan.",
        });
      }
    }
    checkEntitlement();
  }, [branches.length]);

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!entitlementState.allowed) {
      addToast({
        type: "error",
        title: "Entitlement Guard Blocked Action",
        description: entitlementState.reason || "Branch creation limit reached.",
      });
      return;
    }

    const newBranch = {
      id: `b-${Date.now()}`,
      name: branchName,
      code: branchCode.toUpperCase(),
      city: "New York",
      timezone: "America/New_York",
      status: "active",
    };

    setBranches((prev) => [...prev, newBranch]);
    setIsModalOpen(false);
    setBranchName("");
    setBranchCode("");

    addToast({
      type: "success",
      title: "Branch Provisioned",
      description: `Registered "${branchName}" under organization tenant.`,
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-restro-200 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-restro-900 tracking-tight">
              Branch Management & Multi-Store Control
            </h1>
            <Badge variant={entitlementState.maxLimit === -1 ? "brand" : "default"}>
              {entitlementState.maxLimit === -1 ? "Multi-Branch Active" : "Standard Plan (1 Branch)"}
            </Badge>
          </div>
          <p className="text-xs text-restro-500 mt-1">
            Centralized branch operations guarded by the Restro OS Entitlement System.
          </p>
        </div>

        <Button
          onClick={() => {
            if (!entitlementState.allowed) {
              addToast({
                type: "warning",
                title: "Plan Entitlement Restriction",
                description: entitlementState.reason || "Upgrade required.",
              });
            } else {
              setIsModalOpen(true);
            }
          }}
        >
          {entitlementState.allowed ? (
            <Plus className="mr-1.5 h-4 w-4" />
          ) : (
            <Lock className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
          )}
          Add Branch Outlet
        </Button>
      </div>

      {/* Entitlement Banner */}
      {!entitlementState.allowed && (
        <Card className="bg-amber-50/60 border-amber-200 shadow-subtle">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Entitlement Limit Reached</h4>
                <p className="text-xs text-amber-700">{entitlementState.reason}</p>
              </div>
            </div>
            <a href="/dashboard/billing">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
                View Upgrade Options
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Branch Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Branch Name</TableHead>
            <TableHead>Store Code</TableHead>
            <TableHead>City / Region</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-bold text-restro-900">{b.name}</TableCell>
              <TableCell className="font-mono text-xs">{b.code}</TableCell>
              <TableCell>{b.city}</TableCell>
              <TableCell className="font-mono text-xs text-restro-600">{b.timezone}</TableCell>
              <TableCell>
                <Badge variant="success">Active</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  Manage Store
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Branch Outlet"
        description="Add a store location under your organization."
      >
        <form onSubmit={handleAddBranch} className="space-y-4">
          <Input
            label="Branch Name"
            placeholder="e.g. Uptown Express Branch"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          />
          <Input
            label="Store Code"
            placeholder="e.g. UT-02"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Provision Branch</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
