"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-mono font-medium text-[#a89a8c] tracking-wider uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full rounded-xl bg-[#181410] px-3.5 py-2 text-xs sm:text-sm text-[#fef3c7] placeholder:text-[#a89a8c]/50",
              "border border-[rgba(229,169,60,0.20)] transition-all duration-150 outline-none",
              "focus:border-[#e5a93c] focus:ring-1 focus:ring-[#e5a93c]/30 focus:bg-[#1f1b16]",
              error && "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30 text-rose-100",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-[11px] text-rose-400 font-mono tracking-tight animate-fade-in">
            {error}
          </p>
        ) : hint ? (
          <p className="text-[11px] text-[#a89a8c] font-mono">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
