"use client";

import * as React from "react";
import {
  X,
  Clock,
  User,
  Utensils,
  CreditCard,
  History,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Order, OrderStatus } from "@/domain/pos/types";
import {
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
} from "@/domain/orders/actions";

interface OrderDetailsModalProps {
  orderId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function OrderDetailsModal({
  orderId,
  onClose,
  onRefresh,
}: OrderDetailsModalProps) {
  const { addToast } = useToast();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = React.useState(false);

  const fetchDetails = React.useCallback(async () => {
    setIsLoading(true);
    const res = await getOrderDetails(orderId);
    if (res.success && res.order) {
      setOrder(res.order);
    } else {
      addToast({
        type: "error",
        title: "Error",
        description: res.error || "Failed to load order details.",
      });
      onClose();
    }
    setIsLoading(false);
  }, [orderId, addToast, onClose]);

  React.useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      addToast({
        type: "success",
        title: "Status Updated",
        description: res.message,
      });
      fetchDetails();
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Update Failed",
        description: res.error || "Failed to update status.",
      });
    }
    setIsUpdatingStatus(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Please provide a reason for cancelling this order.",
      });
      return;
    }

    setIsSubmittingCancel(true);
    const res = await cancelOrder({
      order_id: orderId,
      reason: cancelReason.trim(),
    });

    if (res.success) {
      addToast({
        type: "success",
        title: "Order Cancelled",
        description: res.message,
      });
      setIsCancelModalOpen(false);
      fetchDetails();
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Cancellation Failed",
        description: res.error || "Failed to cancel order.",
      });
    }
    setIsSubmittingCancel(false);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-300",
      confirmed: "bg-blue-100 text-blue-800 border-blue-300",
      preparing: "bg-purple-100 text-purple-800 border-purple-300",
      ready: "bg-teal-100 text-teal-800 border-teal-300",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (isLoading || !order) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl p-6 text-center text-xs font-semibold text-restro-600">
          Loading order details...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-in fade-in">
      <div className="bg-surface w-full max-w-2xl h-full flex flex-col shadow-dialog border-l border-restro-200 animate-in slide-in-from-right-10">
        {/* Drawer Header */}
        <div className="p-4 border-b border-restro-200 flex items-center justify-between bg-restro-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-restro-900 tracking-tight">
                Order {order.order_number}
              </h2>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-restro-500 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3 inline text-restro-400" />
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-restro-400 hover:text-restro-700 p-1.5 rounded-lg hover:bg-restro-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Order Quick Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background p-3 rounded-lg border border-restro-200 flex items-center space-x-3">
              <Utensils className="h-5 w-5 text-brand-500" />
              <div>
                <span className="text-[10px] text-restro-500 font-bold uppercase">Order Type</span>
                <p className="text-xs font-extrabold text-restro-900 capitalize">
                  {order.order_type.replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="bg-background p-3 rounded-lg border border-restro-200 flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <span className="text-[10px] text-restro-500 font-bold uppercase">Customer</span>
                <p className="text-xs font-extrabold text-restro-900 line-clamp-1">
                  {order.customer?.name || "Walk-in Customer"}
                </p>
              </div>
            </div>

            <div className="bg-background p-3 rounded-lg border border-restro-200 flex items-center space-x-3">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <span className="text-[10px] text-restro-500 font-bold uppercase">Table / Location</span>
                <p className="text-xs font-extrabold text-restro-900">
                  {order.table ? `Table ${order.table.table_number}` : "Takeaway / Delivery"}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-restro-900 uppercase tracking-wider">
              Order Items ({order.items?.length || 0})
            </h4>
            <div className="border border-restro-200 rounded-lg overflow-hidden bg-background">
              <table className="w-full text-left text-xs">
                <thead className="bg-restro-50 border-b border-restro-200 font-bold text-restro-700">
                  <tr>
                    <th className="p-2.5">Item Name</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-restro-200">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5">
                        <span className="font-extrabold text-restro-900">{item.item_name}</span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[10px] text-restro-500 pl-2 border-l border-brand-300 mt-0.5">
                            {item.modifiers.map((m, idx) => (
                              <span key={idx} className="block">
                                + {m.modifier_name} (+${m.price_delta.toFixed(2)})
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <span className="text-[10px] text-amber-600 block italic">Note: {item.notes}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold text-restro-900">{item.quantity}</td>
                      <td className="p-2.5 text-right text-restro-700">${item.unit_price.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-extrabold text-restro-900">
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-restro-50/50 p-3.5 rounded-lg border border-restro-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-restro-600">
              <span>Subtotal</span>
              <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-restro-600">
              <span>Tax</span>
              <span className="font-semibold">${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-restro-900 pt-2 border-t border-restro-200">
              <span>Total Amount</span>
              <span className="text-brand-600">${order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Records */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-restro-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-brand-500" /> Payment Transactions
            </h4>
            {order.payments && order.payments.length > 0 ? (
              <div className="space-y-1.5">
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-background rounded-lg border border-restro-200 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-restro-900 uppercase">{p.payment_method}</span>
                      {p.transaction_reference && (
                        <span className="text-[10px] text-restro-500 block">Ref: {p.transaction_reference}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-600">${p.amount.toFixed(2)}</span>
                      <span className="text-[10px] text-restro-400 block capitalize">{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-restro-400 italic">No payments recorded yet.</p>
            )}
          </div>

          {/* Timeline Audit Log */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-restro-900 uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-purple-500" /> Order Audit Timeline
            </h4>
            <div className="space-y-2 pl-2 border-l-2 border-restro-200">
              {order.events?.map((ev) => (
                <div key={ev.id} className="text-xs space-y-0.5 relative pl-3">
                  <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full bg-purple-500" />
                  <div className="flex justify-between font-semibold text-restro-800">
                    <span className="capitalize">{ev.status}</span>
                    <span className="text-[10px] text-restro-400 font-normal">
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {ev.notes && <p className="text-[11px] text-restro-600">{ev.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-restro-200 bg-surface flex items-center justify-between space-x-2">
          {order.status !== "cancelled" && order.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setIsCancelModalOpen(true)}
            >
              <AlertOctagon className="h-3.5 w-3.5 mr-1" /> Cancel Order
            </Button>
          )}

          <div className="flex space-x-2 ml-auto">
            {order.status === "pending" && (
              <Button
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => handleStatusUpdate("confirmed")}
              >
                Confirm Order <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
            {order.status === "confirmed" && (
              <Button
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => handleStatusUpdate("preparing")}
              >
                Mark Preparing <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => handleStatusUpdate("ready")}
              >
                Mark Ready <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={() => handleStatusUpdate("completed")}
              >
                Complete Order <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Reason Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-dialog max-w-md w-full p-5 space-y-4 border border-restro-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-restro-900">
                  Cancel Order {order.order_number}
                </h3>
                <p className="text-xs text-restro-500">Provide an audit reason for order cancellation</p>
              </div>
              <button onClick={() => setIsCancelModalOpen(false)} className="text-restro-400 hover:text-restro-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <Input
              label="Cancellation Reason"
              placeholder="e.g. Customer requested, Out of ingredients"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-restro-200">
              <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
                Back
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                isLoading={isSubmittingCancel}
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
