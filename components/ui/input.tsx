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
            className="block text-[11px] font-mono font-medium text-zinc-400 tracking-wider uppercase"
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
              "w-full rounded-xl bg-zinc-900/60 px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500",
              "border border-zinc-800 transition-all duration-150 outline-none",
              "focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 focus:bg-zinc-900",
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
          <p className="text-[11px] text-zinc-500 font-mono">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
