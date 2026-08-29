"use client";

import * as React from "react";
import { BarChart3, TrendingUp, Store, Layers } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  return (
    <ModuleShell
      title="Restaurant Analytics & Performance Intelligence"
      category="Insights"
      description="Single-branch operations & cross-branch performance comparisons."
      icon={<BarChart3 className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-surface border-restro-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Single-Branch Daily Sales</CardTitle>
              <Badge variant="success">Standard Entitled</Badge>
            </div>
            <CardDescription>Downtown Main Branch metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-extrabold text-restro-900">₹1,48,250</div>
            <p className="text-xs text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> +14.2% vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-restro-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Cross-Branch Store Comparison</CardTitle>
              <Badge variant="brand">Multi-Branch Entitled</Badge>
            </div>
            <CardDescription>Compare Downtown vs Uptown revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-extrabold text-restro-900">₹3,92,100</div>
            <p className="text-xs text-restro-500 font-semibold">
              Consolidated Multi-Branch Gross Revenue
            </p>
          </CardContent>
        </Card>
      </div>
    </ModuleShell>
  );
}
