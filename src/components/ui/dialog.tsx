"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-restro-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Content Container */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg border border-restro-200 bg-surface p-6 shadow-dialog transition-transform sm:rounded-lg",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <X className="h-4 w-4 text-restro-500" />
          <span className="sr-only">Close</span>
        </button>

        {(title || description) && (
          <div className="mb-4 space-y-1">
            {title && (
              <h2 className="text-lg font-semibold text-restro-900">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-restro-500">{description}</p>
            )}
          </div>
        )}

        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
