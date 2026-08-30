-- Restro OS: Phase 13 Financial Operations Migration
-- Migration: 20260830000010_financial_operations.sql

-- 1. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Rent', 'Utilities', 'Supplies', 'Payroll', 'Marketing', 'Repairs', 'Other')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT,
  notes TEXT,
  attachment_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ENSURE BRANCH_ID ON PAYMENTS TABLE IF NOT PRESENT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. RLS SECURITY POLICIES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'expenses_tenant_policy') THEN
    CREATE POLICY expenses_tenant_policy ON public.expenses
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_tenant_policy') THEN
    CREATE POLICY payments_tenant_policy ON public.payments
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
END $$;
