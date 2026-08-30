"use client";

import * as React from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  Boxes,
  Utensils,
  Trophy,
  RefreshCw,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ChatMessage, processAiChatMessage } from "@/domain/ai/actions";
import { AiInsightRecord, getAiInsights } from "@/domain/ai/insights";
import { AiInsightsOverviewWidget } from "./AiInsightsOverviewWidget";

interface AiAssistantClientProps {
  initialInsights: AiInsightRecord[];
  currentBranchId: string;
  branchName: string;
  isMultiBranch: boolean;
}

export function AiAssistantClient({
  initialInsights = [],
  currentBranchId,
  branchName,
  isMultiBranch,
}: AiAssistantClientProps) {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"copilot" | "insights">("copilot");
  const [insights, setInsights] = React.useState<AiInsightRecord[]>(initialInsights);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `### 👋 Welcome to Restro OS AI Copilot!\n\nI am your intelligent restaurant operations copilot for **${branchName}**. I can execute controlled server-side analytical tools to provide real-time sales reports, branch rankings, inventory reorder alerts, and expense analysis.\n\n*Click one of the quick prompt pills below or type any question to start!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (activeTab === "copilot") scrollToBottom();
  }, [messages, isProcessing, activeTab]);

  const handleSendMessage = async (promptText?: string) => {
    const text = promptText || inputPrompt;
    if (!text.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputPrompt("");
    setIsProcessing(true);

    const res = await processAiChatMessage(text, currentBranchId);
    setIsProcessing(false);

    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message!]);
    } else {
      addToast({
        type: "error",
        title: "AI Processing Failed",
        description: res.error || "Failed to process query.",
      });
    }
  };

  const fetchLatestInsights = async () => {
    const res = await getAiInsights(currentBranchId);
    if (res.success) setInsights(res.insights || []);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Bar & Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-500" />
            Restro OS AI Copilot & Insights Engine
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              {isMultiBranch ? "Multi-Branch Copilot" : branchName}
            </span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Controlled Server-Side Tools: Sales, Orders, Reorder Alerts, Expenses, Top Dishes & Branch Performance.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("copilot")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "copilot"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Interactive Copilot</span>
          </button>

          <button
            onClick={() => setActiveTab("insights")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "insights"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>Automated Insights & Forecasts ({insights.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE CHAT COPILOT */}
      {activeTab === "copilot" && (
        <div className="space-y-4">
          {/* Quick Prompt Suggestion Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {isMultiBranch && (
              <button
                onClick={() => handleSendMessage("Compare my branches performance this month")}
                className="px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 flex items-center gap-1.5 whitespace-nowrap transition-all"
              >
                <Trophy className="h-3.5 w-3.5" /> Compare my branches
              </button>
            )}

            <button
              onClick={() => handleSendMessage("Which ingredients are low in stock?")}
              className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1.5 whitespace-nowrap transition-all"
            >
              <Boxes className="h-3.5 w-3.5 text-amber-600" /> Low stock items
            </button>

            <button
              onClick={() => handleSendMessage("What are my top 5 selling dishes?")}
              className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap transition-all"
            >
              <Utensils className="h-3.5 w-3.5 text-emerald-600" /> Top selling dishes
            </button>

            <button
              onClick={() => handleSendMessage("What is my gross revenue and net profit?")}
              className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 flex items-center gap-1.5 whitespace-nowrap transition-all"
            >
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> Executive revenue summary
            </button>
          </div>

          {/* Chat Messages Container */}
          <Card className="p-4 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4 border bg-gray-50/50 shadow-inner rounded-2xl">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-brand-500 text-white shadow-md"
                  }`}
                >
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-xs font-medium shadow-sm ${
                    msg.role === "user"
                      ? "bg-brand-500 text-white font-semibold"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  {/* Tool Execution State Badges */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-gray-100">
                      {msg.toolCalls.map((tc, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" /> Executed Tool: {tc.toolName}()
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Content formatted */}
                  <div className="whitespace-pre-wrap leading-relaxed prose prose-xs max-w-none">
                    {msg.content}
                  </div>

                  <span className={`block text-[10px] ${msg.role === "user" ? "text-brand-100" : "text-gray-400"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-2xl text-xs text-gray-500 font-semibold flex items-center space-x-2 shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />
                  <span>Executing controlled server tools & aggregating analytics...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </Card>

          {/* Input Box Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <Input
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask AI Copilot (e.g. 'Compare my branches' or 'Which items are low in stock?')..."
              disabled={isProcessing}
              className="bg-white text-xs py-5 rounded-xl border-gray-300 focus:ring-brand-500"
            />
            <Button
              type="submit"
              disabled={isProcessing || !inputPrompt.trim()}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold h-11 px-5 rounded-xl shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* TAB 2: AUTOMATED AI INSIGHTS & FORECASTS */}
      {activeTab === "insights" && (
        <AiInsightsOverviewWidget
          initialInsights={insights}
          branchName={branchName}
          onRefresh={fetchLatestInsights}
        />
      )}
    </div>
  );
}
