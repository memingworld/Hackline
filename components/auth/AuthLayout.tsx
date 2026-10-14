import React from "react";
import Link from "next/link";
import { Sparkles, Terminal, ShieldCheck, Zap } from "lucide-react";

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
    <div className="relative min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT SIDE: Form & Interactive Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10 max-w-2xl mx-auto lg:max-w-none w-full">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-white transition-colors group-hover:border-zinc-700">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-white font-mono">
                HACK<span className="text-zinc-400">LINE</span>
              </span>
              <span className="block text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                The Hackathon OS
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Online</span>
          </div>
        </div>

        {/* Center Card */}
        <div className="my-auto py-10 w-full max-w-md mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-mono text-zinc-400 mb-3">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Production-Grade Auth</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {heading}
            </h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              {subheading}
            </p>
          </div>

          {/* Form Content / Children */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.03] to-transparent pointer-events-none" />
            <div className="relative z-10">{children}</div>
          </div>

          {/* Alternate Link Footer */}
          <div className="mt-6 text-center text-xs text-zinc-400">
            {alternateLink.prompt}{" "}
            <Link
              href={alternateLink.href}
              className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
            >
              {alternateLink.label}
            </Link>
          </div>
        </div>

        {/* Bottom Trust Meta */}
        <div className="flex items-center justify-between border-t border-zinc-900 pt-6 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>End-to-End Encrypted Sessions</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Hackline Inc.</span>
        </div>
      </div>

      {/* RIGHT SIDE: Abstract Geometric & Gradient Mesh Showcase */}
      <div className="relative hidden lg:flex flex-1 items-center justify-center overflow-hidden border-l border-zinc-800/80 bg-zinc-950">
        {/* Procedural Gradient Mesh and Radial Lights */}
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-600/25 via-indigo-900/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-violet-600/20 via-purple-900/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        {/* Geometric Grid Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient Angled Accent Rays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none" />

        {/* Floating Bento Showcase Cards */}
        <div className="relative z-10 w-full max-w-lg p-8 space-y-6">
          {/* Main Hero Card */}
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 backdrop-blur-2xl shadow-2xl shadow-black/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white tracking-tight">
                  High-Velocity Squad Sync
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Engineered for 36-hour sprint victories
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Auto-extract hackathons from Unstop, Devfolio, and Devpost. Deploy
              saved 4-person squads, tag duties, and lock in submission checklists
              with zero friction.
            </p>

            {/* Micro Feature Matrix */}
            <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
              <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">
                  Submission Rate
                </span>
                <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                  98.4%
                </span>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">
                  Calendar Sync
                </span>
                <span className="text-xl font-bold text-indigo-300 font-mono mt-0.5 block">
                  1-Click
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Floating Interactive Indicator */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-xs">
                <span className="text-zinc-200 font-medium block">
                  Verification Active
                </span>
                <span className="text-zinc-500 text-[11px]">
                  Protected by Supabase SSR & Resend SMTP
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-400 border border-zinc-800 rounded-md px-2 py-0.5 bg-black/40">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
