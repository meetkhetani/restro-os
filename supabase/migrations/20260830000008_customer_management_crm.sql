-- Restro OS: Phase 11 Customer Management CRM Migration
-- Migration: 20260830000008_customer_management_crm.sql

-- 1. ADD PREFERENCES, NOTES & LAST VISIT TO CUSTOMERS TABLE IF NOT PRESENT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN preferences JSONB DEFAULT '{"dietary": [], "favorite_items": [], "seating": null}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_visit_at'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN last_visit_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. CUSTOMER BRANCH ACTIVITY BREAKDOWN TABLE
CREATE TABLE IF NOT EXISTS public.customer_branch_activity (
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  visit_count INTEGER NOT NULL DEFAULT 1,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, branch_id)
);

-- 3. RLS SECURITY POLICIES
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_branch_activity ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'customers_tenant_policy') THEN
    CREATE POLICY customers_tenant_policy ON public.customers
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'customer_branch_activity_policy') THEN
    CREATE POLICY customer_branch_activity_policy ON public.customer_branch_activity
      FOR ALL USING (
        customer_id IN (
          SELECT id FROM public.customers WHERE org_id IN (
            SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;
