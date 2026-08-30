-- Restro OS: Phase 16 AI Insights, Forecasting & Automation Migration
-- Migration: 20260831000011_ai_insights_forecasting.sql

-- 1. AI INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('sales', 'inventory', 'product', 'purchasing', 'expense_anomaly', 'customer', 'branch_performance')),
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  impact_level TEXT NOT NULL CHECK (impact_level IN ('high', 'medium', 'low')),
  action_recommendation TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS SECURITY POLICIES
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_insights_tenant_policy') THEN
    CREATE POLICY ai_insights_tenant_policy ON public.ai_insights
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
END $$;
