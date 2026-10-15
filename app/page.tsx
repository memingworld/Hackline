import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Sparkles,
  Calendar,
  Users2,
  CheckCircle2,
  Code2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
  Flame,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] bg-[#14110e] text-[#fef3c7] overflow-x-hidden selection:bg-[#e5a93c]/20 selection:text-[#fef3c7]">
      {/* Subtle Warm Brass Background Matrix */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(229,169,60,0.18) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#e5a93c]/[0.03] blur-[140px] rounded-full" />
      </div>

      {/* Floating Bauhaus Header */}
      <header className="relative z-30 pt-6 px-4 max-w-5xl mx-auto">
        <nav className="flex items-center justify-between rounded-2xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16]/90 px-5 py-3.5 backdrop-blur-xl shadow-xl">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center gap-1">
              <span className="font-bold tracking-wider text-base text-[#fef3c7] font-mono">
                HACKLINE
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5a93c] mb-0.5" />
            </div>
          </Link>

          {/* Minimal Auth Direct Nav */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-mono text-[#a89a8c] hover:text-[#fef3c7] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#e5a93c] text-[#14110e] hover:bg-[#d99b2e] px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 md:pt-28 md:pb-24 px-4 max-w-4xl mx-auto text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(229,169,60,0.3)] bg-[#e5a93c]/10 px-3.5 py-1 text-xs text-[#e5a93c] backdrop-blur-md mb-6 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e5a93c] animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Precision Command System for Hackathon Squads
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#fef3c7] leading-[1.12] max-w-3xl mx-auto">
          The command center for your 36-hour sprint.
        </h1>

        {/* Hero Subtext */}
        <p className="mt-5 text-sm sm:text-base text-[#a89a8c] max-w-2xl mx-auto leading-relaxed">
          From Devpost, Unstop, Devfolio, Devnovate, and Luma instant extractions to one-click squad assembly,
          role duty rosters, and Telegram-synchronized deadline gates.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#e5a93c] hover:bg-[#d99b2e] px-5 py-3 text-xs font-semibold text-[#14110e] shadow-md transition-all active:scale-[0.98]"
          >
            <span>Initialize Squad Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(229,169,60,0.25)] bg-[#1f1b16] hover:bg-[#28231d] hover:border-[rgba(229,169,60,0.4)] px-5 py-3 text-xs font-medium text-[#fef3c7] transition-all backdrop-blur-md"
          >
            <Zap className="h-3.5 w-3.5 text-[#e5a93c]" />
            <span>Launch Live Demo</span>
          </Link>
        </div>

        {/* Supported Platforms Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xl mx-auto">
          <span className="text-[11px] font-mono text-[#a89a8c]/70 mr-1 uppercase tracking-wider">
            Supported Hubs:
          </span>
          {["Devpost", "Unstop", "Devfolio", "Devnovate", "Luma", "Hack2skill", "Custom Sprints"].map((p) => (
            <span
              key={p}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-[rgba(229,169,60,0.2)] bg-[#181410] text-[#fef3c7] shadow-sm"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Core Specs Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pt-8 border-t border-[rgba(229,169,60,0.15)] text-left">
          <div className="p-3.5 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#1f1b16]">
            <span className="text-[10px] text-[#a89a8c] uppercase font-mono tracking-wider block">
              Platforms
            </span>
            <span className="text-sm font-bold text-[#fef3c7] font-mono mt-0.5 block truncate">
              5+ Hubs & Custom
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#1f1b16]">
            <span className="text-[10px] text-[#a89a8c] uppercase font-mono tracking-wider block">
              Squad Assembly
            </span>
            <span className="text-sm font-bold text-[#fef3c7] font-mono mt-0.5 block">
              Instant Invite
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#1f1b16]">
            <span className="text-[10px] text-[#a89a8c] uppercase font-mono tracking-wider block">
              Telegram Gates
            </span>
            <span className="text-sm font-bold text-[#e5a93c] font-mono mt-0.5 block">
              T-24h & T-2h
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#1f1b16]">
            <span className="text-[10px] text-[#a89a8c] uppercase font-mono tracking-wider block">
              Pre-Flight Safety
            </span>
            <span className="text-sm font-bold text-[#7bb4d6] font-mono mt-0.5 block">
              100% Verified
            </span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="relative z-10 py-16 px-4 max-w-5xl mx-auto">
        <div className="mb-10 text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#fef3c7]">
            Engineered for velocity and submission peace of mind
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#a89a8c] max-w-2xl leading-relaxed">
            Everything your 4-person crew needs to go from problem statement to winning pitch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Bento 1: Magic Scraper */}
          <div className="md:col-span-7 rounded-2xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c]">
                  <Code2 className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono text-[#7bb4d6] border border-[rgba(74,130,166,0.35)] rounded px-2 py-0.5 bg-[#4a82a6]/15 font-medium">
                  Devpost, Unstop, Devfolio & Devnovate APIs
                </span>
              </div>
              <h3 className="text-base font-bold text-[#fef3c7] tracking-tight">
                Magic Link Scraper
              </h3>
              <p className="mt-1.5 text-xs text-[#a89a8c] leading-relaxed max-w-lg">
                Paste any URL from Devpost, Unstop, Devfolio, Devnovate, or Luma. Hackline auto-queries official APIs to extract prize pools, rules, and milestone gates in milliseconds.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#100d0a] p-3.5 font-mono text-xs">
              <div className="flex items-center gap-2 text-[#a89a8c] text-[11px] pb-2 border-b border-[rgba(229,169,60,0.15)]">
                <span className="text-[#e5a93c] font-bold">POST</span>
                <span className="truncate">/api/scrape?url=https://nebiusglobalaihackathon.devpost.com</span>
              </div>
              <div className="pt-2 text-[#fef3c7] text-[11px] flex items-center justify-between">
                <span>✓ Extracted: Nebius x NVIDIA AI Hackathon ($50,000 Pool)</span>
                <span className="text-[#a89a8c] font-mono">180ms</span>
              </div>
            </div>
          </div>

          {/* Bento 2: Squad Sync */}
          <div className="md:col-span-5 rounded-2xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] mb-4">
                <Users2 className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-[#fef3c7] tracking-tight">
                Squad Duty Allocation
              </h3>
              <p className="mt-1.5 text-xs text-[#a89a8c] leading-relaxed">
                Assign roles across Frontend, AI Backend, Pitch Deck, and Demo. Onboard teammates in 1 click with private invite codes.
              </p>
            </div>

            <div className="mt-6 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between rounded-lg border border-[rgba(229,169,60,0.2)] bg-[#100d0a] px-3 py-2">
                <span className="text-[#fef3c7]">Alex V.</span>
                <span className="text-[10px] text-[#fef3c7] bg-[#28231d] border border-[rgba(229,169,60,0.25)] px-2 py-0.5 rounded font-medium">
                  Squad Lead & Next.js
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[rgba(229,169,60,0.2)] bg-[#100d0a] px-3 py-2">
                <span className="text-[#fef3c7]">Devon R.</span>
                <span className="text-[10px] text-[#7bb4d6] bg-[#4a82a6]/15 border border-[rgba(74,130,166,0.35)] px-2 py-0.5 rounded font-medium">
                  FastAPI / ML Ops
                </span>
              </div>
            </div>
          </div>

          {/* Bento 3: Timeline Gates */}
          <div className="md:col-span-5 rounded-2xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] mb-4">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-[#fef3c7] tracking-tight">
                Interactive Calendar & Telegram Sync
              </h3>
              <p className="mt-1.5 text-xs text-[#a89a8c] leading-relaxed">
                Automated alerts dispatched to private Telegram chats at T-24h and T-2h before code freeze.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-[rgba(229,169,60,0.2)] bg-[#100d0a] p-3 text-xs text-[#fef3c7] flex items-center gap-2 font-mono">
              <Clock className="h-4 w-4 text-[#e5a93c] shrink-0" />
              <span>Next Gate: Code Freeze (T-2h alert armed)</span>
            </div>
          </div>

          {/* Bento 4: Pre-Flight Safety */}
          <div className="md:col-span-7 rounded-2xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono text-[#e5a93c] border border-[rgba(229,169,60,0.35)] bg-[#e5a93c]/15 rounded px-2 py-0.5 font-medium">
                  Pre-Flight Verification
                </span>
              </div>
              <h3 className="text-base font-bold text-[#fef3c7] tracking-tight">
                Idea Vault & Pre-Flight Checklist
              </h3>
              <p className="mt-1.5 text-xs text-[#a89a8c] leading-relaxed max-w-md">
                Blind squad voting on problem statements. Mandatory submission verification checks before the buzzer sounds.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-[rgba(229,169,60,0.15)]">
              <div className="flex items-center gap-2 text-xs text-[#fef3c7]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#e5a93c]" />
                <span>Public Repo verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#fef3c7]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#e5a93c]" />
                <span>Demo video active</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#fef3c7]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#e5a93c]" />
                <span>All teammates added</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(229,169,60,0.15)] py-8 px-4 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a89a8c]/70 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#fef3c7]">HACKLINE</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5a93c]" />
          <span>Precision Hackathon Command System</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-[#fef3c7] transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-[#fef3c7] transition-colors">
            Register
          </Link>
          <Link href="/dashboard" className="hover:text-[#fef3c7] transition-colors">
            Command Center
          </Link>
          <span>&copy; {new Date().getFullYear()} Hackline</span>
        </div>
      </footer>
    </div>
  );
}
