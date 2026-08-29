"use client";

import * as React from "react";
import { OrganizationBranchContextState, BranchOption } from "@/domain/context/types";
import { Organization, Profile } from "@/domain/types";
import { Plan, SubscriptionStatus } from "@/domain/entitlements/types";

const OrgBranchContext = React.createContext<OrganizationBranchContextState | undefined>(undefined);

interface OrgBranchProviderProps {
  children: React.ReactNode;
  initialOrg?: Organization | null;
  initialBranch?: BranchOption | null;
  initialBranches?: BranchOption[];
  initialPlan?: Plan | null;
  initialIsMultiBranchEntitled?: boolean;
}

export function OrgBranchProvider({
  children,
  initialOrg = null,
  initialBranch = null,
  initialBranches = [],
  initialPlan = null,
  initialIsMultiBranchEntitled = false,
}: OrgBranchProviderProps) {
  const [currentOrg, setCurrentOrg] = React.useState<Organization | null>(
    initialOrg || {
      id: "demo-org-1",
      name: "Grand Restro Group",
      slug: "grand-restro",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const [availableBranches, setAvailableBranches] = React.useState<BranchOption[]>(
    initialBranches.length > 0
      ? initialBranches
      : [
          { id: "all", name: "All Branches (Central View)", isAll: true },
          { id: "loc-101", name: "Downtown Main Branch", code: "DT-01" },
          { id: "loc-102", name: "Uptown Express Outlet", code: "UT-02" },
        ]
  );

  const [currentBranch, setCurrentBranch] = React.useState<BranchOption>(
    initialBranch || availableBranches[0]
  );

  const [plan] = React.useState<Plan>(
    initialPlan || {
      id: "plan-standard",
      code: "standard",
      name: "Standard Plan",
      description: "Standard single branch plan",
      max_branches: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const [isMultiBranchEntitled] = React.useState<boolean>(initialIsMultiBranchEntitled);
  const [isLoading, setIsLoading] = React.useState(false);

  const setBranch = React.useCallback(
    (branchId: string) => {
      // Security Check: If user selects 'all' without multi-branch entitlement, block switch
      if (branchId === "all" && !isMultiBranchEntitled) {
        console.warn("Security Scoping: Multi-Branch entitlement required for 'All Branches' view.");
        return;
      }
      const target = availableBranches.find((b) => b.id === branchId);
      if (target) {
        setCurrentBranch(target);
      }
    },
    [availableBranches, isMultiBranchEntitled]
  );

  const setOrg = React.useCallback((orgId: string) => {
    setIsLoading(true);
    // In production, fetches new org data & re-resolves context
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  return (
    <OrgBranchContext.Provider
      value={{
        currentOrg,
        currentBranch,
        availableBranches,
        currentUser: {
          id: "user-operator",
          full_name: "Admin Operator",
          email: "admin@restro-os.dev",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        userRole: "Owner",
        permissions: [
          "org:manage",
          "org:view",
          "restaurant:manage",
          "location:manage",
          "location:view",
          "menu:manage",
          "pos:operate",
          "reports:view",
        ],
        plan,
        subscriptionStatus: "active",
        isMultiBranchEntitled,
        setBranch,
        setOrg,
        isLoading,
      }}
    >
      {children}
    </OrgBranchContext.Provider>
  );
}

export function useOrgBranch() {
  const context = React.useContext(OrgBranchContext);
  if (!context) {
    throw new Error("useOrgBranch must be used within an OrgBranchProvider");
  }
  return context;
}
