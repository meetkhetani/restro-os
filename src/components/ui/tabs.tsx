"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex border-b border-restro-200 space-x-6 overflow-x-auto scrollbar-none",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-brand-500 text-brand-700 font-semibold"
                : "border-transparent text-restro-600 hover:text-restro-900 hover:border-restro-300"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-xs font-semibold",
                  isActive
                    ? "bg-brand-100 text-brand-700"
                    : "bg-restro-100 text-restro-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
