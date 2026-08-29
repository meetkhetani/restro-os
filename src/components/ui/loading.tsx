import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <Loader2
      className={cn("animate-spin text-brand-500", sizeMap[size], className)}
    />
  );
}

export function PageLoader({ text = "Loading Restro OS..." }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center space-y-3 p-8">
      <Spinner size="lg" />
      <p className="text-xs font-semibold uppercase tracking-wider text-restro-600">
        {text}
      </p>
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-restro-200/60", className)}
      {...props}
    />
  );
}
