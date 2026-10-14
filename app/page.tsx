import Link from "next/link";
import {
  Terminal,
  ArrowRight,
  Zap,
  Sparkles,
  Calendar,
  Users2,
  CheckCircle2,
  Shield,
  Layers,
  ExternalLink,
  Bell,
  Code2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] bg-[#09090b] text-zinc-100 overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-200">
      {/* Ambient Lighting & Subtle Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-indigo-600/15 via-indigo-900/5 to-transparent blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* FLOATING ISLAND NAVBAR */}
      <header className="relative z-30 pt-6 px-4 max-w-6xl mx-auto">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-zinc-900/70 px-5 py-2.5 backdrop-blur-xl shadow-2xl shadow-black/40">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-sm shadow-indigo-500/30 border border-indigo-400/30">
              <Terminal className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
            </div>
            <span className="font-bold tracking-tight text-white font-mono text-sm">
              HACK<span className="text-indigo-400">LINE</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#scraper" className="hover:text-white transition-colors">
              Magic Scraper
            </a>
            <a href="#squads" className="hover:text-white transition-colors">
              Squad Sync
            </a>
            <a href="#vault" className="hover:text-white transition-colors">
              Idea Vault
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-2.5 w-2.5 text-white" />
              </div>
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-24 md:pt-28 md:pb-32 px-4 max-w-5xl mx-auto text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs text-indigo-300 backdrop-blur-md mb-8 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="font-mono uppercase tracking-wider text-[11px]">
            The Operating System for Hackathon Teams
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
          Stop scrambling at 3:00 AM.
          <span className="block mt-1 bg-gradient-to-r from-indigo-400 via-indigo-200 to-white bg-clip-text text-transparent">
            Dominate hackathons with squad sync.
          </span>
        </h1>

        {/* Hero Subtext (Concise, strictly < 25 words) */}
        <p className="mt-6 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          From Unstop and Devfolio auto-scrapes to one-click squad deployment,
          live duty rosters, and Google Calendar timeline gates.
        </p>

        {/* Hero CTA Button-in-Button */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-indigo-400/30 transition-all active:scale-[0.98]"
          >
            <span>Initialize Squad Workspace</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-6 py-3.5 text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-all backdrop-blur-md"
          >
            <Zap className="h-4 w-4 text-indigo-400" />
            <span>Launch Live Demo</span>
          </Link>
        </div>

        {/* Real Metrics Micro-Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto pt-10 border-t border-white/5">
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/40">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              Platforms Supported
            </span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              7 Hubs
            </span>
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/40">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              Squad Assembly
            </span>
            <span className="text-lg font-bold text-indigo-400 font-mono mt-0.5 block">
              1-Click
            </span>
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/40">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              On-Time Rate
            </span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
              99.2%
            </span>
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/40">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">
              Calendar Sync
            </span>
            <span className="text-lg font-bold text-zinc-200 font-mono mt-0.5 block">
              Real-Time
            </span>
          </div>
        </div>
      </section>

      {/* ASYMMETRICAL BENTO GRID */}
      <section id="features" className="relative z-10 py-20 px-4 max-w-6xl mx-auto">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Engineered like a high-velocity command center
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Everything your 4-person crew needs to go from problem statement to
            winning pitch without missing a deadline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: The Magic Link Scraper (col-span-8) */}
          <div className="md:col-span-8 rounded-[2rem] p-2 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-zinc-900/90 p-6 sm:p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 border border-zinc-800 rounded-md px-2 py-0.5 bg-black/40">
                    FastAPI + Playwright
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  The "Magic" Link Scraper
                </h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-lg">
                  Paste any URL from Devfolio, Unstop, Devpost, Luma, or
                  Hack2skill. Our microservice instantly extracts prize pools,
                  schedules, and guidelines with LLM-fallback parsing.
                </p>
              </div>

              {/* Visual Mini Mockup */}
              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-zinc-400 text-[11px] pb-2 border-b border-zinc-800/80">
                  <span className="text-indigo-400">POST</span>
                  <span>/api/scrape?url=https://devfolio.co/ethindia</span>
                </div>
                <div className="pt-2 text-emerald-400 text-[11px] flex items-center justify-between">
                  <span>✓ 200 OK — Extracted Title, \$250,000 Pool, 3 Milestones</span>
                  <span className="text-zinc-500">420ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Saved Squads (col-span-4) */}
          <div className="md:col-span-4 rounded-[2rem] p-2 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-zinc-900/90 p-6 sm:p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mb-4">
                  <Users2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  1-Click Saved Squads
                </h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Store your recurring 4-person dream team. Add everyone to a
                  new event with pre-assigned duties instantly.
                </p>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-xs">
                  <span className="text-zinc-200">Alex V.</span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Next.js Frontend
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-xs">
                  <span className="text-zinc-200">Devon R.</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    FastAPI / AI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Google Calendar Timeline (col-span-4) */}
          <div className="md:col-span-4 rounded-[2rem] p-2 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-zinc-900/90 p-6 sm:p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mb-4">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Google Calendar Gates
                </h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Lock all critical submission windows into your team's
                  calendar with automated reminders so nobody sleeps past
                  deadline.
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300 flex items-center gap-2">
                <Bell className="h-4 w-4 shrink-0" />
                <span>Syncs Registration, Code Freeze & Pitch times</span>
              </div>
            </div>
          </div>

          {/* Card 4: Idea Vault & Pre-Flight Checklist (col-span-8) */}
          <div className="md:col-span-8 rounded-[2rem] p-2 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-zinc-900/90 p-6 sm:p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 border border-zinc-800 rounded-md px-2 py-0.5 bg-black/40">
                    Pre-Flight Safety
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Idea Vault & Pre-Flight Checklists
                </h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-lg">
                  Vote on problem statements with blind squad polling. Lock in
                  mandatory submission safety checks (Public Repo? Video
                  working? Teammates added?) before the buzzer sounds.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Public GitHub verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Loom video link verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>WhatsApp T-2h alerted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-zinc-900 py-10 px-4 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span className="font-mono font-medium text-zinc-400">HACKLINE</span>
          <span>— Built for competitive builders</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-zinc-300 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-zinc-300 transition-colors">
            Register
          </Link>
          <span>&copy; {new Date().getFullYear()} Hackline Inc.</span>
        </div>
      </footer>
    </div>
  );
}
