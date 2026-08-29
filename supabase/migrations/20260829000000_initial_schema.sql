-- Restro OS: Phase 01 Schema Migration
-- Migration: 20260829000000_initial_schema.sql
-- Description: Core schema, indexes, multi-tenant functions, triggers, and Row Level Security (RLS) policies.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. AUTOMATIC UPDATED_AT TIMESTAMP FUNCTION
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CORE SCHEMAS & TABLES

-- Profiles Table (Tied to Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations Table (Multi-tenant Root)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Restaurants Table (Brands under Organizations)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, code)
);

-- Locations Table (Operating sites)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role Permissions Junction
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Memberships Table (User to Org mapping with assigned Role)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- User Location Access Junction
CREATE TABLE IF NOT EXISTS public.user_location_access (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, location_id)
);

-- 4. INDEXES FOR PERFORMANCE & FK LOOKUPS
CREATE INDEX IF NOT EXISTS idx_restaurants_org_id ON public.restaurants(org_id);
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON public.locations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_roles_org_id ON public.roles(org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON public.memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role_id ON public.memberships(role_id);
CREATE INDEX IF NOT EXISTS idx_user_location_access_user_id ON public.user_location_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_access_location_id ON public.user_location_access(location_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- 5. TRIGGER REGISTRATIONS FOR UPDATED_AT
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- 6. AUTOMATIC PROFILE CREATION ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. SECURITY DEFINER RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.auth_user_org_ids()
RETURNS TABLE (org_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT m.org_id
  FROM public.memberships m
  WHERE m.user_id = auth.uid()
    AND m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.org_id = target_org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.memberships m
    JOIN public.roles r ON m.role_id = r.id
    WHERE m.org_id = target_org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND r.name IN ('Owner', 'Admin', 'owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on ALL application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_access ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles viewable by self or org members" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.memberships m1
      JOIN public.memberships m2 ON m1.org_id = m2.org_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
    )
  );

CREATE POLICY "Profiles editable by self" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Organizations Policies
CREATE POLICY "Organizations viewable by active members" ON public.organizations
  FOR SELECT USING (id IN (SELECT org_id FROM public.auth_user_org_ids()));

CREATE POLICY "Organizations editable by org admins" ON public.organizations
  FOR UPDATE USING (public.is_org_admin(id));

-- Restaurants Policies
CREATE POLICY "Restaurants viewable by org members" ON public.restaurants
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

CREATE POLICY "Restaurants manageable by org admins" ON public.restaurants
  FOR ALL USING (public.is_org_admin(org_id));

-- Locations Policies
CREATE POLICY "Locations viewable by org members" ON public.locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = public.locations.restaurant_id
        AND r.org_id IN (SELECT org_id FROM public.auth_user_org_ids())
    )
  );

CREATE POLICY "Locations manageable by org admins" ON public.locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = public.locations.restaurant_id
        AND public.is_org_admin(r.org_id)
    )
  );

-- Roles Policies
CREATE POLICY "Roles viewable by org members or system roles" ON public.roles
  FOR SELECT USING (
    is_system = TRUE OR org_id IN (SELECT org_id FROM public.auth_user_org_ids())
  );

CREATE POLICY "Roles manageable by org admins" ON public.roles
  FOR ALL USING (org_id IS NOT NULL AND public.is_org_admin(org_id));

-- Permissions Policies
CREATE POLICY "Permissions viewable by authenticated users" ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Role Permissions Policies
CREATE POLICY "Role permissions viewable by authenticated users" ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Memberships Policies
CREATE POLICY "Memberships viewable by org members" ON public.memberships
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

CREATE POLICY "Memberships manageable by org admins" ON public.memberships
  FOR ALL USING (public.is_org_admin(org_id));

-- User Location Access Policies
CREATE POLICY "User location access viewable by self or org admin" ON public.user_location_access
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.locations l
      JOIN public.restaurants r ON l.restaurant_id = r.id
      WHERE l.id = public.user_location_access.location_id
        AND public.is_org_admin(r.org_id)
    )
  );

-- 9. INITIAL SEED SYSTEM PERMISSIONS
INSERT INTO public.permissions (code, category, description) VALUES
  ('org:manage', 'organization', 'Full management of organization settings and members'),
  ('org:view', 'organization', 'View organization profile and members'),
  ('restaurant:manage', 'restaurant', 'Manage restaurant brands and settings'),
  ('location:manage', 'location', 'Manage store locations and operational settings'),
  ('location:view', 'location', 'View assigned store locations'),
  ('menu:manage', 'menu', 'Manage menus, items, categories, and pricing'),
  ('pos:operate', 'pos', 'Access and process orders on Point of Sale terminal'),
  ('reports:view', 'reports', 'View sales, operational, and financial analytics')
ON CONFLICT (code) DO NOTHING;
