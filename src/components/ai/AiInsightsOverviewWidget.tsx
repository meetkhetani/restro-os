"use client";

import * as React from "react";
import {
  Sparkles,
  Zap,
  RefreshCw,
  TrendingUp,
  Boxes,
  Receipt,
  Users,
  Trophy,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AiInsightRecord, generateAndStoreAiInsights } from "@/domain/ai/insights";

interface AiInsightsOverviewWidgetProps {
  initialInsights: AiInsightRecord[];
  branchName: string;
  onRefresh: () => void;
}

export function AiInsightsOverviewWidget({
  initialInsights = [],
  branchName,
  onRefresh,
}: AiInsightsOverviewWidgetProps) {
  const { addToast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRegenerate = async () => {
    setIsRefreshing(true);
    const res = await generateAndStoreAiInsights();
    setIsRefreshing(false);

    if (res.success) {
      addToast({ type: "success", title: "AI Insights Updated", description: "Fresh operational predictions & forecasts computed." });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Refresh Failed", description: res.error });
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "sales":
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case "inventory":
        return <Boxes className="h-5 w-5 text-amber-500" />;
      case "expense_anomaly":
        return <Receipt className="h-5 w-5 text-rose-500" />;
      case "customer":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "branch_performance":
        return <Trophy className="h-5 w-5 text-purple-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-brand-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Subheader */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-4 rounded-2xl shadow-md">
        <div className="space-y-0.5">
          <h2 className="text-base font-black flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-400" />
            Automated Insights & Predictive Intelligence
          </h2>
          <p className="text-xs text-gray-300 font-medium">
            Probabilistic operational forecasts, low-stock depletion alerts, and cross-branch optimization opportunities.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleRegenerate}
          disabled={isRefreshing}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Recalculate Insights
        </Button>
      </div>

      {/* Insights Cards Grid */}
      {initialInsights.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
          <Sparkles className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No automated insights stored yet.</p>
          <p className="text-xs text-gray-500">Click &quot;Recalculate Insights&quot; to run the predictive analysis engine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialInsights.map((insight) => (
            <Card key={insight.id} className="p-5 border border-gray-200 bg-white shadow-sm space-y-3 relative hover:border-brand-300 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    {getInsightIcon(insight.insight_type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">{insight.title}</h3>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(insight.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="bg-brand-50 text-brand-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-brand-200">
                    {Math.round(Number(insight.confidence_score) * 100)}% Confidence
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      insight.impact_level === "high"
                        ? "bg-rose-100 text-rose-800"
                        : insight.impact_level === "medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {insight.impact_level} Impact
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {insight.explanation}
              </p>

              {insight.action_recommendation && (
                <div className="p-3 bg-brand-50/50 border border-brand-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-brand-700 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-brand-500 text-brand-500" /> Recommended Operational Action
                  </span>
                  <p className="text-xs text-brand-950 font-bold flex items-center gap-1">
                    <ArrowRight className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    {insight.action_recommendation}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
