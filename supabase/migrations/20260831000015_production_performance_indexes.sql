-- Restro OS: Phase 20 Security, RLS & Performance Indexes Migration
-- Migration: 20260831000015_production_performance_indexes.sql

-- 1. HIGH-FREQUENCY TENANT INDEXES
CREATE INDEX IF NOT EXISTS idx_branches_org_id ON public.branches (org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON public.memberships (user_id, org_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branch_memberships') THEN
    CREATE INDEX IF NOT EXISTS idx_branch_memberships_user_branch ON public.branch_memberships (user_id, branch_id);
  END IF;
END $$;

-- 2. POS & ORDERS PERFORMANCE INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'branch_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_org_branch_status ON public.orders (org_id, branch_id, status);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'location_id') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_org_loc_status ON public.orders (org_id, location_id, status);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- 3. INVENTORY & STOCK LEDGER INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branch_inventory') THEN
    CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch_ing ON public.branch_inventory (branch_id, ingredient_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') THEN
    CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_created ON public.stock_movements (branch_id, created_at DESC);
  END IF;
END $$;

-- 4. PURCHASING & SUPPLIERS INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_status ON public.purchase_orders (branch_id, status);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON public.suppliers (org_id);
  END IF;
END $$;

-- 5. CRM & CUSTOMERS INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers (org_id);
  END IF;
END $$;

-- 6. FINANCE & EXPENSES INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_branch_date ON public.expenses (branch_id, expense_date DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'branch_id') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_order_branch ON public.payments (order_id, branch_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'location_id') THEN
    CREATE INDEX IF NOT EXISTS idx_payments_order_loc ON public.payments (order_id, location_id);
  END IF;
END $$;

-- 7. NOTIFICATIONS & AI INSIGHTS INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON public.notifications (org_id, is_read, created_at DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_insights_org_branch ON public.ai_insights (org_id, branch_id, created_at DESC);
  END IF;
END $$;
