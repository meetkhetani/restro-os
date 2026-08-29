export interface BillingCustomer {
  id: string;
  org_id: string;
  provider: string;
  provider_customer_id: string;
  email?: string;
  name?: string;
  billing_address?: Record<string, unknown>;
}

export interface CreateCustomerRequest {
  org_id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CreateSubscriptionRequest {
  org_id: string;
  plan_code: "standard" | "multi_branch";
  customer_id: string;
}

export interface WebhookEventPayload {
  event_id: string;
  event_type: string;
  provider: string;
  payload: Record<string, unknown>;
  signature?: string;
}

export interface BillingProvider {
  name: string;
  createCustomer(request: CreateCustomerRequest): Promise<{ provider_customer_id: string }>;
  createSubscription(request: CreateSubscriptionRequest): Promise<{ provider_subscription_id: string; status: string }>;
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
  cancelSubscription(providerSubscriptionId: string): Promise<boolean>;
}
