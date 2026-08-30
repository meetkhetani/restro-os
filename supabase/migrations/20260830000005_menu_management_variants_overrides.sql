-- Restro OS: Phase 08 Menu Management Schema Enhancements
-- Migration: 20260830000005_menu_management_variants_overrides.sql

-- 1. ADD BRANCH_ID TO CATEGORIES & MENU_ITEMS IF NOT PRESENT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.menu_items ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. ITEM VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BRANCH ITEM OVERRIDES TABLE (Multi-Branch Pricing & Availability Overrides)
CREATE TABLE IF NOT EXISTS public.branch_item_overrides (
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  price_override NUMERIC(10, 2),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (menu_item_id, branch_id)
);

-- 4. RLS POLICIES
ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_item_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'item_variants_tenant_policy'
  ) THEN
    CREATE POLICY item_variants_tenant_policy ON public.item_variants
      FOR ALL USING (
        menu_item_id IN (
          SELECT id FROM public.menu_items WHERE org_id IN (
            SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'branch_item_overrides_tenant_policy'
  ) THEN
    CREATE POLICY branch_item_overrides_tenant_policy ON public.branch_item_overrides
      FOR ALL USING (
        branch_id IN (
          SELECT id FROM public.branches WHERE org_id IN (
            SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;
