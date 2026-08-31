"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
    info: <Info className="h-4 w-4 text-blue-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  };

  const borders = {
    success: "border-emerald-200 bg-surface",
    error: "border-red-200 bg-surface",
    info: "border-blue-200 bg-surface",
    warning: "border-amber-200 bg-surface",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start space-x-3 rounded-lg border p-4 shadow-dialog transition-all animate-in slide-in-from-right-5",
        borders[toast.type]
      )}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 space-y-0.5">
        <h5 className="text-xs font-semibold text-restro-900">{toast.title}</h5>
        {toast.description && (
          <p className="text-xs text-restro-600 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-restro-400 hover:text-restro-700 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
