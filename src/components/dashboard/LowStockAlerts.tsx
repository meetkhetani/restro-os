import * as React from "react";
import { AlertTriangle, Boxes } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LowStockAlertItem } from "@/domain/dashboard/types";

export function LowStockAlerts({ alerts }: { alerts: LowStockAlertItem[] }) {
  return (
    <Card className="bg-surface border-restro-200 shadow-subtle">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center">
            <Boxes className="h-4 w-4 text-amber-600 mr-2" />
            Low Stock Ingredient Warnings
          </CardTitle>
          <Badge variant="danger">{alerts.length} Reorder Alerts</Badge>
        </div>
        <CardDescription>
          Raw materials below or approaching safety stock thresholds
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-2.5">
        {alerts.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-md border bg-red-50/40 border-red-200 text-xs"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-red-950">{item.ingredientName}</h5>
                <p className="text-[10px] text-red-700">{item.branchName}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-extrabold text-red-900 block">
                {item.currentStock} {item.unit}
              </span>
              <span className="text-[10px] text-red-600">Reorder at {item.reorderPoint} {item.unit}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
