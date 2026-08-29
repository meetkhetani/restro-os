import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this resource. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50/40 p-6 text-center shadow-subtle",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold text-red-900">{title}</h4>
      <p className="mt-1 text-xs text-red-700 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 border-red-300 text-red-800 hover:bg-red-100/50"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry Action
        </Button>
      )}
    </div>
  );
}
