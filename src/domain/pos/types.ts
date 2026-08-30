export type OrderType = "dine_in" | "takeaway" | "delivery";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type DiscountType = "percentage" | "amount";

export type PaymentMethod = "cash" | "card" | "upi" | "digital_wallet" | "custom";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Category {
  id: string;
  org_id: string;
  location_id?: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModifierOption {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
}

export interface ModifierGroup {
  id: string;
  org_id: string;
  name: string;
  min_selection: number;
  max_selection: number;
  is_required: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  org_id: string;
  location_id?: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  tax_rate: number;
  image_url?: string;
  is_available: boolean;
  modifier_groups?: ModifierGroup[];
  created_at: string;
  updated_at: string;
}

export interface TableItem {
  id: string;
  org_id: string;
  location_id: string;
  table_number: string;
  capacity: number;
  section: string;
  status: "available" | "occupied" | "reserved" | "cleaning";
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  org_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: Record<string, unknown>;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemModifier {
  modifier_option_id?: string;
  modifier_name: string;
  price_delta: number;
}

export interface CartItem {
  cart_id: string; // client temporary ID
  menu_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  tax_rate: number;
  modifiers: CartItemModifier[];
  notes?: string;
}

export interface CreateOrderInput {
  order_type: OrderType;
  table_id?: string;
  customer_id?: string;
  items: {
    menu_item_id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    tax_rate: number;
    notes?: string;
    modifiers?: {
      modifier_option_id?: string;
      modifier_name: string;
      price_delta: number;
    }[];
  }[];
  discount_type?: DiscountType;
  discount_value?: number;
  notes?: string;
}

export interface ProcessPaymentInput {
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  gateway_provider?: string;
}

export interface OrderItemModifier {
  id: string;
  order_item_id: string;
  modifier_option_id?: string;
  modifier_name: string;
  price_delta: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  tax_rate: number;
  subtotal: number;
  notes?: string;
  modifiers?: OrderItemModifier[];
}

export interface OrderEvent {
  id: string;
  order_id: string;
  status: string;
  actor_id?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  actor?: {
    full_name: string;
    email: string;
  };
}

export interface Payment {
  id: string;
  org_id: string;
  location_id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_reference?: string;
  gateway_provider: string;
  metadata?: Record<string, unknown>;
  processed_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  org_id: string;
  location_id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  table_id?: string;
  customer_id?: string;
  subtotal: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  table?: TableItem;
  customer?: Customer;
  payments?: Payment[];
  events?: OrderEvent[];
  location_name?: string;
}

export interface OrderQueryFilters {
  search?: string;
  order_type?: OrderType | "all";
  status?: OrderStatus | "all";
  branch_id?: string;
  date_range?: "today" | "yesterday" | "7days" | "30days" | "all";
  page?: number;
  page_size?: number;
}

export interface PaginatedOrdersResult {
  orders: Order[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  stats: {
    total: number;
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
    total_revenue: number;
  };
}

export interface CancelOrderInput {
  order_id: string;
  reason: string;
}
