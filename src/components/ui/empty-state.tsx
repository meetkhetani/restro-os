import * as React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-restro-300 bg-surface p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-restro-100 text-restro-600 mb-4">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-restro-900">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-restro-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
