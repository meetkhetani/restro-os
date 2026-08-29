import Link from "next/link";
import { UtensilsCrossed, Shield, Database, ArrowRight, CheckCircle, Server, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Header Bar */}
      <header className="border-b border-restro-200 bg-surface px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-md bg-brand-500 flex items-center justify-center text-white shadow-subtle">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-restro-900">
                RESTRO <span className="text-brand-500">OS</span>
              </span>
              <span className="ml-3 text-xs font-semibold text-restro-500">
                v1.0 Phase 01 Foundation
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="default" size="sm">
                Launch System
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="brand" className="px-3 py-1 text-xs">
            Phase 01 — Foundation & Architecture Complete
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-restro-900 tracking-tight leading-tight">
            The operating system for <span className="text-brand-500">modern restaurants.</span>
          </h1>
          <p className="text-restro-600 text-base sm:text-lg leading-relaxed">
            Engineered from a clean modular monolith architecture on Next.js and Supabase PostgreSQL.
            Strict multi-tenant isolation, role-based access control, and zero-compromise engineering standards.
          </p>
          <div className="pt-4 flex items-center justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="shadow-card">
                Explore Operator Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                View Authentication Flow
              </Button>
            </Link>
          </div>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-surface border-restro-200 shadow-card">
            <CardHeader className="space-y-1">
              <div className="h-10 w-10 rounded-md bg-restro-100 flex items-center justify-center text-brand-600 mb-2">
                <Database className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Supabase Multi-Tenant RLS</CardTitle>
              <CardDescription>
                Database-enforced isolation per organization and location with custom Security Definer functions.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-restro-600 border-t border-restro-100 pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Organizations & Locations Schema</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Role & Permission Junctions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>No Public Shortcuts or Wildcard Policies</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-restro-200 shadow-card">
            <CardHeader className="space-y-1">
              <div className="h-10 w-10 rounded-md bg-restro-100 flex items-center justify-center text-brand-600 mb-2">
                <Layers className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Modular Monolith</CardTitle>
              <CardDescription>
                Clean separation between UI components, domain logic, validation, authentication, and database.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-restro-600 border-t border-restro-100 pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Server Components Default</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Strict Domain Validation with Zod</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Isolated Privileged Service Role Key</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface border-restro-200 shadow-card">
            <CardHeader className="space-y-1">
              <div className="h-10 w-10 rounded-md bg-restro-100 flex items-center justify-center text-brand-600 mb-2">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Bespoke Design System</CardTitle>
              <CardDescription>
                Light, minimal, premium aesthetic tuned for high-volume restaurant operational efficiency.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-restro-600 border-t border-restro-100 pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Primary Palette: #FAF8F5 & #A90706</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>12+ Reusable UI Primitive Components</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zero Gaming/Neon Aesthetics</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-restro-200 bg-surface px-8 py-6 text-center text-xs text-restro-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-brand-500" />
            <span className="font-semibold text-restro-700">Restro OS Platform Foundation</span>
          </div>
          <p>© 2026 Restro OS. Enterprise Grade Operating System.</p>
        </div>
      </footer>
    </div>
  );
}
