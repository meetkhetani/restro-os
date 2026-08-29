import { Organization, Location, Profile } from "../types";
import { Plan, SubscriptionStatus } from "../entitlements/types";

export interface BranchOption {
  id: string; // 'all' or specific location UUID
  name: string;
  code?: string;
  isAll?: boolean;
}

export type UserPermissionCode =
  | "org:manage"
  | "org:view"
  | "restaurant:manage"
  | "location:manage"
  | "location:view"
  | "menu:manage"
  | "pos:operate"
  | "reports:view";

export interface OrganizationBranchContextState {
  currentOrg: Organization | null;
  currentBranch: BranchOption;
  availableBranches: BranchOption[];
  currentUser: Profile | null;
  userRole: string;
  permissions: UserPermissionCode[];
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  isMultiBranchEntitled: boolean;
  setBranch: (branchId: string) => void;
  setOrg: (orgId: string) => void;
  isLoading: boolean;
}
