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
            className="block text-xs font-medium text-zinc-300 tracking-wide uppercase"
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
              "w-full rounded-xl bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500",
              "border border-zinc-800/80 transition-all duration-150 outline-none backdrop-blur-sm",
              "focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/50 focus:bg-zinc-900/90",
              error && "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40 text-rose-100",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-rose-400 font-medium tracking-tight animate-fade-in">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-zinc-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
