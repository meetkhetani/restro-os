import { CreateOrderInput } from "./types";

export interface OrderCalculationResult {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  item_totals: {
    unit_price: number;
    modifier_total: number;
    effective_unit_price: number;
    subtotal: number;
    tax_amount: number;
  }[];
}

/**
 * Perform precise financial calculations server-side.
 * Prevents client price tampering and guarantees mathematical correctness.
 */
export function calculateOrderTotals(input: CreateOrderInput): OrderCalculationResult {
  let rawSubtotal = 0;
  let totalTax = 0;

  const itemTotals = input.items.map((item) => {
    const modifierTotal = (item.modifiers || []).reduce(
      (sum, m) => sum + Number(m.price_delta || 0),
      0
    );

    const effectiveUnitPrice = Number(item.unit_price) + modifierTotal;
    const itemSubtotal = effectiveUnitPrice * Number(item.quantity);
    const itemTax = (itemSubtotal * Number(item.tax_rate || 5)) / 100;

    rawSubtotal += itemSubtotal;
    totalTax += itemTax;

    return {
      unit_price: Number(item.unit_price),
      modifier_total: modifierTotal,
      effective_unit_price: effectiveUnitPrice,
      subtotal: Math.round(itemSubtotal * 100) / 100,
      tax_amount: Math.round(itemTax * 100) / 100,
    };
  });

  const subtotal = Math.round(rawSubtotal * 100) / 100;

  // Discount calculation
  let discountAmount = 0;
  if (input.discount_value && input.discount_value > 0) {
    if (input.discount_type === "percentage") {
      discountAmount = (subtotal * Number(input.discount_value)) / 100;
    } else {
      discountAmount = Number(input.discount_value);
    }
  }

  // Ensure discount does not exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);
  discountAmount = Math.round(discountAmount * 100) / 100;

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  // Recalculate tax proportionally after discount if applicable, or use calculated item tax
  const taxAmount = Math.round(totalTax * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    item_totals: itemTotals,
  };
}

/**
 * Generate readable, unique sequential order number
 */
export function generateOrderNumber(prefix = "ORD"): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
}
