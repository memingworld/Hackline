import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
  alternateLink: {
    prompt: string;
    label: string;
    href: string;
  };
}

export function AuthLayout({
  children,
  heading,
  subheading,
  alternateLink,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-[100dvh] w-full bg-canvas text-parchment flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-x-hidden selection:bg-mustard/20 selection:text-parchment transition-colors duration-200">
      {/* Ambient background glow & subtle grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--border-primary, rgba(229,169,60,0.15)) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] blur-[140px] rounded-full opacity-10 pointer-events-none"
          style={{ backgroundColor: "var(--accent-mustard, #e5a93c)" }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-clay hover:text-parchment font-mono transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-surface-border bg-surface px-3 py-1 text-[11px] text-clay font-mono backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-mustard animate-pulse" />
          <span>Encrypted Session</span>
        </div>
      </header>

      {/* Center Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mb-3 group transition-opacity hover:opacity-90"
          >
            <span className="font-bold tracking-wider text-lg text-parchment font-mono">
              HACKLINE
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-mustard" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-parchment">
            {heading}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-clay leading-relaxed max-w-sm mx-auto">
            {subheading}
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl bg-surface border border-surface-border p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {children}
        </div>

        {/* Alternate Link Footer */}
        <div className="mt-6 text-center text-xs text-clay">
          {alternateLink.prompt}{" "}
          <Link
            href={alternateLink.href}
            className="font-medium text-mustard hover:text-mustard-hover underline underline-offset-4 transition-colors"
          >
            {alternateLink.label}
          </Link>
        </div>
      </main>

      {/* Bottom Trust Meta */}
      <footer className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between border-t border-surface-border pt-4 pb-2 text-[11px] text-clay/70 font-mono">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-mustard" />
          <span>Encrypted & Verified</span>
        </div>
        <span>&copy; {new Date().getFullYear()} Hackline</span>
      </footer>
    </div>
  );
}
