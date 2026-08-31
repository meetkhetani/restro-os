import Link from "next/link";
import {
  UtensilsCrossed,
  Shield,
  Database,
  ArrowRight,
  CheckCircle2,
  Server,
  Layers,
  Zap,
  Bot,
  CreditCard,
  Building2,
  Receipt,
  Boxes,
  Bell,
  LineChart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-gray-900">
                  RESTRO <span className="text-brand-500">OS</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  v2.0 Production Ready
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-500">
                Enterprise Restaurant SaaS Operating System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="font-bold text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md">
                Launch System <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center space-y-16">
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 px-3.5 py-1.5 rounded-full">
            <Zap className="h-3.5 w-3.5 text-brand-600 fill-brand-600 animate-pulse" />
            <span className="text-xs font-black text-brand-800 uppercase tracking-wide">
              Complete All-In-One Restaurant Platform — All 21 Phases Live
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
            The modern operating system for <span className="text-brand-500">high-growth restaurants.</span>
          </h1>

          <p className="text-gray-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            From touch-optimized POS and Kitchen Displays (KDS) to Multi-Branch management, AI forecasting, stock ledgers, and automated Razorpay billing.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-brand-500 hover:bg-brand-600 text-white font-black text-sm px-7 shadow-lg">
                Explore Operator Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" size="lg" className="font-bold text-sm bg-white text-gray-800 border-gray-300">
                <CreditCard className="mr-2 h-4 w-4 text-brand-500" /> SaaS Billing & Plans
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* POS & KDS */}
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="space-y-1.5 p-6">
              <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-1 border border-brand-100">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-black text-gray-900">Point of Sale & KDS</CardTitle>
              <CardDescription className="text-xs text-gray-500 font-medium">
                High-volume touchscreen POS terminal, custom item modifiers, floor plan table maps, and live kitchen tickets.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-700 border-t border-gray-100 p-6 pt-4 bg-gray-50/50">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Realtime KDS Ticket Display</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Floor & Table Status Management</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Cash, Card, UPI & Digital Split</span>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Branch & RLS Security */}
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="space-y-1.5 p-6">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-1 border border-blue-100">
                <Building2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-black text-gray-900">Multi-Branch Architecture</CardTitle>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Multi-outlet catalog, seamless store switching, Standard vs Multi-Branch plan capacity limits, and database RLS.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-700 border-t border-gray-100 p-6 pt-4 bg-gray-50/50">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Supabase PostgreSQL Tenant RLS</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Store Cookie Context & Switching</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Enforced Branch Capacity Entitlements</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Copilot */}
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="space-y-1.5 p-6">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-1 border border-purple-100">
                <Bot className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-black text-gray-900">AI Restaurant Copilot</CardTitle>
              <CardDescription className="text-xs text-gray-500 font-medium">
                7 controlled server-side tools (`getSales`, `getInventory`, `getBranchPerformance`) with confidence scores and persistent insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-700 border-t border-gray-100 p-6 pt-4 bg-gray-50/50">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Sales & Low-Stock Intelligence</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Expense Anomaly Detection</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Cross-Branch Transfer Opportunities</span>
              </div>
            </CardContent>
          </Card>

          {/* Razorpay Billing Portal */}
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="space-y-1.5 p-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1 border border-emerald-100">
                <CreditCard className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-black text-gray-900">Razorpay Billing Portal</CardTitle>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Production Razorpay Standard Checkout (`POST /v1/orders`), HMAC SHA256 signature verification, and webhook idempotency.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-700 border-t border-gray-100 p-6 pt-4 bg-gray-50/50">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Standard (₹2,999) & Multi-Branch (₹7,999)</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Configuration-Driven Pricing</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Timing-Safe Signature Verification</span>
              </div>
            </CardContent>
          </Card>

          {/* Inventory & Purchasing */}
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="space-y-1.5 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-1 border border-amber-100">
                <Boxes className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-black text-gray-900">Inventory & Purchasing</CardTitle>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Live ingredient stock ledgers, purchase order receivings, stock movement tracking, and supplier management.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-700 border-t border-gray-100 p-6 pt-4 bg-gray-50/50">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Stock Ledger & Transfers</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Purchase Order Receivings</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Branch Expense Ledger</span>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Realtime */}
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="space-y-1.5 p-6">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mb-1 border border-rose-100">
                <LineChart className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-black text-gray-900">Analytics & Realtime</CardTitle>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Efficient database-side aggregations for revenue, net profit, top products, and live notification channel sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-700 border-t border-gray-100 p-6 pt-4 bg-gray-50/50">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero Browser Metric Fabrication</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Supabase Realtime Channel Badge</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Audit Logs & CRM Insights</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-8 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-brand-500" />
            <span className="font-bold text-gray-800">Restro OS Enterprise SaaS Platform v2.0</span>
          </div>
          <p>© 2026 Restro OS. Engineered with Next.js 15, TypeScript & Supabase PostgreSQL.</p>
        </div>
      </footer>
    </div>
  );
}
