-- Restro OS: Phase 06 Tables, Floor Plans & Reservations Schema Migration
-- Migration: 20260830000002_tables_reservations.sql

-- 1. EXTEND TABLES SCHEMA (Floor area, grid positioning, merging, status)
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_status_check;

ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS floor_area TEXT NOT NULL DEFAULT 'Main Floor',
  ADD COLUMN IF NOT EXISTS pos_x INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pos_y INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'square' CHECK (shape IN ('square', 'round', 'rectangle')),
  ADD COLUMN IF NOT EXISTS merged_into_table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  ADD CONSTRAINT tables_status_check CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'disabled'));

-- 2. CREATE RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  party_size INTEGER NOT NULL DEFAULT 2 CHECK (party_size > 0),
  reservation_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_tables_org_loc ON public.tables(org_id, location_id);
CREATE INDEX IF NOT EXISTS idx_tables_floor ON public.tables(org_id, location_id, floor_area);
CREATE INDEX IF NOT EXISTS idx_reservations_org_loc ON public.reservations(org_id, location_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON public.reservations(reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- 4. ROW LEVEL SECURITY (RLS) FOR RESERVATIONS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org reservations"
  ON public.reservations FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

CREATE POLICY "Users can insert org reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

CREATE POLICY "Users can update org reservations"
  ON public.reservations FOR UPDATE
  USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

CREATE POLICY "Users can delete org reservations"
  ON public.reservations FOR DELETE
  USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- 5. ENABLE SUPABASE REALTIME ON RESERVATIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
