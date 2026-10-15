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
        "bg-[#e5a93c] text-[#14110e] font-bold hover:bg-[#d99b2e] border border-[#f3c768]/40 shadow-sm shadow-black/40",
      secondary:
        "bg-[#1f1b16] text-[#fef3c7] hover:bg-[#28231d] border border-[rgba(229,169,60,0.22)] shadow-sm",
      outline:
        "bg-transparent text-[#fef3c7] hover:text-white border border-[rgba(229,169,60,0.25)] hover:border-[rgba(229,169,60,0.45)] hover:bg-[#1f1b16]/60",
      ghost:
        "bg-transparent text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#1f1b16]",
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
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{loadingText || "Processing..."}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
