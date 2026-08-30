-- Restro OS: Phase 06 Schema Migration - Decouple Legacy location_id & Enforce Canonical Hierarchy
-- Migration: 20260830000004_legacy_location_id_decoupling.sql
-- Canonical Hierarchy: Organization -> Branch -> Floor -> Table

-- 1. ENSURE DEFAULT BRANCH AND FLOOR RECORDS EXIST
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

INSERT INTO public.floors (id, org_id, branch_id, name, sort_order, status)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'Main Floor',
  0,
  'active'
)
ON CONFLICT (branch_id, name) DO NOTHING;

-- 2. DATA MIGRATION: POPULATE BRANCH_ID & FLOOR_ID IN TABLES
UPDATE public.tables
SET branch_id = location_id
WHERE branch_id IS NULL AND location_id IS NOT NULL;

UPDATE public.tables
SET branch_id = '00000000-0000-0000-0000-000000000101'
WHERE branch_id IS NULL;

-- Populate floor_id for any tables missing floor_id
UPDATE public.tables t
SET floor_id = (
  SELECT f.id FROM public.floors f WHERE f.branch_id = t.branch_id LIMIT 1
)
WHERE t.floor_id IS NULL;

-- 3. DATA MIGRATION: POPULATE BRANCH_ID IN RESERVATIONS
UPDATE public.reservations
SET branch_id = location_id
WHERE branch_id IS NULL AND location_id IS NOT NULL;

UPDATE public.reservations
SET branch_id = '00000000-0000-0000-0000-000000000101'
WHERE branch_id IS NULL;

-- 4. DROP LEGACY NOT NULL CONSTRAINTS ON LOCATION_ID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tables' AND column_name = 'location_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.tables ALTER COLUMN location_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'location_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.reservations ALTER COLUMN location_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'location_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.orders ALTER COLUMN location_id DROP NOT NULL;
  END IF;
END $$;

-- 5. SET CANONICAL NOT NULL CONSTRAINTS ON BRANCH_ID & FLOOR_ID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tables' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.tables ALTER COLUMN branch_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tables' AND column_name = 'floor_id'
  ) THEN
    ALTER TABLE public.tables ALTER COLUMN floor_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.reservations ALTER COLUMN branch_id SET NOT NULL;
  END IF;
END $$;

-- 6. RE-ASSERT UNIQUE INDEX & RLS POLICIES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tables_branch_id_table_number_key'
  ) THEN
    ALTER TABLE public.tables ADD CONSTRAINT tables_branch_id_table_number_key UNIQUE (branch_id, table_number);
  END IF;
END $$;
