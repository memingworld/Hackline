import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
    <div className="relative min-h-[100dvh] w-full bg-[#14110e] text-[#fef3c7] flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-x-hidden selection:bg-[#e5a93c]/20 selection:text-[#fef3c7]">
      {/* Ambient background glow & subtle grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(229,169,60,0.15) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#e5a93c]/[0.03] blur-[140px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <Link
          href="/"
          className="group flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <div className="flex items-center gap-1">
            <span className="font-bold tracking-wider text-base text-[#fef3c7] font-mono">
              HACKLINE
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5a93c]" />
          </div>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-[rgba(229,169,60,0.25)] bg-[#1f1b16] px-3 py-1 text-[11px] text-[#a89a8c] font-mono backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e5a93c] animate-pulse" />
          <span>Encrypted Session</span>
        </div>
      </header>

      {/* Center Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fef3c7]">
            {heading}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#a89a8c] leading-relaxed max-w-sm mx-auto">
            {subheading}
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl bg-[#1f1b16] border border-[rgba(229,169,60,0.22)] p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {children}
        </div>

        {/* Alternate Link Footer */}
        <div className="mt-6 text-center text-xs text-[#a89a8c]">
          {alternateLink.prompt}{" "}
          <Link
            href={alternateLink.href}
            className="font-medium text-[#e5a93c] hover:text-[#d99b2e] underline underline-offset-4 transition-colors"
          >
            {alternateLink.label}
          </Link>
        </div>
      </main>

      {/* Bottom Trust Meta */}
      <footer className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between border-t border-[rgba(229,169,60,0.15)] pt-4 pb-2 text-[11px] text-[#a89a8c]/70 font-mono">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#e5a93c]" />
          <span>Encrypted & Verified</span>
        </div>
        <span>&copy; {new Date().getFullYear()} Hackline</span>
      </footer>
    </div>
  );
}
