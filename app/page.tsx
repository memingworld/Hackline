import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Code2,
  Calendar,
  Users2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { createClient } from "@/utils/supabase/server";

export default async function LandingPage() {
  // Check if visitor is logged in to adapt the CTA button without redirecting away
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    isAuthenticated = false;
  }

  return (
    <div className="relative min-h-[100dvh] bg-canvas text-parchment overflow-x-hidden selection:bg-mustard/20 selection:text-parchment transition-colors duration-200">
      {/* Subtle Matrix Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--border-primary, rgba(229,169,60,0.18)) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[140px] rounded-full pointer-events-none opacity-20"
          style={{ backgroundColor: "var(--accent-mustard, #e5a93c)" }}
        />
      </div>

      {/* Floating Header */}
      <header className="relative z-30 pt-6 px-4 max-w-5xl mx-auto">
        <nav className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface/90 px-4 sm:px-5 py-3 backdrop-blur-xl shadow-xl transition-colors">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-wider text-base text-parchment font-mono">
                HACKLINE
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-mustard mb-0.5" />
            </div>
          </Link>

          {/* Nav Controls: Theme Switcher & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Theme Selector */}
            <ThemeSelector variant="compact" />

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-mustard text-canvas hover:bg-mustard-hover px-3.5 py-1.5 text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                <LayoutDashboard className="h-3 w-3" />
                <span>Workspace</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-mono text-clay hover:text-parchment px-2.5 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-mustard text-canvas hover:bg-mustard-hover px-3.5 py-1.5 text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-14 md:pt-24 md:pb-20 px-4 max-w-4xl mx-auto text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-mustard/30 bg-mustard/10 px-3.5 py-1 text-xs text-mustard backdrop-blur-md mb-6 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-mustard animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Precision Command System for Hackathon Squads
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-parchment leading-[1.12] max-w-3xl mx-auto">
          The command center for your 36-hour sprint.
        </h1>

        {/* Hero Subtext */}
        <p className="mt-5 text-sm sm:text-base text-clay max-w-2xl mx-auto leading-relaxed">
          From Devpost, Unstop, Devfolio, Devnovate, and Luma instant extractions to one-click squad assembly,
          role duty rosters, and Telegram-synchronized deadline gates.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-mustard hover:bg-mustard-hover px-5 py-3 text-xs font-semibold text-canvas shadow-md transition-all active:scale-[0.98]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Go to Command Center</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-mustard hover:bg-mustard-hover px-5 py-3 text-xs font-semibold text-canvas shadow-md transition-all active:scale-[0.98]"
              >
                <span>Initialize Squad Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface hover:bg-surface-elevated px-5 py-3 text-xs font-medium text-parchment transition-all backdrop-blur-md"
              >
                <Zap className="h-3.5 w-3.5 text-mustard" />
                <span>Sign In to Squad</span>
              </Link>
            </>
          )}
        </div>

        {/* Supported Platforms Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xl mx-auto">
          <span className="text-[11px] font-mono text-clay mr-1 uppercase tracking-wider">
            Supported Hubs:
          </span>
          {["Devpost", "Unstop", "Devfolio", "Devnovate", "Luma", "Hack2skill", "Custom Sprints"].map((p) => (
            <span
              key={p}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-surface-border bg-surface text-parchment shadow-sm"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Core Specs Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pt-8 border-t border-surface-border text-left">
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface">
            <span className="text-[10px] text-clay uppercase font-mono tracking-wider block">
              Platforms
            </span>
            <span className="text-sm font-bold text-parchment font-mono mt-0.5 block truncate">
              5+ Hubs & Custom
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface">
            <span className="text-[10px] text-clay uppercase font-mono tracking-wider block">
              Squad Assembly
            </span>
            <span className="text-sm font-bold text-parchment font-mono mt-0.5 block">
              Instant Invite
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface">
            <span className="text-[10px] text-clay uppercase font-mono tracking-wider block">
              Telegram Gates
            </span>
            <span className="text-sm font-bold text-mustard font-mono mt-0.5 block">
              T-24h & T-2h
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface">
            <span className="text-[10px] text-clay uppercase font-mono tracking-wider block">
              Pre-Flight Safety
            </span>
            <span className="text-sm font-bold text-steel font-mono mt-0.5 block">
              100% Verified
            </span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="relative z-10 py-16 px-4 max-w-5xl mx-auto">
        <div className="mb-10 text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-parchment">
            Engineered for velocity and submission peace of mind
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-clay max-w-2xl leading-relaxed">
            Everything your squad needs to go from problem statement to winning pitch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Bento 1: Magic Scraper */}
          <div className="md:col-span-7 rounded-2xl border border-surface-border bg-surface p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mustard">
                  <Code2 className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono text-steel border border-steel/30 rounded px-2 py-0.5 bg-steel/15 font-medium">
                  Official Platform APIs
                </span>
              </div>
              <h3 className="text-base font-bold text-parchment tracking-tight">
                Magic Link Scraper
              </h3>
              <p className="mt-1.5 text-xs text-clay leading-relaxed max-w-lg">
                Paste any URL from Devpost, Unstop, Devfolio, Devnovate, or Luma. Hackline auto-queries official endpoints to extract prize pools, rules, and milestone gates in milliseconds.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-surface-border bg-surface-sunken p-3.5 font-mono text-xs">
              <div className="flex items-center gap-2 text-clay text-[11px] pb-2 border-b border-surface-border">
                <span className="text-mustard font-bold">POST</span>
                <span className="truncate">/api/scrape?url=https://nebiusglobalaihackathon.devpost.com</span>
              </div>
              <div className="pt-2 text-parchment text-[11px] flex items-center justify-between">
                <span>✓ Extracted: Global AI Hackathon ($50,000 Pool)</span>
                <span className="text-clay font-mono">180ms</span>
              </div>
            </div>
          </div>

          {/* Bento 2: Squad Sync */}
          <div className="md:col-span-5 rounded-2xl border border-surface-border bg-surface p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mustard mb-4">
                <Users2 className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-parchment tracking-tight">
                Squad Duty Allocation
              </h3>
              <p className="mt-1.5 text-xs text-clay leading-relaxed">
                Assign roles across Frontend, AI Backend, Pitch Deck, and Demo. Onboard teammates in 1 click with private invite codes.
              </p>
            </div>

            <div className="mt-6 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-sunken px-3 py-2">
                <span className="text-parchment">Alex V.</span>
                <span className="text-[10px] text-parchment bg-surface-elevated border border-surface-border px-2 py-0.5 rounded font-medium">
                  Squad Lead & Next.js
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-sunken px-3 py-2">
                <span className="text-parchment">Devon R.</span>
                <span className="text-[10px] text-steel bg-steel/15 border border-steel/30 px-2 py-0.5 rounded font-medium">
                  FastAPI / ML Ops
                </span>
              </div>
            </div>
          </div>

          {/* Bento 3: Timeline Gates */}
          <div className="md:col-span-5 rounded-2xl border border-surface-border bg-surface p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mustard mb-4">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-parchment tracking-tight">
                Interactive Calendar & Telegram Sync
              </h3>
              <p className="mt-1.5 text-xs text-clay leading-relaxed">
                Automated alerts dispatched to private Telegram chats at T-24h and T-2h before code freeze.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-surface-border bg-surface-sunken p-3 text-xs text-parchment flex items-center gap-2 font-mono">
              <Clock className="h-4 w-4 text-mustard shrink-0" />
              <span>Next Gate: Code Freeze (T-2h alert armed)</span>
            </div>
          </div>

          {/* Bento 4: Pre-Flight Safety */}
          <div className="md:col-span-7 rounded-2xl border border-surface-border bg-surface p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mustard">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono text-mustard border border-mustard/30 bg-mustard/15 rounded px-2 py-0.5 font-medium">
                  Pre-Flight Verification
                </span>
              </div>
              <h3 className="text-base font-bold text-parchment tracking-tight">
                Idea Vault & Submission Kit Exporter
              </h3>
              <p className="mt-1.5 text-xs text-clay leading-relaxed max-w-md">
                Blind squad voting on ideas, live deliverable health checks, and 1-click platform-ready submission kits.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-surface-border">
              <div className="flex items-center gap-2 text-xs text-parchment">
                <CheckCircle2 className="h-3.5 w-3.5 text-mustard" />
                <span>Public Repo verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-parchment">
                <CheckCircle2 className="h-3.5 w-3.5 text-mustard" />
                <span>Demo link active</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-parchment">
                <CheckCircle2 className="h-3.5 w-3.5 text-mustard" />
                <span>Team kit ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-border py-8 px-4 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-clay font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-parchment">HACKLINE</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-mustard" />
          <span>Precision Hackathon Command System</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-parchment transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-parchment transition-colors">
            Register
          </Link>
          <Link href="/dashboard" className="hover:text-parchment transition-colors">
            Command Center
          </Link>
          <span>&copy; {new Date().getFullYear()} Hackline</span>
        </div>
      </footer>
    </div>
  );
}
