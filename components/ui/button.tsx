"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
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
      "relative inline-flex items-center justify-center font-medium transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-10 px-4 text-xs font-semibold rounded-xl gap-2",
      lg: "h-11 px-5 text-sm font-semibold rounded-xl gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-white text-zinc-950 font-semibold hover:bg-zinc-200 border border-white/20 shadow-sm shadow-black/40",
      secondary:
        "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-800 shadow-sm",
      outline:
        "bg-transparent text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60",
      ghost:
        "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900",
      destructive:
        "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
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
