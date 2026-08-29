"use client";

import * as React from "react";
import { Check, ShieldCheck, Zap, CreditCard, Layers, Sparkles, Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { upgradeOrganizationPlan } from "@/domain/billing/service";

export default function BillingPage() {
  const [currentPlanCode, setCurrentPlanCode] = React.useState<"standard" | "multi_branch">("standard");
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const { addToast } = useToast();

  const handleUpgrade = async (planCode: "standard" | "multi_branch") => {
    setIsUpgrading(true);
    try {
      // In production, triggers Razorpay checkout / subscription upgrade
      await upgradeOrganizationPlan("demo-org-id", planCode);
      setCurrentPlanCode(planCode);
      addToast({
        type: "success",
        title: "Plan Updated",
        description: `Successfully switched to ${planCode === "multi_branch" ? "Multi-Branch" : "Standard"} Plan. Entitlements updated.`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Upgrade Failed",
        description: err instanceof Error ? err.message : "Failed to update plan",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-restro-200 pb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-restro-900 tracking-tight">
            SaaS Subscription & Entitlement Management
          </h1>
          <Badge variant="brand" className="font-semibold text-[11px]">
            Razorpay Integration Ready
          </Badge>
        </div>
        <p className="text-xs text-restro-500 mt-1">
          Manage your organization&apos;s subscription tier, branch limits, and feature entitlements.
        </p>
      </div>

      {/* Subscription Overview Card */}
      <Card className="bg-surface border-restro-200 shadow-subtle">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-restro-500 uppercase tracking-wider">
                Current Active Subscription
              </span>
              <Badge variant="success" className="text-[10px]">
                Active & Synced
              </Badge>
            </div>
            <h3 className="text-xl font-extrabold text-restro-900">
              {currentPlanCode === "multi_branch" ? "Multi-Branch Plan" : "Standard Plan"}
            </h3>
            <p className="text-xs text-restro-500">
              Billing Period: Monthly • Provider: <span className="font-medium text-restro-800">Razorpay</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-restro-500">Branch Capacity</p>
              <p className="text-sm font-bold text-restro-900">
                {currentPlanCode === "multi_branch" ? "Unlimited Branches" : "1 Branch Limit"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Plan */}
        <Card
          className={`bg-surface shadow-card transition-all ${
            currentPlanCode === "standard" ? "border-2 border-brand-500 ring-1 ring-brand-500/20" : "border-restro-200"
          }`}
        >
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Standard Plan</CardTitle>
              {currentPlanCode === "standard" && (
                <Badge variant="brand">Current Plan</Badge>
              )}
            </div>
            <CardDescription>
              Complete operations for single-location restaurants.
            </CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-extrabold text-restro-900">₹2,999</span>
              <span className="text-xs text-restro-500 font-medium"> / month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-restro-100 pt-4 text-xs">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>1 Organization Tenant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>1 Branch Outlet Limit</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Single-Branch Sales & Operational Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Full POS, Menu, Inventory & Order Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Restro OS AI Assistant Copilot</span>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button
              variant={currentPlanCode === "standard" ? "outline" : "default"}
              className="w-full"
              disabled={currentPlanCode === "standard" || isUpgrading}
              onClick={() => handleUpgrade("standard")}
            >
              {currentPlanCode === "standard" ? "Active Plan" : "Downgrade to Standard"}
            </Button>
          </CardFooter>
        </Card>

        {/* Multi-Branch Plan */}
        <Card
          className={`bg-surface shadow-card transition-all ${
            currentPlanCode === "multi_branch" ? "border-2 border-brand-500 ring-1 ring-brand-500/20" : "border-restro-200"
          }`}
        >
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg font-bold">Multi-Branch Plan</CardTitle>
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
              {currentPlanCode === "multi_branch" && (
                <Badge variant="brand">Current Plan</Badge>
              )}
            </div>
            <CardDescription>
              Multi-location management & cross-branch intelligence.
            </CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-extrabold text-restro-900">₹7,999</span>
              <span className="text-xs text-restro-500 font-medium"> / month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-restro-100 pt-4 text-xs">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>1 Organization Tenant</span>
            </div>
            <div className="flex items-center space-x-2 font-bold text-restro-900">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Multiple Branch Outlets (Unlimited Capacity)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Cross-Branch Analytics & Store Comparison</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Centralized Management & Multi-Branch Staff Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Organization-Level AI Copilot & Insights</span>
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button
              variant={currentPlanCode === "multi_branch" ? "outline" : "default"}
              className="w-full"
              disabled={currentPlanCode === "multi_branch" || isUpgrading}
              onClick={() => handleUpgrade("multi_branch")}
            >
              {currentPlanCode === "multi_branch" ? "Active Plan" : "Upgrade to Multi-Branch"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Razorpay Webhook Status Banner */}
      <Card className="bg-restro-50 border-restro-200">
        <CardContent className="p-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <span className="font-semibold text-restro-900">Razorpay Webhook Endpoint:</span>{" "}
              <code className="bg-surface px-2 py-0.5 rounded border border-restro-200 text-restro-700">
                /api/webhooks/razorpay
              </code>
            </div>
          </div>
          <Badge variant="outline">Idempotency Logged</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
