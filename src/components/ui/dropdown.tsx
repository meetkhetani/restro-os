"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-56 rounded-md border border-restro-200 bg-surface p-1 shadow-dialog focus:outline-none",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-sm px-3 py-2 text-xs font-medium transition-colors text-left",
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-restro-800 hover:bg-restro-100",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {item.icon && <span className="mr-2 h-4 w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
