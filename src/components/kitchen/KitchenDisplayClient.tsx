"use client";

import * as React from "react";
import {
  ChefHat,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
  Clock,
  CheckCircle2,
  BellRing,
  Flame,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/domain/pos/types";
import { getKitchenOrders, updateKitchenOrderStatus } from "@/domain/kitchen/actions";
import { KitchenTicketCard } from "./KitchenTicketCard";

interface KitchenDisplayClientProps {
  initialOrders: Order[];
  currentBranchId: string;
  branchName: string;
}

type FilterTab = "active" | "pending" | "preparing" | "ready" | "completed";

export function KitchenDisplayClient({
  initialOrders = [],
  currentBranchId,
  branchName,
}: KitchenDisplayClientProps) {
  const { addToast } = useToast();

  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = React.useState<FilterTab>("active");
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Play audio chime using Web Audio API synthesis
  const playNewOrderChime = React.useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio playback fails gracefully if muted by browser policy
    }
  }, [soundEnabled]);

  // Fetch Latest Kitchen Orders
  const fetchOrders = React.useCallback(async () => {
    setIsRefreshing(true);
    const res = await getKitchenOrders(currentBranchId);
    if (res.success && res.orders) {
      setOrders(res.orders);
    }
    setIsRefreshing(false);
  }, [currentBranchId]);

  // Supabase Realtime Subscription scoped by branch_id
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`kds-branch-${currentBranchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `branch_id=eq.${currentBranchId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            playNewOrderChime();
            addToast({
              type: "info",
              title: "🔔 New Kitchen Order!",
              description: `New order #${(payload.new as Order).order_number} received.`,
            });
          }
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBranchId, fetchOrders, playNewOrderChime, addToast]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Status Action Handler
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // Optimistic UI Update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    const res = await updateKitchenOrderStatus(orderId, nextStatus);
    if (!res.success) {
      addToast({
        type: "error",
        title: "Update Failed",
        description: res.error,
      });
      fetchOrders();
    } else {
      addToast({
        type: "success",
        title: `Order Status Updated`,
        description: `Ticket status set to ${nextStatus.toUpperCase()}`,
      });
    }
  };

  // Filter Orders based on activeTab
  const filteredOrders = React.useMemo(() => {
    switch (activeTab) {
      case "pending":
        return orders.filter((o) => o.status === "pending" || o.status === "confirmed");
      case "preparing":
        return orders.filter((o) => o.status === "preparing");
      case "ready":
        return orders.filter((o) => o.status === "ready");
      case "completed":
        return orders.filter((o) => o.status === "completed");
      case "active":
      default:
        return orders.filter(
          (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing" || o.status === "ready"
        );
    }
  }, [orders, activeTab]);

  // Ticket Count Summaries
  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${
        isFullscreen ? "p-6 bg-gray-950 min-h-screen text-white overflow-y-auto z-50" : ""
      }`}
    >
      {/* KDS Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              KITCHEN DISPLAY SYSTEM (KDS)
              <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 font-bold px-2.5 py-0.5 rounded-full">
                {branchName}
              </span>
            </h1>
            <p className="text-xs font-medium text-gray-500">
              Live Touchscreen Order Dispatch & Prep Pipeline
            </p>
          </div>
        </div>

        {/* Action Controls: Sound, Fullscreen, Refresh */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`font-semibold border-gray-300 ${
              soundEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "text-gray-500"
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 mr-1.5" /> : <VolumeX className="h-4 w-4 mr-1.5" />}
            {soundEnabled ? "Sound On" : "Muted"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="font-semibold text-gray-700 dark:text-gray-200"
          >
            {isFullscreen ? <Minimize className="h-4 w-4 mr-1.5" /> : <Maximize className="h-4 w-4 mr-1.5" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isRefreshing}
            className="font-semibold text-gray-700 dark:text-gray-200"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeTab === "active"
                ? "bg-gray-900 text-white shadow-gray-900/20"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Flame className="h-4 w-4 text-amber-500" />
            All Active ({pendingCount + preparingCount + readyCount})
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-amber-600/20"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Clock className="h-4 w-4 text-amber-600" />
            New ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab("preparing")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeTab === "preparing"
                ? "bg-blue-600 text-white shadow-blue-600/20"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <ChefHat className="h-4 w-4 text-blue-600" />
            Preparing ({preparingCount})
          </button>

          <button
            onClick={() => setActiveTab("ready")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeTab === "ready"
                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <BellRing className="h-4 w-4 text-emerald-600" />
            Ready ({readyCount})
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeTab === "completed"
                ? "bg-gray-700 text-white shadow-gray-700/20"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 text-gray-500" />
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Grid Display of Kitchen Ticket Cards */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mx-auto">
            <ChefHat className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
            No Orders in &quot;{activeTab.toUpperCase()}&quot;
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            New incoming orders placed from the POS terminal will automatically appear on this screen in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <KitchenTicketCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
