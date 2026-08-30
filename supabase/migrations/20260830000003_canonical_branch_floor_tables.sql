-- Restro OS: Phase 06 Schema Migration & Canonical Architecture Alignment
-- Migration: 20260830000003_canonical_branch_floor_tables.sql
-- Hierarchy: Organization -> Branch -> Floor -> Table

-- 1. CREATE BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe Trigger registration for branches.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_branches_updated_at'
  ) THEN
    CREATE TRIGGER trg_branches_updated_at
      BEFORE UPDATE ON public.branches
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
  END IF;
END $$;

-- Data Migration: Safe mapping from existing locations into branches
INSERT INTO public.branches (id, org_id, name, address, timezone, phone, status, created_at, updated_at)
SELECT 
  l.id,
  r.org_id,
  l.name,
  l.address,
  l.timezone,
  l.phone,
  l.status,
  l.created_at,
  l.updated_at
FROM public.locations l
JOIN public.restaurants r ON l.restaurant_id = r.id
ON CONFLICT (id) DO NOTHING;

-- Default Tenant Provisioning for branches if empty
INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Grand Restro Group', 'grand-restro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, org_id, name, code, timezone, status)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Downtown Main Branch',
  'DTMain',
  'America/New_York',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, org_id, name, code, timezone, status)
VALUES (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000001',
  'Uptown Express Outlet',
  'UPExpress',
  'America/New_York',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE FLOORS TABLE
CREATE TABLE IF NOT EXISTS public.floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, name)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_floors_updated_at'
  ) THEN
    CREATE TRIGGER trg_floors_updated_at
      BEFORE UPDATE ON public.floors
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
  END IF;
END $$;

-- Provision Default Floors ('Main Floor') for all active branches
INSERT INTO public.floors (id, org_id, branch_id, name, sort_order, status)
SELECT 
  gen_random_uuid(),
  b.org_id,
  b.id,
  'Main Floor',
  0,
  'active'
FROM public.branches b
ON CONFLICT (branch_id, name) DO NOTHING;

-- 3. REFACTOR TABLES TABLE
-- Add branch_id and floor_id columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'floor_id'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN floor_id UUID REFERENCES public.floors(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'shape'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN shape TEXT NOT NULL DEFAULT 'square' CHECK (shape IN ('square', 'round', 'rectangle'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'pos_x'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN pos_x INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'pos_y'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN pos_y INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'merged_into_table_id'
  ) THEN
    ALTER TABLE public.tables ADD COLUMN merged_into_table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Migrate existing location_id to branch_id in tables
UPDATE public.tables
SET branch_id = location_id
WHERE branch_id IS NULL AND location_id IS NOT NULL;

-- Default fallback branch assignment if branch_id is still NULL
UPDATE public.tables
SET branch_id = '00000000-0000-0000-0000-000000000101'
WHERE branch_id IS NULL;

-- Migrate floor_id from floors matching branch_id
UPDATE public.tables t
SET floor_id = (
  SELECT f.id FROM public.floors f WHERE f.branch_id = t.branch_id LIMIT 1
)
WHERE t.floor_id IS NULL;

-- Unique constraint for branch_id & table_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tables_branch_id_table_number_key'
  ) THEN
    ALTER TABLE public.tables ADD CONSTRAINT tables_branch_id_table_number_key UNIQUE (branch_id, table_number);
  END IF;
END $$;

-- 4. REFACTOR RESERVATIONS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate existing location_id to branch_id in reservations
UPDATE public.reservations
SET branch_id = location_id
WHERE branch_id IS NULL AND location_id IS NOT NULL;

-- Default fallback branch assignment for reservations
UPDATE public.reservations
SET branch_id = '00000000-0000-0000-0000-000000000101'
WHERE branch_id IS NULL;

-- 5. INDEXES FOR PERFORMANCE & FK LOOKUPS
CREATE INDEX IF NOT EXISTS idx_branches_org_id ON public.branches(org_id);
CREATE INDEX IF NOT EXISTS idx_floors_branch_id ON public.floors(branch_id);
CREATE INDEX IF NOT EXISTS idx_floors_org_id ON public.floors(org_id);
CREATE INDEX IF NOT EXISTS idx_tables_org_branch ON public.tables(org_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_tables_branch_floor ON public.tables(branch_id, floor_id);
CREATE INDEX IF NOT EXISTS idx_reservations_org_branch ON public.reservations(org_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_reservations_branch_time ON public.reservations(branch_id, reservation_time);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Branches Policies
DROP POLICY IF EXISTS "Branches viewable by active org members" ON public.branches;
CREATE POLICY "Branches viewable by active org members" ON public.branches
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Branches manageable by org admins" ON public.branches;
CREATE POLICY "Branches manageable by org admins" ON public.branches
  FOR ALL USING (public.is_org_admin(org_id));

-- Floors Policies
DROP POLICY IF EXISTS "Floors viewable by active org members" ON public.floors;
CREATE POLICY "Floors viewable by active org members" ON public.floors
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Floors manageable by org admins" ON public.floors;
CREATE POLICY "Floors manageable by org admins" ON public.floors
  FOR ALL USING (public.is_org_admin(org_id));

-- Tables Policies
DROP POLICY IF EXISTS "Tables viewable by active org members" ON public.tables;
CREATE POLICY "Tables viewable by active org members" ON public.tables
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Tables manageable by active org members" ON public.tables;
CREATE POLICY "Tables manageable by active org members" ON public.tables
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Reservations Policies
DROP POLICY IF EXISTS "Reservations viewable by active org members" ON public.reservations;
CREATE POLICY "Reservations viewable by active org members" ON public.reservations
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Reservations manageable by active org members" ON public.reservations;
CREATE POLICY "Reservations manageable by active org members" ON public.reservations
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- 7. SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'floors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.floors;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
END $$;
