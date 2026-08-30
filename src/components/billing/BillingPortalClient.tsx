"use client";

import * as React from "react";
import {
  CreditCard,
  Check,
  Zap,
  ArrowRight,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { BILLING_PLANS_CONFIG } from "@/domain/billing/config";
import {
  BillingOverviewData,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  safeDowngradeToStandard,
} from "@/domain/billing/actions";

interface BillingPortalClientProps {
  initialOverview: BillingOverviewData | null;
  onRefresh: () => void;
}

export type PaymentLifecycleState =
  | "IDLE"
  | "CREATING_ORDER"
  | "OPENING_CHECKOUT"
  | "VERIFYING_PAYMENT"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export type PaymentErrorCode =
  | "ORDER_CREATION_FAILED"
  | "CHECKOUT_CANCELLED"
  | "PAYMENT_FAILED"
  | "SIGNATURE_VERIFICATION_FAILED"
  | "SUBSCRIPTION_UPDATE_FAILED"
  | "RAZORPAY_CREDENTIALS_MISSING"
  | "NETWORK_ERROR";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function BillingPortalClient({
  initialOverview,
  onRefresh,
}: BillingPortalClientProps) {
  const { addToast } = useToast();

  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("monthly");
  const [paymentState, setPaymentState] = React.useState<PaymentLifecycleState>("IDLE");
  const [errorCode, setErrorCode] = React.useState<PaymentErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  // Load Razorpay Checkout SDK Script
  React.useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (!initialOverview) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
        <CreditCard className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="text-sm font-bold text-gray-700">Billing details currently unavailable.</p>
      </div>
    );
  }

  const {
    currentPlanCode,
    subscriptionStatus,
    renewalDate,
    activeBranchCount,
    maxBranches,
    invoices,
    razorpayKeyId,
    isCredentialsPresent,
  } = initialOverview;

  const standardConfig = BILLING_PLANS_CONFIG.standard;
  const multiBranchConfig = BILLING_PLANS_CONFIG.multi_branch;

  const handleRazorpayCheckout = async (planCode: "standard" | "multi_branch") => {
    // Prevent duplicate clicks if already processing
    if (paymentState === "CREATING_ORDER" || paymentState === "OPENING_CHECKOUT" || paymentState === "VERIFYING_PAYMENT") {
      return;
    }

    setPaymentState("CREATING_ORDER");
    setErrorCode(null);
    setErrorMessage("");

    console.log(`[CLIENT_PAYMENT_LOG] STEP 1: PAYMENT_START planCode=${planCode}`);

    // Step 2-7: Server validates user, calculates amount, and creates Razorpay Order ID via Razorpay Orders API
    const orderRes = await createRazorpayOrder(planCode, billingCycle);

    if (!orderRes.success || !orderRes.orderId) {
      const errCode = (orderRes.errorCode as PaymentErrorCode) || "ORDER_CREATION_FAILED";
      const errText = orderRes.error || "Could not create Razorpay Order on server.";
      setPaymentState("FAILED");
      setErrorCode(errCode);
      setErrorMessage(errText);
      console.error(`[CLIENT_PAYMENT_LOG] STEP 2 FAILED: ${errCode} - ${errText}`);
      addToast({ type: "error", title: "Order Creation Failed", description: errText });
      return;
    }

    console.log(`[CLIENT_PAYMENT_LOG] STEP 2: ORDER_CREATED orderId=${orderRes.orderId}`);
    setPaymentState("OPENING_CHECKOUT");

    const activeKeyId = orderRes.keyId || razorpayKeyId;

    // Step 8: Frontend configures Razorpay Checkout with server-provided order_id
    const options = {
      key: activeKeyId,
      amount: orderRes.amount,
      currency: orderRes.currency || "INR",
      name: "Restro OS SaaS",
      description: `${planCode === "multi_branch" ? "Multi-Branch" : "Standard"} Plan Subscription (${billingCycle})`,
      image: "https://restro-os-nine.vercel.app/logo.png",
      order_id: orderRes.orderId, // OFFICIAL SERVER CREATED RAZORPAY ORDER ID!
      prefill: {
        email: orderRes.userEmail,
        contact: "9876543210",
      },
      theme: {
        color: "#e11d48",
      },
      // Step 9-10: Razorpay payment callback
      handler: async (response: {
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }) => {
        console.log(`[CLIENT_PAYMENT_LOG] STEP 3: CHECKOUT_SUCCESS paymentId=${response.razorpay_payment_id}`);
        setPaymentState("VERIFYING_PAYMENT");

        if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
          setPaymentState("FAILED");
          setErrorCode("PAYMENT_FAILED");
          setErrorMessage("Razorpay callback returned incomplete payment proof.");
          return;
        }

        // Step 11-13: Server Signature Verification
        const verifyRes = await verifyRazorpayPaymentSignature({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          planCode,
        });

        if (verifyRes.success) {
          console.log(`[CLIENT_PAYMENT_LOG] STEP 4: VERIFICATION_SUCCESS planCode=${planCode}`);
          setPaymentState("SUCCESS");
          addToast({
            type: "success",
            title: "Subscription Verified & Active!",
            description: `Unlocked ${planCode === "multi_branch" ? "Multi-Branch" : "Standard"} Plan entitlements.`,
          });
          onRefresh();
        } else {
          const errCode = (verifyRes.errorCode as PaymentErrorCode) || "SIGNATURE_VERIFICATION_FAILED";
          const errText = verifyRes.error || "Payment signature verification failed.";
          console.error(`[CLIENT_PAYMENT_LOG] STEP 4 FAILED: ${errCode} - ${errText}`);
          setPaymentState("FAILED");
          setErrorCode(errCode);
          setErrorMessage(errText);
          addToast({ type: "error", title: "Signature Verification Failed", description: errText });
        }
      },
      modal: {
        ondismiss: () => {
          console.log("[CLIENT_PAYMENT_LOG] CHECKOUT_CANCELLED by user.");
          setPaymentState("CANCELLED");
          setErrorCode("CHECKOUT_CANCELLED");
          setErrorMessage("Payment checkout window was closed by the user.");
        },
      },
    };

    try {
      if (typeof window !== "undefined" && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setPaymentState("FAILED");
        setErrorCode("NETWORK_ERROR");
        setErrorMessage("Razorpay Checkout SDK script was not loaded properly.");
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Razorpay Checkout initialization error";
      console.error(`[CLIENT_PAYMENT_LOG] CHECKOUT_LAUNCH_FAILED: ${errText}`);
      setPaymentState("FAILED");
      setErrorCode("PAYMENT_FAILED");
      setErrorMessage(errText);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm("Are you sure you want to downgrade to the Standard Plan? Existing branch data will be safely preserved.")) return;

    setPaymentState("CREATING_ORDER");
    const res = await safeDowngradeToStandard();
    setPaymentState("IDLE");

    if (res.success) {
      addToast({
        type: "success",
        title: "Downgraded to Standard Plan",
        description: "Branch limits updated to 1 active store. Existing data preserved.",
      });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Downgrade Failed", description: res.error });
    }
  };

  const isProcessing =
    paymentState === "CREATING_ORDER" ||
    paymentState === "OPENING_CHECKOUT" ||
    paymentState === "VERIFYING_PAYMENT";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-brand-500" />
            SaaS Subscriptions & Billing Portal
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              Razorpay Standard Checkout
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Manage organization plan subscription, billing cycle, branch capacity limits, and invoices.
          </p>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-xl border">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              billingCycle === "annual" ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Annual Billing <span className="bg-amber-400 text-gray-950 text-[9px] px-1.5 py-0.5 rounded font-black">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Payment Lifecycle Status Banners */}
      {paymentState !== "IDLE" && (
        <Card className="p-4 rounded-xl border shadow-sm space-y-2">
          {isProcessing && (
            <div className="flex items-center space-x-3 text-brand-700 bg-brand-50/50 p-3 rounded-lg border border-brand-200">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold">
                  {paymentState === "CREATING_ORDER" && "Step 1/3: Creating Secure Razorpay Order..."}
                  {paymentState === "OPENING_CHECKOUT" && "Step 2/3: Opening Razorpay Checkout Window..."}
                  {paymentState === "VERIFYING_PAYMENT" && "Step 3/3: Verifying HMAC SHA256 Signature with Server..."}
                </h4>
                <p className="text-[11px] text-gray-600">Please complete authorization in the Razorpay payment window.</p>
              </div>
            </div>
          )}

          {paymentState === "SUCCESS" && (
            <div className="flex items-center space-x-3 text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold">Payment Verified & Subscription Active!</h4>
                <p className="text-[11px] text-emerald-700">Entitlements synced with database.</p>
              </div>
            </div>
          )}

          {paymentState === "CANCELLED" && (
            <div className="flex items-center justify-between text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold">Payment Checkout Cancelled</h4>
                  <p className="text-[11px] text-amber-700">The Razorpay checkout window was closed before completion.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setPaymentState("IDLE")} className="text-xs font-bold">
                Dismiss
              </Button>
            </div>
          )}

          {paymentState === "FAILED" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 bg-rose-50 p-4 rounded-lg border border-rose-200">
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold flex items-center gap-2">
                    Payment Operation Failed
                    <span className="bg-rose-200 text-rose-900 font-mono text-[9px] px-2 py-0.5 rounded font-black">
                      {errorCode || "PAYMENT_FAILED"}
                    </span>
                  </h4>
                  <p className="text-xs text-rose-700 font-medium">{errorMessage}</p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setPaymentState("IDLE")}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry Payment
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Subscription Overview Card */}
      <Card className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Active Plan</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {subscriptionStatus}
              </span>
            </div>
            <h2 className="text-3xl font-black">
              {currentPlanCode === "multi_branch" ? "Multi-Branch Plan" : "Standard Plan"}
            </h2>
            <p className="text-xs text-gray-300">
              Next Renewal Date: <span className="font-mono text-white font-bold">{renewalDate}</span> • Razorpay Automated Billing
            </p>
          </div>

          <div className="flex items-center space-x-4 border-l border-gray-700 pl-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Active Store Capacity</p>
              <h3 className="text-2xl font-black text-white">
                {activeBranchCount} / {maxBranches === 99 ? "∞ Unlimited" : `${maxBranches} Store`}
              </h3>
              <p className="text-[11px] text-gray-400">
                {currentPlanCode === "multi_branch" ? "Multi-Branch Active" : "Single-Branch Standard Limit"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Plan */}
        <Card className={`p-6 space-y-4 rounded-2xl border transition-all ${currentPlanCode === "standard" ? "border-2 border-brand-500 ring-2 ring-brand-500/20 bg-white" : "bg-gray-50/50"}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-black text-gray-900">{standardConfig.name}</h3>
              <p className="text-xs text-gray-500 font-medium">For single-outlet restaurant operations.</p>
            </div>
            {currentPlanCode === "standard" && (
              <span className="bg-brand-100 text-brand-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Active Plan
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-gray-900">
                ₹{billingCycle === "annual" ? standardConfig.annualPrice.toLocaleString() : standardConfig.monthlyPrice.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-bold">/{billingCycle === "annual" ? "year" : "month"}</span>
            </div>
          </div>

          <ul className="space-y-2 border-t pt-4 text-xs font-semibold text-gray-700">
            {standardConfig.features.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" /> {feat}
              </li>
            ))}
          </ul>

          <div className="pt-2">
            {currentPlanCode === "standard" ? (
              <Button disabled variant="outline" className="w-full font-bold">Current Active Plan</Button>
            ) : (
              <Button onClick={handleDowngrade} disabled={isProcessing} variant="outline" className="w-full font-bold text-gray-700">
                Downgrade to Standard
              </Button>
            )}
          </div>
        </Card>

        {/* Multi-Branch Plan */}
        <Card className={`p-6 space-y-4 rounded-2xl border transition-all ${currentPlanCode === "multi_branch" ? "border-2 border-brand-500 ring-2 ring-brand-500/20 bg-white" : "bg-white shadow-md border-brand-200"}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                {multiBranchConfig.name} <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-xs text-gray-500 font-medium">Multi-location management & cross-branch analytics.</p>
            </div>
            {currentPlanCode === "multi_branch" && (
              <span className="bg-brand-100 text-brand-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Active Plan
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-gray-900">
                ₹{billingCycle === "annual" ? multiBranchConfig.annualPrice.toLocaleString() : multiBranchConfig.monthlyPrice.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-bold">/{billingCycle === "annual" ? "year" : "month"}</span>
            </div>
          </div>

          <ul className="space-y-2 border-t pt-4 text-xs font-semibold text-gray-700">
            {multiBranchConfig.features.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2 font-bold text-gray-900">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" /> {feat}
              </li>
            ))}
          </ul>

          <div className="pt-2 font-semibold">
            {currentPlanCode === "multi_branch" ? (
              <Button disabled variant="outline" className="w-full font-bold">Current Active Plan</Button>
            ) : (
              <Button
                onClick={() => handleRazorpayCheckout("multi_branch")}
                disabled={isProcessing}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting secure payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Upgrade via Razorpay 💳 <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Payment History & Billing Invoices */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Receipt className="h-4 w-4 text-brand-500" /> Payment Invoices & Billing History
        </h3>

        <Card className="overflow-hidden border shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Gateway Provider</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400 font-medium">
                    No billing invoices recorded yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 font-medium">
                    <td className="p-3 font-mono text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-black text-gray-900">₹{inv.amount.toLocaleString()}</td>
                    <td className="p-3 font-bold text-gray-700">{inv.payment_method}</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
