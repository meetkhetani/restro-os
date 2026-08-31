-- Restro OS: Phase 20 Security, RLS & Performance Indexes Migration
-- Migration: 20260831000015_production_performance_indexes.sql

-- 1. HIGH-FREQUENCY TENANT INDEXES
CREATE INDEX IF NOT EXISTS idx_branches_org_id ON public.branches (org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON public.memberships (user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_branch_memberships_user_branch ON public.branch_memberships (user_id, branch_id);

-- 2. POS & ORDERS PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_org_branch_status ON public.orders (org_id, branch_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- 3. INVENTORY & STOCK LEDGER INDEXES
CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch_ing ON public.branch_inventory (branch_id, ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_created ON public.stock_movements (branch_id, created_at DESC);

-- 4. PURCHASING & SUPPLIERS INDEXES
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_status ON public.purchase_orders (branch_id, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON public.suppliers (org_id);

-- 5. CRM & CUSTOMERS INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers (org_id);

-- 6. FINANCE & EXPENSES INDEXES
CREATE INDEX IF NOT EXISTS idx_expenses_branch_date ON public.expenses (branch_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_branch ON public.payments (order_id, branch_id);

-- 7. NOTIFICATIONS & AI INSIGHTS INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON public.notifications (org_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_org_branch ON public.ai_insights (org_id, branch_id, created_at DESC);
