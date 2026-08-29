import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-subtle",
        secondary: "bg-restro-100 text-restro-900 hover:bg-restro-200 border border-restro-200",
        outline: "border border-restro-300 bg-surface text-restro-900 hover:bg-restro-50 hover:border-restro-400 shadow-subtle",
        ghost: "text-restro-700 hover:bg-restro-100 hover:text-restro-900",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-subtle",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs rounded-sm",
        lg: "h-12 px-6 text-base rounded-md",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
