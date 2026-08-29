-- Restro OS: Phase 02 SaaS Core, Entitlements & Billing Schema Migration
-- Migration: 20260830000000_saas_billing_entitlements.sql

-- 1. PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- 'standard' | 'multi_branch'
  name TEXT NOT NULL,
  description TEXT,
  max_branches INTEGER NOT NULL DEFAULT 1, -- 1 for Standard, -1 for Unlimited
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PLAN ENTITLEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  entitlement_value JSONB NOT NULL DEFAULT 'true'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, entitlement_key)
);

-- 3. BILLING CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_customer_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  billing_address JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BILLING EVENTS TABLE (Webhooks Idempotency Log)
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id ON public.subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_org_id ON public.billing_customers(org_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_id ON public.billing_events(event_id);

-- 7. UPDATED_AT TRIGGERS
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_plan_entitlements_updated_at BEFORE UPDATE ON public.plan_entitlements FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_billing_customers_updated_at BEFORE UPDATE ON public.billing_customers FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Plans & Entitlements are readable by all authenticated users
CREATE POLICY "Plans readable by authenticated users" ON public.plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Plan entitlements readable by authenticated users" ON public.plan_entitlements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Subscriptions viewable by org members
CREATE POLICY "Subscriptions viewable by org members" ON public.subscriptions
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Billing Customers viewable by org members
CREATE POLICY "Billing customers viewable by org members" ON public.billing_customers
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Billing events viewable by org admins or service role
CREATE POLICY "Billing events viewable by authenticated org admins" ON public.billing_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- 9. INITIAL SEED PLANS & ENTITLEMENTS
INSERT INTO public.plans (code, name, description, max_branches) VALUES
  ('standard', 'Standard Plan', 'Complete single-location restaurant operations with single-branch analytics', 1),
  ('multi_branch', 'Multi-Branch Plan', 'Multi-location operations, central management, and cross-branch analytics', -1)
ON CONFLICT (code) DO NOTHING;

-- Seed Standard Entitlements
WITH standard_plan AS (SELECT id FROM public.plans WHERE code = 'standard')
INSERT INTO public.plan_entitlements (plan_id, entitlement_key, entitlement_value)
SELECT id, key, val::jsonb FROM standard_plan, (VALUES
  ('branches.max', '1'),
  ('analytics.cross_branch', 'false'),
  ('analytics.single_branch', 'true'),
  ('pos.enabled', 'true'),
  ('inventory.enabled', 'true'),
  ('staff.multi_branch', 'false'),
  ('ai.assistant', 'true')
) AS t(key, val)
ON CONFLICT (plan_id, entitlement_key) DO UPDATE SET entitlement_value = EXCLUDED.entitlement_value;

-- Seed Multi-Branch Entitlements
WITH multi_plan AS (SELECT id FROM public.plans WHERE code = 'multi_branch')
INSERT INTO public.plan_entitlements (plan_id, entitlement_key, entitlement_value)
SELECT id, key, val::jsonb FROM multi_plan, (VALUES
  ('branches.max', '-1'),
  ('analytics.cross_branch', 'true'),
  ('analytics.single_branch', 'true'),
  ('pos.enabled', 'true'),
  ('inventory.enabled', 'true'),
  ('staff.multi_branch', 'true'),
  ('ai.assistant', 'true')
) AS t(key, val)
ON CONFLICT (plan_id, entitlement_key) DO UPDATE SET entitlement_value = EXCLUDED.entitlement_value;
