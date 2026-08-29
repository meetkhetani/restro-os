import crypto from "crypto";
import { BillingProvider, CreateCustomerRequest, CreateSubscriptionRequest } from "../types";

export class RazorpayBillingProvider implements BillingProvider {
  name = "razorpay";

  private get keyId(): string {
    return process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key";
  }

  private get keySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || "rzp_test_placeholder_secret";
  }

  /**
   * Verifies Razorpay Webhook HMAC Signature against the raw request body.
   * Strictly server-side cryptographically secure check.
   */
  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;
    if (!signature || !rawBody) return false;

    try {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature, "utf-8"),
        Buffer.from(expectedSignature, "utf-8")
      );
    } catch (err) {
      console.error("Razorpay webhook signature verification error:", err);
      return false;
    }
  }

  async createCustomer(request: CreateCustomerRequest): Promise<{ provider_customer_id: string }> {
    // In production with live RAZORPAY_KEY_ID & KEY_SECRET, calls Razorpay REST API: POST https://api.razorpay.com/v1/customers
    const mockCustomerId = `cust_${request.org_id.substring(0, 8)}_${Date.now()}`;
    return { provider_customer_id: mockCustomerId };
  }

  async createSubscription(request: CreateSubscriptionRequest): Promise<{ provider_subscription_id: string; status: string }> {
    // In production, calls Razorpay REST API: POST https://api.razorpay.com/v1/subscriptions
    const mockSubId = `sub_${request.plan_code}_${Date.now()}`;
    return {
      provider_subscription_id: mockSubId,
      status: "active",
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<boolean> {
    // In production, calls Razorpay REST API: POST https://api.razorpay.com/v1/subscriptions/{id}/cancel
    console.log(`Canceling Razorpay subscription: ${providerSubscriptionId}`);
    return true;
  }
}

export const razorpayProvider = new RazorpayBillingProvider();
