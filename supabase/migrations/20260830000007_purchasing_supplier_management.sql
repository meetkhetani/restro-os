-- Restro OS: Phase 10 Purchasing & Supplier Management Migration
-- Migration: 20260830000007_purchasing_supplier_management.sql

-- 1. SUPPLIERS VENDOR CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'partially_received', 'received', 'cancelled')),
  expected_delivery_date TIMESTAMPTZ,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, po_number)
);

-- 3. PURCHASE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ordered_qty NUMERIC(10, 2) NOT NULL CHECK (ordered_qty > 0),
  received_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PURCHASE RECEIVINGS TABLE (Receiving Logs)
CREATE TABLE IF NOT EXISTS public.purchase_receivings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  po_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  quantity_received NUMERIC(10, 2) NOT NULL CHECK (quantity_received > 0),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT
);

-- 5. RLS SECURITY POLICIES
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receivings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'suppliers_tenant_policy') THEN
    CREATE POLICY suppliers_tenant_policy ON public.suppliers
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_orders_tenant_policy') THEN
    CREATE POLICY purchase_orders_tenant_policy ON public.purchase_orders
      FOR ALL USING (org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'po_items_tenant_policy') THEN
    CREATE POLICY po_items_tenant_policy ON public.purchase_order_items
      FOR ALL USING (
        purchase_order_id IN (
          SELECT id FROM public.purchase_orders WHERE org_id IN (
            SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'po_receivings_tenant_policy') THEN
    CREATE POLICY po_receivings_tenant_policy ON public.purchase_receivings
      FOR ALL USING (
        purchase_order_id IN (
          SELECT id FROM public.purchase_orders WHERE org_id IN (
            SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;
