import * as React from "react";
import { GitBranch, Trophy, Lock, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BranchComparisonItem } from "@/domain/dashboard/types";
import { formatCurrency } from "@/lib/utils";

interface BranchComparisonViewProps {
  entitled: boolean;
  branches: BranchComparisonItem[];
}

export function BranchComparisonView({ entitled, branches }: BranchComparisonViewProps) {
  if (!entitled) {
    return (
      <Card className="bg-surface border-restro-200 shadow-subtle">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-restro-900">
              Multi-Branch Leaderboard & Cross-Branch Analytics Locked
            </h3>
            <p className="text-xs text-restro-500">
              Your organization is currently on the Standard Plan (1 Branch limit).
              Upgrade to the Multi-Branch Plan to compare branch performance, track consolidated revenue, and manage multi-location staff.
            </p>
          </div>
          <a href="/dashboard/billing">
            <Button size="sm" className="mt-2 shadow-subtle">
              Upgrade to Multi-Branch Plan <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-restro-200 shadow-subtle">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center">
            <GitBranch className="h-4 w-4 text-brand-600 mr-2" />
            Multi-Branch Performance Leaderboard
          </CardTitle>
          <Badge variant="brand">Centralized Org View</Badge>
        </div>
        <CardDescription>
          Branch-level comparisons for gross sales, order velocity, and occupancy
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Store</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Avg Order Value</TableHead>
              <TableHead>Occupancy Rate</TableHead>
              <TableHead>Performance Rank</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.branchId}>
                <TableCell className="font-bold text-restro-900 flex items-center space-x-2">
                  <span>{b.branchName}</span>
                  {b.isBestPerformer && (
                    <Trophy className="h-4 w-4 text-amber-500 fill-amber-500 inline-block" />
                  )}
                </TableCell>
                <TableCell className="font-extrabold text-restro-900">
                  {formatCurrency(b.totalRevenue, "INR")}
                </TableCell>
                <TableCell className="text-xs font-semibold">{b.totalOrders} orders</TableCell>
                <TableCell className="text-xs">{formatCurrency(b.aov, "INR")}</TableCell>
                <TableCell className="text-xs font-semibold text-emerald-600">
                  {b.occupancyRate}%
                </TableCell>
                <TableCell>
                  {b.isBestPerformer ? (
                    <Badge variant="success">#1 Top Performer</Badge>
                  ) : (
                    <Badge variant="outline">#2 Store</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
