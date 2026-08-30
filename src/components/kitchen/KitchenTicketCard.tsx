"use client";

import * as React from "react";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  Utensils,
  ShoppingBag,
  Truck,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "@/domain/pos/types";

interface KitchenTicketCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export function KitchenTicketCard({
  order,
  onUpdateStatus,
}: KitchenTicketCardProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  // Calculate elapsed time in seconds from creation
  React.useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(order.created_at).getTime();
      const now = new Date().getTime();
      const seconds = Math.max(0, Math.floor((now - created) / 1000));
      setElapsedSeconds(seconds);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine urgency level based on elapsed time
  const mins = Math.floor(elapsedSeconds / 60);
  const isUrgent = mins >= 20;
  const isWarning = mins >= 10 && mins < 20;

  // Header and Border Styling based on status and urgency
  const getCardHeaderStyle = () => {
    if (order.status === "ready") {
      return "bg-emerald-600 text-white border-emerald-600";
    }
    if (isUrgent) {
      return "bg-rose-600 text-white border-rose-600 animate-pulse";
    }
    if (isWarning) {
      return "bg-amber-500 text-white border-amber-500";
    }
    if (order.status === "preparing") {
      return "bg-blue-600 text-white border-blue-600";
    }
    return "bg-gray-800 text-white border-gray-800";
  };

  const getCardBorderStyle = () => {
    if (order.status === "ready") return "border-emerald-500 ring-2 ring-emerald-500/20";
    if (isUrgent) return "border-rose-500 ring-2 ring-rose-500/30";
    if (isWarning) return "border-amber-400";
    if (order.status === "preparing") return "border-blue-500";
    return "border-gray-200";
  };

  const handleAction = async (nextStatus: OrderStatus) => {
    setIsSubmitting(true);
    await onUpdateStatus(order.id, nextStatus);
    setIsSubmitting(false);
  };

  const orderTypeIcon = () => {
    switch (order.order_type) {
      case "dine_in":
        return <Utensils className="h-4 w-4" />;
      case "takeaway":
        return <ShoppingBag className="h-4 w-4" />;
      case "delivery":
        return <Truck className="h-4 w-4" />;
      default:
        return <Utensils className="h-4 w-4" />;
    }
  };

  const tableNumberText = () => {
    if (order.order_type === "dine_in") {
      const table = order.table as { table_number?: string; section?: string; floor_area?: string } | undefined;
      return table?.table_number
        ? `Table ${table.table_number}`
        : "Dine-in";
    }
    return order.order_type.toUpperCase();
  };

  return (
    <div
      className={`rounded-2xl border-2 bg-white shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-200 ${getCardBorderStyle()}`}
    >
      {/* Header Bar */}
      <div className={`px-4 py-3 flex items-center justify-between font-bold ${getCardHeaderStyle()}`}>
        <div className="flex items-center space-x-2">
          <span className="text-lg tracking-wider">#{order.order_number}</span>
          {isUrgent && (
            <span className="bg-white text-rose-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <AlertTriangle className="h-3 w-3" /> URGENT
            </span>
          )}
        </div>

        {/* Live Elapsed Time Timer */}
        <div className="flex items-center space-x-1 font-mono text-sm bg-black/20 px-2.5 py-1 rounded-md">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatElapsed(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-4 space-y-4 flex-1">
        {/* Order Type & Dining Table Info */}
        <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
          <div className="flex items-center space-x-1.5 font-bold text-gray-700">
            {orderTypeIcon()}
            <span className="capitalize">{tableNumberText()}</span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
              order.status === "preparing"
                ? "bg-blue-100 text-blue-700"
                : order.status === "ready"
                ? "bg-emerald-100 text-emerald-700"
                : order.status === "completed"
                ? "bg-gray-100 text-gray-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Customer Special Notes */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900 font-medium">
            <span className="font-bold">Note:</span> {order.notes}
          </div>
        )}

        {/* Items List */}
        <div className="space-y-3 divide-y divide-gray-100">
          {(order.items || []).map((item) => (
            <div key={item.id} className="pt-2 first:pt-0">
              <div className="flex items-start justify-between">
                <div className="flex items-baseline space-x-2">
                  <span className="text-base font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {item.quantity}x
                  </span>
                  <span className="text-sm font-bold text-gray-900 leading-tight">
                    {item.item_name}
                  </span>
                </div>
              </div>

              {/* Modifiers List */}
              {item.modifiers && item.modifiers.length > 0 && (
                <ul className="ml-8 mt-1 space-y-0.5 text-xs text-gray-600 list-disc">
                  {item.modifiers.map((mod) => (
                    <li key={mod.id} className="font-medium text-amber-800">
                      {mod.modifier_name}
                    </li>
                  ))}
                </ul>
              )}

              {/* Item Specific Notes */}
              {item.notes && (
                <p className="ml-8 text-[11px] italic text-rose-600 font-medium">
                  &quot;{item.notes}&quot;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Touch Action Bar */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
        {(order.status === "pending" || order.status === "confirmed") && (
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm shadow-md"
            disabled={isSubmitting}
            onClick={() => handleAction("preparing")}
          >
            <ChefHat className="h-4 w-4 mr-2" /> Start Cooking
          </Button>
        )}

        {order.status === "preparing" && (
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-sm shadow-md"
            disabled={isSubmitting}
            onClick={() => handleAction("ready")}
          >
            <BellRing className="h-4 w-4 mr-2" /> Mark Ready
          </Button>
        )}

        {order.status === "ready" && (
          <Button
            size="lg"
            className="w-full bg-gray-900 hover:bg-black text-white font-bold h-12 text-sm shadow-md"
            disabled={isSubmitting}
            onClick={() => handleAction("completed")}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Bump / Complete
          </Button>
        )}

        {order.status === "completed" && (
          <div className="w-full text-center text-xs font-bold text-gray-500 py-2">
            ✓ Ticket Completed
          </div>
        )}
      </div>
    </div>
  );
}
