-- Restro OS: Phase 09 Branch Inventory & Stock Ledger Migration
-- Migration: 20260830000006_branch_inventory_ledger.sql

-- 1. INGREDIENTS CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  min_threshold NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BRANCH INVENTORY STOCK TABLE
CREATE TABLE IF NOT EXISTS public.branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_on_hand NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, ingredient_id)
);

-- 3. STOCK MOVEMENTS LEDGER TABLE (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase_received', 'adjustment', 'wastage', 'pos_deduction', 'transfer_in', 'transfer_out')),
  quantity NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. STOCK TRANSFERS TABLE (Inter-Branch Transfers)
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  to_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RLS SECURITY POLICIES
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ingredients_tenant_policy') THEN
    CREATE POLICY ingredients_tenant_policy ON public.ingredients
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'branch_inventory_tenant_policy') THEN
    CREATE POLICY branch_inventory_tenant_policy ON public.branch_inventory
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'stock_movements_tenant_policy') THEN
    CREATE POLICY stock_movements_tenant_policy ON public.stock_movements
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'stock_transfers_tenant_policy') THEN
    CREATE POLICY stock_transfers_tenant_policy ON public.stock_transfers
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
END $$;
