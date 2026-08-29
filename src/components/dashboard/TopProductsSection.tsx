import * as React from "react";
import { Utensils, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopProductItem } from "@/domain/dashboard/types";
import { formatCurrency } from "@/lib/utils";

export function TopProductsSection({ products }: { products: TopProductItem[] }) {
  return (
    <Card className="bg-surface border-restro-200 shadow-subtle">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center">
            <Utensils className="h-4 w-4 text-brand-600 mr-2" />
            Top Selling Dishes & Menu Items
          </CardTitle>
          <Badge variant="outline">Top 5 Revenue Share</Badge>
        </div>
        <CardDescription>
          Highest grossing menu items in current branch context
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {products.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-md bg-restro-50/60 border border-restro-100 hover:bg-restro-100/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                {idx + 1}
              </div>
              <div>
                <h5 className="text-xs font-bold text-restro-900">{item.name}</h5>
                <p className="text-[10px] text-restro-500">{item.category} • {item.unitsSold} units sold</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-extrabold text-restro-900 block">
                {formatCurrency(item.revenue, "INR")}
              </span>
              <span className="text-[10px] text-restro-500 font-medium">
                {item.sharePercentage}% share
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
