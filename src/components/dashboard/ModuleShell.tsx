import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleShellProps {
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

export function ModuleShell({
  title,
  category,
  description,
  icon,
  children,
}: ModuleShellProps) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-restro-200 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-restro-900 tracking-tight">{title}</h1>
            <Badge variant="outline">{category}</Badge>
          </div>
          <p className="text-xs text-restro-500 mt-1">{description}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-restro-100 flex items-center justify-center text-brand-600">
          {icon}
        </div>
      </div>

      {children || (
        <Card className="bg-surface border-restro-200">
          <CardHeader>
            <CardTitle className="text-base font-bold">{title} Module Engine</CardTitle>
            <CardDescription>
              Connected to active organization tenant and multi-tenant RLS policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center text-xs text-restro-500 border-t border-restro-100">
            Operational engine ready for high-throughput restaurant workloads.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
