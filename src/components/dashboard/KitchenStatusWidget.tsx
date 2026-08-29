import * as React from "react";
import { ChefHat, Clock, Flame } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { KitchenStatusSummary } from "@/domain/dashboard/types";

export function KitchenStatusWidget({ status }: { status: KitchenStatusSummary }) {
  return (
    <Card className="bg-surface border-restro-200 shadow-subtle">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold flex items-center">
          <ChefHat className="h-4 w-4 text-brand-600 mr-2" />
          Kitchen Display System (KDS)
        </CardTitle>
        <CardDescription>
          Active ticket dispatch and prep timing
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200">
          <span className="text-xs font-semibold text-amber-700 block">Pending</span>
          <span className="text-xl font-extrabold text-amber-900">{status.pendingTickets}</span>
        </div>
        <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
          <span className="text-xs font-semibold text-blue-700 block">In Prep</span>
          <span className="text-xl font-extrabold text-blue-900">{status.inPrepTickets}</span>
        </div>
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200">
          <span className="text-xs font-semibold text-emerald-700 block">Ready</span>
          <span className="text-xl font-extrabold text-emerald-900">{status.readyTickets}</span>
        </div>
      </CardContent>
    </Card>
  );
}
