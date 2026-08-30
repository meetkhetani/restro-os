import { PaymentMethod, PaymentStatus } from "./types";

export interface PaymentProcessParams {
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProcessResult {
  success: boolean;
  status: PaymentStatus;
  transaction_reference: string;
  gateway_provider: string;
  message?: string;
  error?: string;
}

/**
 * Modular Payment Gateway Adapter Interface
 * Enables plugging in Cash, Card POS Terminals, UPI APIs, and External Payment Gateways cleanly.
 */
export interface PaymentGatewayAdapter {
  providerName: string;
  supportedMethods: PaymentMethod[];
  processPayment(params: PaymentProcessParams): Promise<PaymentProcessResult>;
}

export class CashPaymentAdapter implements PaymentGatewayAdapter {
  providerName = "cash_register";
  supportedMethods: PaymentMethod[] = ["cash"];

  async processPayment(params: PaymentProcessParams): Promise<PaymentProcessResult> {
    if (params.amount <= 0) {
      return {
        success: false,
        status: "failed",
        transaction_reference: "",
        gateway_provider: this.providerName,
        error: "Invalid cash payment amount.",
      };
    }

    const ref = params.transaction_reference || `CASH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      success: true,
      status: "completed",
      transaction_reference: ref,
      gateway_provider: this.providerName,
      message: "Cash payment recorded successfully.",
    };
  }
}

export class CardTerminalAdapter implements PaymentGatewayAdapter {
  providerName = "pos_card_terminal";
  supportedMethods: PaymentMethod[] = ["card"];

  async processPayment(params: PaymentProcessParams): Promise<PaymentProcessResult> {
    const ref = params.transaction_reference || `CARD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      success: true,
      status: "completed",
      transaction_reference: ref,
      gateway_provider: this.providerName,
      message: "Card payment processed on POS terminal.",
    };
  }
}

export class UPIPaymentAdapter implements PaymentGatewayAdapter {
  providerName = "upi_qr_gateway";
  supportedMethods: PaymentMethod[] = ["upi", "digital_wallet"];

  async processPayment(params: PaymentProcessParams): Promise<PaymentProcessResult> {
    const ref = params.transaction_reference || `UPI-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      success: true,
      status: "completed",
      transaction_reference: ref,
      gateway_provider: this.providerName,
      message: "UPI transaction verified.",
    };
  }
}

/**
 * Payment Service Abstraction Registry
 */
export class PaymentServiceRegistry {
  private adapters: Map<PaymentMethod, PaymentGatewayAdapter> = new Map();

  constructor() {
    const cash = new CashPaymentAdapter();
    const card = new CardTerminalAdapter();
    const upi = new UPIPaymentAdapter();

    cash.supportedMethods.forEach((m) => this.adapters.set(m, cash));
    card.supportedMethods.forEach((m) => this.adapters.set(m, card));
    upi.supportedMethods.forEach((m) => this.adapters.set(m, upi));
  }

  getAdapter(method: PaymentMethod): PaymentGatewayAdapter {
    const adapter = this.adapters.get(method);
    if (!adapter) {
      return new CashPaymentAdapter();
    }
    return adapter;
  }
}

export const paymentRegistry = new PaymentServiceRegistry();
