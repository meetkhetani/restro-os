-- Restro OS: Phase 12 Staff, Roles & Multi-Branch Permissions Migration
-- Migration: 20260830000009_staff_roles_permissions.sql

-- 1. ENSURE ROLE CONSTRAINT ON MEMBERSHIPS HAS ALL STANDARD ROLES
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'memberships_role_check'
  ) THEN
    ALTER TABLE public.memberships DROP CONSTRAINT memberships_role_check;
  END IF;

  ALTER TABLE public.memberships ADD CONSTRAINT memberships_role_check
    CHECK (role IN ('owner', 'manager', 'cashier', 'kitchen', 'waiter', 'inventory_manager'));
END $$;

-- 2. BRANCH MEMBERSHIPS TABLE (Explicit Branch Access Control)
CREATE TABLE IF NOT EXISTS public.branch_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, user_id)
);

-- 3. ROLE PERMISSIONS MATRIX TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role TEXT PRIMARY KEY CHECK (role IN ('owner', 'manager', 'cashier', 'kitchen', 'waiter', 'inventory_manager')),
  pos_access BOOLEAN NOT NULL DEFAULT FALSE,
  kds_access BOOLEAN NOT NULL DEFAULT FALSE,
  menu_management BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_control BOOLEAN NOT NULL DEFAULT FALSE,
  purchasing_control BOOLEAN NOT NULL DEFAULT FALSE,
  crm_access BOOLEAN NOT NULL DEFAULT FALSE,
  billing_access BOOLEAN NOT NULL DEFAULT FALSE,
  reports_access BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Role Permissions Matrix
INSERT INTO public.role_permissions (role, pos_access, kds_access, menu_management, inventory_control, purchasing_control, crm_access, billing_access, reports_access)
VALUES
  ('owner',             true, true, true, true, true, true, true, true),
  ('manager',           true, true, true, true, true, true, false, true),
  ('cashier',           true, false, false, false, false, true, false, false),
  ('kitchen',           false, true, false, false, false, false, false, false),
  ('waiter',            true, false, false, false, false, true, false, false),
  ('inventory_manager', false, false, true, true, true, false, false, true)
ON CONFLICT (role) DO UPDATE SET
  pos_access = EXCLUDED.pos_access,
  kds_access = EXCLUDED.kds_access,
  menu_management = EXCLUDED.menu_management,
  inventory_control = EXCLUDED.inventory_control,
  purchasing_control = EXCLUDED.purchasing_control,
  crm_access = EXCLUDED.crm_access,
  billing_access = EXCLUDED.billing_access,
  reports_access = EXCLUDED.reports_access;

-- 4. RLS SECURITY POLICIES
ALTER TABLE public.branch_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'branch_memberships_tenant_policy') THEN
    CREATE POLICY branch_memberships_tenant_policy ON public.branch_memberships
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_permissions_read_policy') THEN
    CREATE POLICY role_permissions_read_policy ON public.role_permissions
      FOR SELECT USING (true);
  END IF;
END $$;
