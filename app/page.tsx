import Link from "next/link";
import {
  Terminal,
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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] bg-[#09090b] text-zinc-100 overflow-x-hidden selection:bg-zinc-800 selection:text-white">
      {/* Subtle Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #71717a 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-zinc-800/20 blur-[130px] rounded-full" />
      </div>

      {/* Floating Header */}
      <header className="relative z-30 pt-6 px-4 max-w-5xl mx-auto">
        <nav className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-5 py-3 backdrop-blur-xl shadow-xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/80 text-white transition-transform group-hover:scale-105 shadow-inner">
              <Terminal className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white font-mono text-sm">
                HACK<span className="text-zinc-400">LINE</span>
              </span>
              <span className="text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700 px-1 rounded">
                v1.0
              </span>
            </div>
          </Link>

          {/* Minimal Auth Direct Nav */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-20 md:pt-28 md:pb-24 px-4 max-w-4xl mx-auto text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-zinc-400">
            ENGINEERED FOR COMPETITIVE HACKATHON CREWS
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1] max-w-3xl mx-auto">
          The command center for your 36-hour sprint.
        </h1>

        {/* Hero Subtext */}
        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          From Devpost, Unstop, Devfolio, and Luma instant extractions to one-click squad assembly,
          role duty rosters, and Telegram-synchronized deadline gates.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-950 shadow-md transition-all active:scale-[0.98]"
          >
            <span>Initialize Squad Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-5 py-3 text-xs font-medium text-zinc-300 hover:text-white transition-all backdrop-blur-md"
          >
            <Zap className="h-3.5 w-3.5 text-zinc-400" />
            <span>Launch Live Demo</span>
          </Link>
        </div>

        {/* Supported Platforms Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xl mx-auto">
          <span className="text-[11px] font-mono text-zinc-500 mr-1 uppercase tracking-wider">
            Supported Hubs:
          </span>
          {["Devpost", "Unstop", "Devfolio", "Luma", "Hack2skill", "Custom Events"].map((p) => (
            <span
              key={p}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-zinc-800/80 bg-zinc-950/80 text-zinc-300 shadow-sm"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Core Specs Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pt-8 border-t border-zinc-900 text-left">
          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              Platforms
            </span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block truncate">
              5+ Hubs & Custom
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              Squad Assembly
            </span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              Instant Invite
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              Telegram Gates
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
              T-24h & T-2h
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              Pre-Flight Safety
            </span>
            <span className="text-sm font-bold text-zinc-200 font-mono mt-0.5 block">
              100% Verified
            </span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="relative z-10 py-16 px-4 max-w-5xl mx-auto">
        <div className="mb-10 text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
            Engineered for velocity and submission peace of mind
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Everything your 4-person crew needs to go from problem statement to winning pitch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Bento 1: Magic Scraper */}
          <div className="md:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                  <Code2 className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/20 rounded px-2 py-0.5 bg-emerald-500/10">
                  Devpost, Unstop & Devfolio APIs
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Magic Link Scraper
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed max-w-lg">
                Paste any URL from Devpost, Unstop, Devfolio, or Luma. Hackline auto-queries official APIs to extract prize pools, rules, and milestone gates in milliseconds.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 font-mono text-xs">
              <div className="flex items-center gap-2 text-zinc-400 text-[11px] pb-2 border-b border-zinc-800/80">
                <span className="text-emerald-400 font-bold">POST</span>
                <span className="truncate">/api/scrape?url=https://nebiusglobalaihackathon.devpost.com</span>
              </div>
              <div className="pt-2 text-zinc-300 text-[11px] flex items-center justify-between">
                <span>✓ Extracted: Nebius x NVIDIA AI Hackathon ($50,000 Pool)</span>
                <span className="text-zinc-500 font-mono">180ms</span>
              </div>
            </div>
          </div>

          {/* Bento 2: Squad Sync */}
          <div className="md:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 mb-4">
                <Users2 className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Squad Duty Allocation
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Assign roles across Frontend, AI Backend, Pitch Deck, and Demo. Onboard teammates in 1 click with private invite codes.
              </p>
            </div>

            <div className="mt-6 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <span className="text-zinc-200">Alex V.</span>
                <span className="text-[10px] text-zinc-300 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
                  Squad Lead & Next.js
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <span className="text-zinc-200">Devon R.</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  FastAPI / ML Ops
                </span>
              </div>
            </div>
          </div>

          {/* Bento 3: Timeline Gates */}
          <div className="md:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 mb-4">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Google Calendar & Telegram Sync
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Automated alerts dispatched to private Telegram chats at T-24h and T-2h before code freeze.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 flex items-center gap-2 font-mono">
              <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Next Gate: Code Freeze (T-2h alert armed)</span>
            </div>
          </div>

          {/* Bento 4: Pre-Flight Safety */}
          <div className="md:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded px-2 py-0.5">
                  Pre-Flight Verification
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Idea Vault & Pre-Flight Checklist
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed max-w-md">
                Blind squad voting on problem statements. Mandatory submission verification checks before the buzzer sounds.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Public Repo verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Demo video active</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>All teammates added</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-8 px-4 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-bold text-zinc-300">HACKLINE</span>
          <span>— Sprint OS for Hackers</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-zinc-300 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-zinc-300 transition-colors">
            Register
          </Link>
          <span>&copy; {new Date().getFullYear()} Hackline</span>
        </div>
      </footer>
    </div>
  );
}
