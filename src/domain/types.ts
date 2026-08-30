export type UserRole = "owner" | "admin" | "manager" | "staff";
export type MembershipStatus = "active" | "invited" | "suspended";
export type LocationStatus = "active" | "inactive" | "maintenance";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  org_id: string;
  name: string;
  code: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LocationAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface Location {
  id: string;
  restaurant_id: string;
  name: string;
  address?: LocationAddress;
  timezone: string;
  phone?: string | null;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  org_id: string;
  name: string;
  code?: string | null;
  address?: LocationAddress;
  timezone: string;
  phone?: string | null;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  org_id?: string | null;
  name: string;
  description?: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  code: string;
  category: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  org_id: string;
  user_id: string;
  role_id: string;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  role?: Role;
  organization?: Organization;
}

export interface UserLocationAccess {
  user_id: string;
  location_id: string;
  created_at: string;
}
