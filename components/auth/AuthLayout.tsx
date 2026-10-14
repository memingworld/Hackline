import React from "react";
import Link from "next/link";
import { Terminal, ShieldCheck } from "lucide-react";

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
    <div className="relative min-h-[100dvh] w-full bg-[#09090b] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-x-hidden selection:bg-zinc-800 selection:text-white">
      {/* Ambient background glow & subtle grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #71717a 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/[0.04] blur-[140px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-white transition-transform group-hover:scale-105 shadow-inner">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-sm text-white font-mono">
              HACK<span className="text-zinc-400">LINE</span>
            </span>
            <span className="text-[9px] font-mono uppercase bg-zinc-800 text-emerald-400 border border-emerald-500/20 px-1 rounded">
              v1.0
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] text-zinc-400 font-mono backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Encrypted</span>
        </div>
      </header>

      {/* Center Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            {heading}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            {subheading}
          </p>
        </div>

        {/* Card Container with Doppelrand */}
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] shadow-2xl">
          <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
            {children}
          </div>
        </div>

        {/* Alternate Link Footer */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          {alternateLink.prompt}{" "}
          <Link
            href={alternateLink.href}
            className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
          >
            {alternateLink.label}
          </Link>
        </div>
      </main>

      {/* Bottom Trust Meta */}
      <footer className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between border-t border-zinc-900/80 pt-4 pb-2 text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Encrypted Session</span>
        </div>
        <span>&copy; {new Date().getFullYear()} Hackline OS</span>
      </footer>
    </div>
  );
}
