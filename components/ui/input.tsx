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
            className="block text-[11px] font-mono font-medium text-clay tracking-wider uppercase"
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
              "w-full rounded-xl bg-canvas px-3.5 py-2 text-xs sm:text-sm text-parchment placeholder:text-clay/50",
              "border border-surface-border transition-all duration-150 outline-none",
              "focus:border-mustard focus:ring-1 focus:ring-mustard/30 focus:bg-surface",
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
          <p className="text-[11px] text-clay font-mono">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
