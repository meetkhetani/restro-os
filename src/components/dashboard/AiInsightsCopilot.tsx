import * as React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiInsightItem } from "@/domain/dashboard/types";

export function AiInsightsCopilot({ insights }: { insights: AiInsightItem[] }) {
  return (
    <Card className="bg-brand-50/40 border-brand-200 shadow-subtle">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center text-brand-950">
            <Sparkles className="h-4 w-4 text-brand-600 mr-2" />
            Restro OS AI Copilot Insights
          </CardTitle>
          <span className="text-[10px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded border border-brand-200 uppercase tracking-wider">
            Operational Intelligence
          </span>
        </div>
        <CardDescription className="text-brand-900/80">
          Contextual AI recommendations based on branch prep and sales velocity
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-md bg-surface border border-brand-200 shadow-subtle space-y-2"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-restro-900">{item.title}</h5>
            </div>
            <p className="text-xs text-restro-600 leading-relaxed">{item.description}</p>
            {item.suggestedAction && (
              <div className="pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs border-brand-300 text-brand-700 hover:bg-brand-50">
                  {item.suggestedAction} <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
