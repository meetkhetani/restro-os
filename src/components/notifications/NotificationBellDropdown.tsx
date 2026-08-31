"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Boxes,
  Clock,
  CreditCard,
  Sparkles,
  Users,
  Info,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  NotificationRecord,
  NotificationType,
  getNotificationsOverview,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/domain/notifications/actions";

export function NotificationBellDropdown() {
  const { addToast } = useToast();

  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [orgId, setOrgId] = React.useState<string>("");

  const fetchLatest = async () => {
    try {
      const res = await getNotificationsOverview();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
        if (res.orgId) setOrgId(res.orgId);
      }
    } catch (err) {
      console.warn("Notifications fetch bypassed:", err);
    }
  };

  React.useEffect(() => {
    fetchLatest();
  }, []);

  // Supabase Realtime Channel Subscription with safe error boundary
  React.useEffect(() => {
    if (!orgId) return;

    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`org_notifications_${orgId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `org_id=eq.${orgId}`,
          },
          (payload) => {
            const newNotif = payload.new as NotificationRecord;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
            if (addToast) {
              addToast({
                type: "info",
                title: newNotif.title,
                description: newNotif.message,
              });
            }
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup error
        }
      };
    } catch (err) {
      console.warn("Realtime subscription bypassed:", err);
    }
  }, [orgId, addToast]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
    if (addToast) {
      addToast({ type: "success", title: "All Notifications Cleared" });
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "new_order":
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case "low_stock":
        return <Boxes className="h-4 w-4 text-amber-500" />;
      case "kitchen_delay":
        return <Clock className="h-4 w-4 text-rose-500" />;
      case "subscription_issue":
      case "payment_issue":
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case "ai_insight":
        return <Sparkles className="h-4 w-4 text-brand-500" />;
      case "staff_event":
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 overflow-hidden space-y-0">
          <div className="p-3.5 bg-gray-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-brand-400" />
              <h3 className="text-xs font-bold">Notifications & Alerts</h3>
              {unreadCount > 0 && (
                <span className="bg-brand-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-gray-300 hover:text-white font-semibold flex items-center gap-1 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium space-y-1">
                <Bell className="h-6 w-6 text-gray-300 mx-auto" />
                <p>No notifications recorded.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`p-3.5 flex items-start space-x-3 text-xs transition-all cursor-pointer ${
                    n.is_read ? "bg-white opacity-70" : "bg-brand-50/20 font-medium"
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-gray-900 leading-tight">{n.title}</h4>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-normal">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
