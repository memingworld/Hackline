"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-9 px-3 text-xs rounded-lg gap-1.5",
      md: "h-11 px-4 text-sm rounded-xl gap-2",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:brightness-110 border border-indigo-400/30",
      secondary:
        "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60 shadow-sm",
      outline:
        "bg-transparent text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60",
      ghost:
        "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            {/* Custom pulsating dots animation instead of generic spinner */}
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
            </span>
            {loadingText ? <span>{loadingText}</span> : children}
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
