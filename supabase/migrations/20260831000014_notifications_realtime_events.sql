-- Restro OS: Phase 19 Notifications, Billing Events & Realtime Migration
-- Migration: 20260831000014_notifications_realtime_events.sql

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_order', 'low_stock', 'kitchen_delay', 'payment_issue', 'subscription_issue', 'ai_insight', 'staff_event', 'system_event')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS SECURITY POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_tenant_policy') THEN
    CREATE POLICY notifications_tenant_policy ON public.notifications
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
END $$;
