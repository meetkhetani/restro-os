-- Restro OS: Phase 04 Multi-Tenant Point of Sale (POS) Schema Migration
-- Migration: 20260830000001_multi_tenant_pos.sql

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (tax_rate >= 0), -- percentage
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MODIFIER GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_selection INTEGER NOT NULL DEFAULT 0,
  max_selection INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. MODIFIER OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.modifier_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MENU ITEM MODIFIER GROUPS JUNCTION
CREATE TABLE IF NOT EXISTS public.menu_item_modifier_groups (
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, modifier_group_id)
);

-- 6. TABLES TABLE (Dine-in Floor Management)
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  section TEXT DEFAULT 'Main Floor',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, table_number)
);

-- 7. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  discount_type TEXT NOT NULL DEFAULT 'amount' CHECK (discount_type IN ('percentage', 'amount')),
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_value >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ORDER ITEM MODIFIERS TABLE
CREATE TABLE IF NOT EXISTS public.order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  modifier_option_id UUID REFERENCES public.modifier_options(id) ON DELETE SET NULL,
  modifier_name TEXT NOT NULL,
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ORDER EVENTS TABLE (Audit Log & Status History)
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'digital_wallet', 'custom')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_reference TEXT,
  gateway_provider TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. INDEXES FOR HIGH-PERFORMANCE POS LOOKUPS
CREATE INDEX IF NOT EXISTS idx_categories_org_loc ON public.categories(org_id, location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_org_loc ON public.menu_items(org_id, location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_tables_org_loc ON public.tables(org_id, location_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON public.customers(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_loc ON public.orders(org_id, location_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_item_id ON public.order_item_modifiers(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_loc ON public.payments(org_id, location_id);

-- 14. UPDATED_AT TRIGGERS
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_modifier_groups_updated_at BEFORE UPDATE ON public.modifier_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_modifier_options_updated_at BEFORE UPDATE ON public.modifier_options FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- 15. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "Categories viewable by org members" ON public.categories
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));
CREATE POLICY "Categories manageable by org members" ON public.categories
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Menu Items RLS
CREATE POLICY "Menu items viewable by org members" ON public.menu_items
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));
CREATE POLICY "Menu items manageable by org members" ON public.menu_items
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Modifier Groups RLS
CREATE POLICY "Modifier groups viewable by org members" ON public.modifier_groups
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));
CREATE POLICY "Modifier groups manageable by org members" ON public.modifier_groups
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Modifier Options RLS
CREATE POLICY "Modifier options viewable by authenticated users" ON public.modifier_options
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Modifier options manageable by authenticated users" ON public.modifier_options
  FOR ALL USING (auth.role() = 'authenticated');

-- Menu Item Modifier Groups RLS
CREATE POLICY "Menu item modifier groups viewable by authenticated" ON public.menu_item_modifier_groups
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Menu item modifier groups manageable by authenticated" ON public.menu_item_modifier_groups
  FOR ALL USING (auth.role() = 'authenticated');

-- Tables RLS
CREATE POLICY "Tables viewable by org members" ON public.tables
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));
CREATE POLICY "Tables manageable by org members" ON public.tables
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Customers RLS
CREATE POLICY "Customers viewable by org members" ON public.customers
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));
CREATE POLICY "Customers manageable by org members" ON public.customers
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Orders RLS
CREATE POLICY "Orders viewable by org members" ON public.orders
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));
CREATE POLICY "Orders manageable by org members" ON public.orders
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- Order Items RLS
CREATE POLICY "Order items viewable by authenticated users" ON public.order_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Order items manageable by authenticated users" ON public.order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Order Item Modifiers RLS
CREATE POLICY "Order item modifiers viewable by authenticated users" ON public.order_item_modifiers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Order item modifiers manageable by authenticated users" ON public.order_item_modifiers
  FOR ALL USING (auth.role() = 'authenticated');

-- Order Events RLS
CREATE POLICY "Order events viewable by authenticated users" ON public.order_events
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Order events manageable by authenticated users" ON public.order_events
  FOR ALL USING (auth.role() = 'authenticated');

-- Payments RLS
CREATE POLICY "Payments viewable by org members" ON public.payments
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));
CREATE POLICY "Payments manageable by org members" ON public.payments
  FOR ALL USING (org_id IN (SELECT org_id FROM public.auth_user_org_ids()));

-- 16. SUPABASE REALTIME PUBLICATION ENABLEMENT
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
