"use client";

import * as React from "react";
import {
  Utensils,
  ShoppingBag,
  Truck,
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  DollarSign,
  CreditCard,
  QrCode,
  Users,
  CheckCircle2,
  X,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  Category,
  MenuItem,
  TableItem,
  Customer,
  OrderType,
  PaymentMethod,
  CartItem,
  ModifierOption,
  Order,
} from "@/domain/pos/types";
import { createOrder, processOrderPayment } from "@/domain/pos/actions";

interface PosTerminalViewProps {
  initialCategories: Category[];
  initialMenuItems: MenuItem[];
  initialTables: TableItem[];
  initialCustomers: Customer[];
  activeLocationName: string;
  activeRestaurantName: string;
}

export function PosTerminalView({
  initialCategories,
  initialMenuItems,
  initialTables,
  initialCustomers,
  activeLocationName,
  activeRestaurantName,
}: PosTerminalViewProps) {
  const { addToast } = useToast();

  // State
  const [categories] = React.useState<Category[]>(initialCategories);
  const [menuItems] = React.useState<MenuItem[]>(initialMenuItems);
  const [tables] = React.useState<TableItem[]>(initialTables);
  const [customers] = React.useState<Customer[]>(initialCustomers);

  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Order State
  const [orderType, setOrderType] = React.useState<OrderType>("dine_in");
  const [selectedTableId, setSelectedTableId] = React.useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = React.useState("");
  const [discountType, setDiscountType] = React.useState<"percentage" | "amount">("amount");
  const [discountValue, setDiscountValue] = React.useState<number>(0);

  // Modals
  const [activeItemForModifier, setActiveItemForModifier] = React.useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = React.useState<ModifierOption[]>([]);
  const [modifierNote, setModifierNote] = React.useState("");

  // Checkout & Payment Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cash");
  const [cashTendered, setCashTendered] = React.useState<string>("");
  const [transactionRef, setTransactionRef] = React.useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);
  const [completedOrder, setCompletedOrder] = React.useState<Order | null>(null);

  // Filtered Menu Items
  const filteredMenuItems = React.useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category_id === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Calculations
  const cartSubtotal = React.useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const modifierSum = item.modifiers.reduce((mSum, m) => mSum + m.price_delta, 0);
      return sum + (item.unit_price + modifierSum) * item.quantity;
    }, 0);
  }, [cartItems]);

  const discountAmount = React.useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === "percentage") {
      return (cartSubtotal * discountValue) / 100;
    }
    return Math.min(discountValue, cartSubtotal);
  }, [cartSubtotal, discountType, discountValue]);

  const cartTax = React.useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const modifierSum = item.modifiers.reduce((mSum, m) => mSum + m.price_delta, 0);
      const itemSubtotal = (item.unit_price + modifierSum) * item.quantity;
      return sum + (itemSubtotal * item.tax_rate) / 100;
    }, 0);
  }, [cartItems]);

  const cartTotal = React.useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount) + cartTax;
  }, [cartSubtotal, discountAmount, cartTax]);

  // Add Item to Cart
  const handleAddItem = (item: MenuItem) => {
    if (item.modifier_groups && item.modifier_groups.length > 0) {
      setActiveItemForModifier(item);
      setSelectedModifiers([]);
      setModifierNote("");
      return;
    }

    addToCart(item, [], "");
  };

  const addToCart = (item: MenuItem, modifiers: ModifierOption[], note: string) => {
    const cartId = `${item.id}-${Date.now()}`;
    const newCartItem: CartItem = {
      cart_id: cartId,
      menu_item_id: item.id,
      item_name: item.name,
      unit_price: item.price,
      quantity: 1,
      tax_rate: item.tax_rate,
      modifiers: modifiers.map((m) => ({
        modifier_option_id: m.id,
        modifier_name: m.name,
        price_delta: m.price_delta,
      })),
      notes: note,
    };

    setCartItems((prev) => [...prev, newCartItem]);
    setActiveItemForModifier(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cart_id === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cart_id !== cartId));
  };

  // Submit Order & Process Payment
  const handleConfirmCheckout = async () => {
    if (cartItems.length === 0) {
      addToast({
        type: "error",
        title: "Empty Cart",
        description: "Please add menu items to the cart before checkout.",
      });
      return;
    }

    setIsSubmittingOrder(true);

    try {
      // 1. Create Order Server Action
      const createRes = await createOrder({
        order_type: orderType,
        table_id: selectedTableId || undefined,
        customer_id: selectedCustomerId || undefined,
        items: cartItems.map((ci) => ({
          menu_item_id: ci.menu_item_id,
          item_name: ci.item_name,
          unit_price: ci.unit_price,
          quantity: ci.quantity,
          tax_rate: ci.tax_rate,
          notes: ci.notes,
          modifiers: ci.modifiers,
        })),
        discount_type: discountType,
        discount_value: discountValue,
        notes: orderNotes,
      });

      if (!createRes.success || !createRes.order) {
        addToast({
          type: "error",
          title: "Order Failed",
          description: createRes.error || "Failed to create order.",
        });
        setIsSubmittingOrder(false);
        return;
      }

      // 2. Process Payment Server Action
      const payRes = await processOrderPayment({
        order_id: createRes.order.id,
        amount: cartTotal,
        payment_method: paymentMethod,
        transaction_reference: transactionRef || undefined,
      });

      if (!payRes.success) {
        addToast({
          type: "error",
          title: "Payment Processing Failed",
          description: payRes.error || "Payment recording failed.",
        });
        setIsSubmittingOrder(false);
        return;
      }

      // Success
      setCompletedOrder(createRes.order);
      addToast({
        type: "success",
        title: "Order Completed",
        description: `Order ${createRes.order.order_number} successfully placed & paid ($${cartTotal.toFixed(2)}).`,
      });

      // Reset Cart & Form
      setCartItems([]);
      setOrderNotes("");
      setDiscountValue(0);
      setTransactionRef("");
      setCashTendered("");
      setIsCheckoutOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout error.";
      addToast({
        type: "error",
        title: "Checkout Error",
        description: msg,
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-background font-sans overflow-hidden">
      {/* POS Top Bar */}
      <header className="bg-surface border-b border-restro-200 px-4 py-2.5 flex items-center justify-between shadow-card">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-sm font-extrabold text-restro-900 tracking-tight">
              {activeRestaurantName} — <span className="text-brand-500">{activeLocationName}</span>
            </h2>
            <p className="text-[11px] font-medium text-restro-500 flex items-center gap-1">
              <Clock className="h-3 w-3 text-brand-500 inline" /> Scoped Tenant Branch POS Terminal
            </p>
          </div>

          {/* Order Type Tabs */}
          <div className="bg-restro-100 p-1 rounded-lg flex space-x-1">
            <button
              onClick={() => setOrderType("dine_in")}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                orderType === "dine_in"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-restro-600 hover:text-restro-900"
              }`}
            >
              <Utensils className="h-3.5 w-3.5 mr-1.5" /> Dine-In
            </button>
            <button
              onClick={() => setOrderType("takeaway")}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                orderType === "takeaway"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-restro-600 hover:text-restro-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Takeaway
            </button>
            <button
              onClick={() => setOrderType("delivery")}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                orderType === "delivery"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-restro-600 hover:text-restro-900"
              }`}
            >
              <Truck className="h-3.5 w-3.5 mr-1.5" /> Delivery
            </button>
          </div>
        </div>

        {/* Table & Customer Selectors */}
        <div className="flex items-center space-x-3">
          {orderType === "dine_in" && (
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-background border border-restro-300 rounded-md px-2.5 py-1.5 text-xs font-medium text-restro-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">-- Select Table --</option>
              {tables.map((tbl) => (
                <option key={tbl.id} value={tbl.id}>
                  Table {tbl.table_number} ({tbl.section}) [{tbl.status}]
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-background border border-restro-300 rounded-md px-2.5 py-1.5 text-xs font-medium text-restro-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Terminal Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Category Tabs & Menu Grid */}
        <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden border-r border-restro-200">
          {/* Search & Filter Bar */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-restro-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-restro-200 rounded-lg text-xs font-medium placeholder-restro-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-brand-500 text-white shadow-card"
                  : "bg-surface text-restro-700 hover:bg-restro-100 border border-restro-200"
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-brand-500 text-white shadow-card"
                    : "bg-surface text-restro-700 hover:bg-restro-100 border border-restro-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
            {filteredMenuItems.map((item) => (
              <Card
                key={item.id}
                onClick={() => handleAddItem(item)}
                className="p-3 bg-surface hover:shadow-dialog transition-all cursor-pointer border-restro-200 flex flex-col justify-between hover:border-brand-300 group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-extrabold text-restro-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {item.name}
                    </h4>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-restro-500 mt-1 line-clamp-2 leading-tight">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-600">
                    ${item.price.toFixed(2)}
                  </span>
                  <div className="h-6 w-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Card>
            ))}

            {filteredMenuItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center text-restro-400">
                <Utensils className="h-10 w-10 text-restro-300 mb-2" />
                <p className="text-xs font-semibold">No menu items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Order Cart & Summary */}
        <div className="w-96 bg-surface flex flex-col border-l border-restro-200 shadow-card">
          {/* Cart Header */}
          <div className="p-3.5 border-b border-restro-200 flex items-center justify-between bg-restro-50/50">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4 text-brand-500" />
              <h3 className="text-xs font-extrabold text-restro-900 tracking-tight">
                Current Order ({cartItems.reduce((acc, ci) => acc + ci.quantity, 0)})
              </h3>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCartItems([])}
                className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cartItems.map((item) => {
              const modifierSum = item.modifiers.reduce((mSum, m) => mSum + m.price_delta, 0);
              const itemTotal = (item.unit_price + modifierSum) * item.quantity;

              return (
                <div
                  key={item.cart_id}
                  className="p-2.5 bg-background rounded-lg border border-restro-200 flex flex-col space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-extrabold text-restro-900">{item.item_name}</h5>
                      <span className="text-[11px] font-semibold text-restro-500">
                        ${(item.unit_price + modifierSum).toFixed(2)} each
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-restro-900">
                      ${itemTotal.toFixed(2)}
                    </span>
                  </div>

                  {item.modifiers.length > 0 && (
                    <div className="text-[10px] text-restro-500 space-y-0.5 pl-2 border-l-2 border-brand-300">
                      {item.modifiers.map((m, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>+ {m.modifier_name}</span>
                          <span>+${m.price_delta.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantity Controls & Remove */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => removeItem(item.cart_id)}
                      className="text-restro-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center space-x-2 bg-surface rounded-md border border-restro-200 px-1 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.cart_id, -1)}
                        className="p-1 hover:bg-restro-100 rounded text-restro-700"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-extrabold text-restro-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cart_id, 1)}
                        className="p-1 hover:bg-restro-100 rounded text-restro-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {cartItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-restro-400 space-y-2">
                <ShoppingBag className="h-8 w-8 text-restro-300" />
                <p className="text-xs font-medium">Your order cart is empty</p>
                <p className="text-[11px] text-restro-400">Select items from the menu to add</p>
              </div>
            )}
          </div>

          {/* Financial Calculation Summary */}
          {cartItems.length > 0 && (
            <div className="p-3 border-t border-restro-200 bg-restro-50/30 space-y-2">
              {/* Discounts & Notes Toggle */}
              <div className="flex items-center justify-between text-xs pt-1 border-b border-restro-200 pb-2">
                <div className="flex items-center space-x-1.5">
                  <Tag className="h-3.5 w-3.5 text-brand-500" />
                  <span className="font-semibold text-restro-700">Discount</span>
                </div>
                <div className="flex items-center space-x-1">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "amount")}
                    className="text-[11px] border border-restro-300 rounded px-1 py-0.5 bg-background"
                  >
                    <option value="amount">$ Flat</option>
                    <option value="percentage">% Percent</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder="0"
                    className="w-14 text-right text-xs border border-restro-300 rounded px-1.5 py-0.5 bg-background font-semibold"
                  />
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-restro-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">${cartSubtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-restro-600">
                  <span>Tax (5%)</span>
                  <span className="font-semibold">${cartTax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-restro-900 pt-1.5 border-t border-restro-200">
                  <span>Total Amount</span>
                  <span className="text-brand-600">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full mt-2"
                size="default"
              >
                Proceed to Checkout (${cartTotal.toFixed(2)})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modifier Selection Modal */}
      {activeItemForModifier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-dialog max-w-md w-full p-5 space-y-4 border border-restro-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-restro-900">
                  Customize {activeItemForModifier.name}
                </h3>
                <p className="text-xs text-restro-500">Base Price: ${activeItemForModifier.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setActiveItemForModifier(null)}
                className="text-restro-400 hover:text-restro-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {activeItemForModifier.modifier_groups?.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <h5 className="text-xs font-extrabold text-restro-800">{group.name}</h5>
                  <div className="space-y-1">
                    {group.options.map((opt) => {
                      const isSelected = selectedModifiers.some((m) => m.id === opt.id);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedModifiers((prev) => prev.filter((m) => m.id !== opt.id));
                            } else {
                              setSelectedModifiers((prev) => [...prev, opt]);
                            }
                          }}
                          className={`flex justify-between items-center p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand-500 bg-brand-50 text-brand-900 font-semibold"
                              : "border-restro-200 hover:bg-restro-50 text-restro-700"
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span>+${opt.price_delta.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Input
              label="Item Note"
              placeholder="e.g. Extra spicy, no onions"
              value={modifierNote}
              onChange={(e) => setModifierNote(e.target.value)}
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-restro-200">
              <Button variant="outline" size="sm" onClick={() => setActiveItemForModifier(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => addToCart(activeItemForModifier, selectedModifiers, modifierNote)}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout & Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-dialog max-w-lg w-full p-5 space-y-4 border border-restro-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-restro-900">
                  Payment Checkout — Order Total: ${cartTotal.toFixed(2)}
                </h3>
                <p className="text-xs text-restro-500">Select payment method and complete order</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-restro-400 hover:text-restro-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`p-3 rounded-xl border flex flex-col items-center space-y-1 text-xs font-extrabold transition-all ${
                  paymentMethod === "cash"
                    ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm"
                    : "border-restro-200 hover:bg-restro-50 text-restro-700"
                }`}
              >
                <DollarSign className="h-5 w-5" />
                <span>Cash Register</span>
              </button>

              <button
                onClick={() => setPaymentMethod("card")}
                className={`p-3 rounded-xl border flex flex-col items-center space-y-1 text-xs font-extrabold transition-all ${
                  paymentMethod === "card"
                    ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm"
                    : "border-restro-200 hover:bg-restro-50 text-restro-700"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>POS Card Terminal</span>
              </button>

              <button
                onClick={() => setPaymentMethod("upi")}
                className={`p-3 rounded-xl border flex flex-col items-center space-y-1 text-xs font-extrabold transition-all ${
                  paymentMethod === "upi"
                    ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm"
                    : "border-restro-200 hover:bg-restro-50 text-restro-700"
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span>UPI / QR</span>
              </button>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === "cash" && (
              <div className="bg-restro-50 p-3 rounded-lg space-y-2 border border-restro-200">
                <Input
                  label="Cash Tendered Amount"
                  type="number"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                />
                {Number(cashTendered) > 0 && (
                  <div className="flex justify-between items-center text-xs font-extrabold pt-1">
                    <span className="text-restro-600">Change Due:</span>
                    <span
                      className={
                        Number(cashTendered) >= cartTotal ? "text-emerald-600" : "text-red-500"
                      }
                    >
                      ${Math.max(0, Number(cashTendered) - cartTotal).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Transaction Reference Input */}
            <Input
              label="Transaction Reference / Note (Optional)"
              placeholder="e.g. Receipt #, Bank approval code"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-restro-200">
              <Button variant="outline" size="sm" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isSubmittingOrder}
                disabled={isSubmittingOrder}
                onClick={handleConfirmCheckout}
              >
                Complete Payment (${cartTotal.toFixed(2)})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Receipt Confirmation Modal */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-dialog max-w-sm w-full p-5 space-y-4 border border-restro-200 text-center animate-in fade-in zoom-in-95">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-restro-900">
                Order {completedOrder.order_number} Paid!
              </h3>
              <p className="text-xs text-restro-500 mt-1">
                Order sent to Kitchen Display System (KDS) via Realtime.
              </p>
            </div>
            <Button size="sm" className="w-full" onClick={() => setCompletedOrder(null)}>
              Done / Next Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
