"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import {
  ArrowRight, Unplug, ShieldCheck, Eye,
  X, Menu, CheckCircle, ChevronDown,
  CircleCheck, AlertTriangle, Link2,
  WalletCards,
  TrendingUp, ListTree, ArrowDownToLine,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConditionBanner } from "@/components/condition-banner";
import { RunwayPreview } from "@/components/runway-preview";
import { ConfidencePill } from "@/components/financial-display";
import { FinancialEventIcon } from "@/components/financial-event-visual";

const display: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
const editorialItalic: React.CSSProperties = { fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 400 };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };
const SCENARIO_MOTION_MS = 600;

/* ── Timeline motif — appears exactly 3 times (hero, final CTA, + reserve) ── */
function TimelineMotif({ label, size = "default" }: { label: string; size?: "default" | "large" }) {
  const big = size === "large";
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <div className={`flex items-center gap-0 ${big ? "w-full max-w-md" : "w-56"}`}>
        <span className="h-px flex-1 bg-border" />
        <span className={`shrink-0 rounded-full bg-primary ${big ? "h-3 w-3" : "h-2 w-2"}`} />
        <span className="h-px flex-1 bg-border" />
      </div>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground" style={mono}>{label}</p>
    </div>
  );
}

function Reveal({ children, className = "", as: As = "div", id, style }: { children: React.ReactNode; className?: string; as?: "div" | "section"; id?: string; style?: React.CSSProperties }) {
  const Comp = As as "div";
  return <Comp data-reveal id={id} className={className} style={style}>{children}</Comp>;
}

/* ── Fires once when the element scrolls into view — drives auto-playing
   motion sequences instead of requiring a click. ── */
function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setInView(true);
      observer.disconnect();
    }, { threshold });
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ── Hero: real dashboard recreation in Clear state. Matches treasury.sh's
   actual hero, verified live: the frame and its content render at final
   position immediately on load — no scroll-linked motion, no stagger. ── */
function HeroDashboard({ play }: { play: boolean }) {
  const navItems = ["Dashboard", "Forecast", "Scenarios", "Transactions", "Accounts"];
  /* The runway waits until the hero reveal is complete, then latches on so
     scrolling back never resets or replays the product story. */
  const [runwayPlay, setRunwayPlay] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!play || runwayPlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setRunwayPlay(true), 120);
    return () => window.clearTimeout(timer);
  }, [play, runwayPlay]);
  return (
    <div className="fs-hero-app-shell h-full overflow-hidden rounded-[24px] border" style={{ boxShadow: "0 24px 70px rgba(0, 0, 0, 0.06), 0 0 72px rgba(212, 117, 74, 0.10)" }}>
      <div className="grid h-full sm:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr]">
        <aside className="fs-hero-sidebar hidden border-r px-4 py-5 sm:flex sm:flex-col">
          <div className="px-2"><Image src="/cusp-logo.svg?v=2" alt="Cusp" width={130} height={30} loading="eager" className="h-7 w-auto" /></div>
          <nav className="mt-4 flex flex-col gap-0.5">{navItems.map((item, index) => <div key={item} className={`relative rounded-xl px-3 py-2 text-[13px] leading-5 ${index === 0 ? "bg-card font-medium text-foreground shadow-[inset_0_0_0_1px_oklch(var(--border)),0_1px_2px_oklch(var(--foreground)/.04)]" : "text-muted-foreground"}`}>{item}</div>)}</nav>
        </aside>
        <main className="fs-hero-main min-w-0 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h3 className="text-[24px] font-medium leading-tight" style={display}>Good morning, Jordan.</h3><p className="mt-1.5 text-[13px] text-muted-foreground">Wednesday, July 24 · Here&apos;s your financial picture.</p></div>
          </div>

          {/* Primary forecast result — exact ConditionBanner used app-wide */}
          <div className="mt-3">
            <ConditionBanner condition="clear" padding="p-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[oklch(var(--fs-green))]">Clear</p>
              <h4 className="text-lg font-semibold tracking-tight text-foreground">You&apos;re on track for the next 30 days.</h4>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide opacity-70">Lowest in the next 30 days</p>
              <p className="mt-1 font-mono text-base font-semibold text-foreground">$1,840 · Aug 12</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Your projected balance stays comfortably above your safety buffer through August 23.</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>Based on balances updated Jul 24</span>
              </div>
            </ConditionBanner>
          </div>

          {/* Stat cards — same four cards as the real Dashboard */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <div className="fs-hero-product-card rounded-2xl border px-3.5 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Current balance</p>
              <p className="text-xl font-bold text-foreground leading-none font-mono">$2,740</p>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">Across active included accounts.</p>
            </div>
            <div className="fs-hero-product-card rounded-2xl border px-3.5 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Safe to Spend</p>
              <p className="text-xl font-bold text-[oklch(var(--fs-green))] leading-none font-mono">$1,340</p>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">Protects your plan through Aug 23.</p>
            </div>
            <div className="fs-hero-product-card rounded-2xl border px-3.5 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Safety buffer</p>
              <p className="text-lg font-semibold leading-none text-[oklch(var(--fs-green))]">Intact</p>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">$750 protected</p>
              <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-medium text-primary">Adjust <ArrowRight size={11} /></span>
            </div>
            <div className="fs-hero-product-card rounded-2xl border px-3.5 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Next important event</p>
              <p className="text-sm font-semibold text-foreground leading-tight truncate">Harbor View Apartments Rent</p>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">Aug 4 · −$1,650</p>
            </div>
          </div>

          {/* Cash-flow runway — same neutral rail and Clear-state semantics as the real Dashboard */}
          <section className="fs-hero-product-card mt-3 overflow-hidden rounded-2xl border p-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Cash-flow runway</p>
              <h4 className="mt-1 text-sm font-semibold">The moments shaping your next 30 days</h4>
            </div>
            <RunwayPreview play={runwayPlay} compact />
          </section>
        </main>
      </div>
    </div>
  );
}

/* Fast ease-out (no slow start) so the headline commits to fading the
   instant scrolling begins — reads as a sharp, decisive "boom" rather than
   a gradual reveal. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/* Hero's headline fade range and travel: a short scroll distance fades the
   headline out (opacity 1→0) and lifts it 28px, while the mockup underneath
   — pinned via `sticky`, never scaled or faded itself — is revealed as it
   clears. Kept short enough that a single scroll (even a small mouse-wheel
   notch) completes it in one motion. */
const HERO_FADE_RANGE = 60;
const HERO_FADE_TRAVEL = 28;
/* The nav is 64px tall. Stop the revealed wrapper 8px below it; its own 8px
   top inset creates a compact 16px visual gap without losing viewport fit. */
const HERO_MOCKUP_TOP = 72;
const HERO_PIN_HOLD = 300;

function ExpandingLandingHero({ isSignedIn, navigate }: { isSignedIn: boolean; navigate: (href: string) => void }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [mockupLift, setMockupLift] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      const pin = pinRef.current;
      const mockup = mockupRef.current;
      frame = 0;
      if (!pin || !mockup) return;
      const scrolledPast = Math.max(0, -pin.getBoundingClientRect().top);
      setFadeProgress(Math.min(1, scrolledPast / HERO_FADE_RANGE));
      const nextLift = Math.max(0, mockup.offsetTop - HERO_MOCKUP_TOP);
      setMockupLift((current) => Math.abs(current - nextLift) > 0.5 ? nextLift : current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const eased = easeOutCubic(fadeProgress);
  const headlineOpacity = 1 - eased;
  const headlineTranslate = -HERO_FADE_TRAVEL * eased;

  return (
    <section className="relative isolate bg-background">
      {/* Pinned scroll wrapper: the sticky frame holds the headline+mockup
          in place on screen while the spacer below supplies the extra
          scroll distance needed for the headline to fade/lift away and
          reveal the (unmoving) mockup underneath — same structure as
          treasury.sh's `md:sticky md:top-0` + spacer pattern, verified
          directly against its live DOM and scroll behavior. */}
      <div ref={pinRef} className="relative">
        <div className="md:sticky md:top-0 pt-24 pb-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] overflow-hidden">
            <div className="absolute left-[7%] top-[-280px] h-[610px] w-[760px] rounded-full bg-primary/[0.13] blur-[130px]" />
            <div className="absolute right-[-8%] top-[-90px] h-[480px] w-[560px] rounded-full bg-primary/[0.075] blur-[115px]" />
          </div>
          <div
            className="relative z-10 mx-auto max-w-[1080px] px-5 motion-reduce:!opacity-100 motion-reduce:!transform-none"
            style={{ opacity: headlineOpacity, transform: `translateY(${headlineTranslate}px)` }}
          >
            <div className="mx-auto max-w-3xl text-center">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />Now in private beta
              </span>
              <h1 className="mx-auto max-w-[940px] text-[40px] font-medium leading-[1.08] tracking-[-0.02em] sm:whitespace-nowrap sm:text-[50px]" style={display}>Your money, <span className="text-primary" style={editorialItalic}>before it happens.</span></h1>
              <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-relaxed text-muted-foreground">
                Cusp looks days and weeks ahead of your balance, so you see what&apos;s coming instead of finding out the morning of.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={() => navigate(isSignedIn ? "/app/dashboard" : "/sign-up")} className="fs-brand-action inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium">
                  {isSignedIn ? "Open dashboard" : "Get early access"} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
          {/* Fixed-size frame, matched to treasury.sh's actual hero card
              dimensions (verified against its live DOM): max-w-6xl inner
              frame inside a max-w-7xl section, h-[600px] on mobile,
              aspect-[16/10] from md up. It never scales, fades, or moves —
              only the headline above it animates as you scroll. */}
          <div
            ref={mockupRef}
            className="relative z-10 mx-auto mt-8 max-w-7xl px-5 pt-2 will-change-transform sm:mt-9 motion-reduce:!transform-none"
            style={{
              marginBottom: mockupLift > 0 ? `${-mockupLift}px` : undefined,
              transform: `translateY(${-mockupLift * eased}px)`,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-[-5%] top-[4%] h-[72%] w-[62%] rounded-full bg-primary/[0.30] blur-[100px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[-8%] right-[-6%] h-[66%] w-[58%] rounded-full bg-primary/[0.20] blur-[96px]"
            />
            <div
              data-hero-frame="cusp-native-v3"
              className="relative z-10 mx-auto h-[600px] w-full max-w-6xl overflow-hidden rounded-[24px] md:h-auto md:aspect-[16/10]"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.80))",
                border: "1px solid rgba(29,34,30,0.07)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.94), inset 0 -1px 0 rgba(29,34,30,0.035), 0 28px 80px rgba(29,34,30,0.10), 0 0 135px rgba(212,117,74,0.22)",
              }}
            >
              <HeroDashboard play={fadeProgress >= 1} />
            </div>
          </div>
        </div>
        {/* Extra scroll runway for the pin — desktop only, matching
            treasury.sh's mobile fallback of plain (unpinned) document flow. */}
        <div aria-hidden="true" className="hidden md:block" style={{ height: HERO_PIN_HOLD }} />
      </div>
    </section>
  );
}

function WhyDifferent() {
  const [comparisonFocus, setComparisonFocus] = useState<"past" | "future">("past");
  const isFuture = comparisonFocus === "future";
  return (
    <Reveal as="section" className="relative px-5 pb-16 pt-8">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>A different kind of money view</p>
        <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>Review the past. <span className="text-primary" style={editorialItalic}>Plan the next move.</span></h2>
      </div>
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="mx-auto mb-5 flex w-fit rounded-full border border-border bg-card p-1 shadow-sm" role="tablist" aria-label="Compare financial views">
          <button type="button" role="tab" aria-selected={!isFuture} onClick={() => setComparisonFocus("past")} className={`rounded-full px-5 py-2 text-sm transition-colors ${!isFuture ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Looking back</button>
          <button type="button" role="tab" aria-selected={isFuture} onClick={() => setComparisonFocus("future")} className={`rounded-full px-5 py-2 text-sm transition-colors ${isFuture ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Looking ahead</button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={comparisonFocus} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)] sm:p-8">
            <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${isFuture ? "bg-primary/15" : "bg-muted"}`} />
            <div className="relative flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-medium ${isFuture ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{isFuture ? "→" : "←"}</div><div><p className="text-xs text-muted-foreground">{isFuture ? "Cusp" : "Traditional finance apps"}</p><h3 className="font-medium text-lg">{isFuture ? "Looking ahead" : "Looking back"}</h3></div></div>
            <p className="relative mt-6 text-sm leading-relaxed text-muted-foreground">{isFuture ? "Cusp shows what the next few weeks may hold—and what to do if money gets tight." : "Most tools organize what already happened. Useful for review, but they can’t tell you if Friday will be tight."}</p>
            <div className="relative mt-7 grid gap-3 sm:grid-cols-3">{(isFuture ? ["Warns you before the tight day", "Labels confirmed and estimated events", "“$820 safe to spend until the 18th”"] : ["Reports money already spent", "Categories instead of timing", "“$200 spent on dining last month”"]).map((item) => <div key={item} className={`rounded-xl border p-3 text-sm ${isFuture ? "border-primary/25 bg-primary/[0.07] font-medium text-foreground" : "border-border bg-muted/50 text-muted-foreground"}`}>{item}</div>)}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

/* ── Clear / Watch / Tight ── */
const CONDITION_TABS = ["clear", "watch", "tight"] as const;
type ConditionKey = (typeof CONDITION_TABS)[number];
/* Exact wording used by the real Dashboard/Forecast condition banner
   (components/forecast-view.tsx resultTitle) — kept identical here so the
   marketing page never says something the product itself wouldn't. */
const CONDITION_COPY: Record<ConditionKey, { label: string; title: string; detail: string; icon: typeof CircleCheck; iconBg: string; iconText: string }> = {
  clear: {
    label: "Clear",
    title: "You're on track for the next 30 days.",
    detail: "Your projected balance stays comfortably above your safety buffer through the end of this forecast.",
    icon: CircleCheck,
    iconBg: "bg-[oklch(var(--fs-green-bg))]",
    iconText: "text-[oklch(var(--fs-green))]",
  },
  watch: {
    label: "Watch",
    title: "Your balance may feel tight around August 6.",
    detail: "Rent, an auto loan, and insurance land within three days of each other, five days before your next paycheck.",
    icon: Eye,
    iconBg: "bg-[oklch(var(--fs-amber-bg))]",
    iconText: "text-[oklch(var(--fs-amber))]",
  },
  tight: {
    label: "Tight",
    title: "Your balance may fall below your safety buffer on August 6.",
    detail: "Those same bills would leave your balance short of your buffer before it recovers on payday.",
    icon: AlertTriangle,
    iconBg: "bg-[oklch(var(--fs-red-bg))]",
    iconText: "text-[oklch(var(--fs-red))]",
  },
};

function ConditionSystem() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % CONDITION_TABS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const activeKey = CONDITION_TABS[activeIndex];
  const copy = CONDITION_COPY[activeKey];
  const Icon = copy.icon;

  return (
    <Reveal as="section" className="relative px-5 py-16">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>The state system</p>
          <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>
            Know when you&apos;re<br />
            <span className="relative inline-block h-[1.2em] overflow-hidden align-bottom">
              <AnimatePresence initial={false}>
                <motion.span
                  key={activeKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, position: "absolute" }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`inline-block whitespace-nowrap rounded-md px-2 ${copy.iconBg} ${copy.iconText}`}
                >
                  {copy.label.toLowerCase()}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            — and when that changes.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Cusp watches your forecast continuously and tells you which of three states you&apos;re in, in plain language, before it becomes a surprise.
          </p>
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground" style={mono}>See how it decides →</p>
        </div>
        <div className="relative min-h-[200px]">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, position: "absolute" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-0"
            >
              <ConditionBanner
                condition={activeKey}
                badge={
                  <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full border border-current/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${copy.iconText}`}>
                    <Icon size={12} />{copy.label}
                  </span>
                }
              >
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{copy.title}</h3>
                <p className="mt-2 text-sm text-foreground/80">{copy.detail}</p>
              </ConditionBanner>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Forecast section: real native chart + step-by-step + review low point ──
   Matches the app's own Step by Step numbers: Rent −1650→1090, Auto Loan
   −410→680, Insurance −180→500, Netflix −18→482, Electricity ~−113→369. */
const STEP_EVENTS = [
  { label: "Rent", day: "Aug 4", change: -1650, balance: 1090, estimated: false },
  { label: "Auto Loan", day: "Aug 5", change: -410, balance: 680, estimated: false },
  { label: "Insurance", day: "Aug 6", change: -180, balance: 500, estimated: false },
  { label: "Netflix", day: "Aug 12", change: -18, balance: 482, estimated: false },
  { label: "Electricity", day: "Aug 15", change: -113, balance: 369, estimated: true },
] as const;

const FORECAST_CHART_MASTER = [
  { day: "Jul 24", projected: 2740 },
  { day: "Jul 29", projected: 2600 },
  { day: "Aug 4", projected: 1090 },
  { day: "Aug 5", projected: 680 },
  { day: "Aug 6", projected: 500 },
  { day: "Aug 12", projected: 482 },
  { day: "Aug 15", projected: 369 },
  { day: "Aug 16", projected: 2769 },
  { day: "Aug 22", projected: 2610 },
  { day: "Sep 1", projected: 2450 },
  { day: "Sep 13", projected: 2300 },
  { day: "Sep 22", projected: 2700 },
  { day: "Oct 2", projected: 2550 },
  { day: "Oct 12", projected: 2400 },
  { day: "Oct 22", projected: 2650 },
] as const;
const FORECAST_HORIZON_CUTOFF: Record<30 | 60 | 90, string> = { 30: "Aug 22", 60: "Sep 22", 90: "Oct 22" };

type ForecastMode = "forecast" | "steps" | "lowpoint";
const FORECAST_MODES = [
  { key: "forecast" as const, label: "Forecast", icon: TrendingUp, activeClass: "bg-primary/[0.11] text-primary ring-primary/20" },
  { key: "steps" as const, label: "Step by Step", icon: ListTree, activeClass: "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))] ring-[oklch(var(--fs-green))]/20" },
  { key: "lowpoint" as const, label: "Low Point", icon: ArrowDownToLine, activeClass: "bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))] ring-[oklch(var(--fs-red))]/20" },
];

const ledgerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const ledgerRow = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

function EstimatedTag() {
  return <ConfidencePill confidence="estimated" />;
}

function ConfirmedTag() {
  return <ConfidencePill confidence="confirmed" />;
}

function ForecastSection() {
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [mode, setMode] = useState<ForecastMode>("forecast");
  const cutoffIndex = FORECAST_CHART_MASTER.findIndex((point) => point.day === FORECAST_HORIZON_CUTOFF[horizon]);
  const chartData = FORECAST_CHART_MASTER.slice(0, cutoffIndex + 1);
  const additionalDays = horizon - 30;

  const stepRows = STEP_EVENTS.reduce<Array<(typeof STEP_EVENTS)[number] & { runningBalance: number }>>((rows, event) => {
    const previousBalance = rows.at(-1)?.runningBalance ?? 2740;
    return [...rows, { ...event, runningBalance: previousBalance + event.change }];
  }, []);

  const [cardRef, cardInView] = useInView<HTMLDivElement>(0.25);

  return (
    <Reveal as="section" className="fs-clay-field relative overflow-hidden px-5 py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 25% 52%, oklch(var(--fs-brand) / 0.13), transparent 34%), radial-gradient(circle at 80% 58%, oklch(var(--fs-brand) / 0.08), transparent 36%)" }} />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>One real forecast</p>
        <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>See the pressure <span className="text-primary" style={editorialItalic}>before it arrives.</span></h2>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">What happens, why it happens, and the exact day behind it — one forecast, inspected three ways.</p>
      </div>

      <div ref={cardRef} className="relative z-10 mx-auto mt-14 max-w-2xl rounded-[24px] border border-border bg-card p-6 shadow-[0_24px_70px_rgba(0,0,0,0.06)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Your {horizon}-day forecast</h3>
            <span className="mt-2 inline-flex items-center rounded-full bg-[oklch(var(--fs-red-bg))] px-2.5 py-1 text-[10px] font-medium text-[oklch(var(--fs-red))]">Tight · Below buffer</span>
          </div>
          {mode === "forecast" && (
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {([30, 60, 90] as const).map((option) => (
                <button key={option} type="button" onClick={() => setHorizon(option)} className={`rounded-md px-2.5 py-1.5 text-[11px] font-mono transition-colors duration-200 ${horizon === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{option}d</button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 inline-flex w-full rounded-xl border border-border bg-muted/40 p-1" role="tablist" aria-label="Inspect this forecast">
          {FORECAST_MODES.map((item) => (
            <button key={item.key} type="button" role="tab" aria-selected={mode === item.key} onClick={() => setMode(item.key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-transparent transition-colors duration-200 ${mode === item.key ? `${item.activeClass} shadow-sm` : "text-muted-foreground hover:bg-card/70 hover:text-foreground"}`}><item.icon size={13} />{item.label}</button>
          ))}
        </div>

        <div className="relative mt-4 min-h-[260px]">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "forecast" && (
              <motion.div key="forecast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t-2 border-primary" />Forecast</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-1.5 rounded-full bg-[oklch(var(--fs-amber))]" />Today</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dashed border-[oklch(var(--fs-amber))]" />Safety buffer</span>
                </div>
                <div className="mt-2 h-[200px]">
                  {cardInView && <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...chartData]} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8a8f8b" }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(chartData.length / 6))} />
                      <YAxis tick={{ fontSize: 9, fill: "#8a8f8b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip content={<ScenarioTooltip />} cursor={{ stroke: "#D4754A", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.5 }} isAnimationActive={false} />
                      <ReferenceLine x="Jul 24" stroke="#c78a3a" strokeDasharray="4 3" strokeWidth={1.25} />
                      <ReferenceLine y={750} stroke="#c78a3a" strokeDasharray="5 4" strokeWidth={1.1} />
                      <Area type="monotone" dataKey="projected" stroke="#D4754A" strokeWidth={2.25} fill="#D4754A14" dot={false} isAnimationActive animationDuration={900} animationEasing="ease-out" connectNulls={false} />
                      <ReferenceDot x="Aug 15" y={369} r={5} fill="oklch(var(--fs-red))" stroke="#fff" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                  <span className="text-muted-foreground">Projected low</span>
                  <span className="font-mono font-semibold text-foreground">$369 · Aug 15</span>
                </div>
                {additionalDays > 0 && <p className="mt-1 text-xs text-muted-foreground">No lower point appears in the additional {additionalDays} days.</p>}
              </motion.div>
            )}

            {mode === "steps" && (
              <motion.div key="steps" variants={ledgerContainer} initial="hidden" animate="show" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <motion.div variants={ledgerRow} className="flex items-center justify-between rounded-xl bg-foreground/[0.035] px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2.5 font-medium text-foreground"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.08] text-foreground"><WalletCards size={15} /></span>Opening balance</span>
                  <span className="font-mono font-semibold text-foreground">$2,740</span>
                </motion.div>
                {stepRows.map((row) => (
                  <motion.div key={row.label} variants={ledgerRow} className="group flex items-center justify-between border-b border-border/60 px-1 py-2.5 text-sm last:border-0 hover:bg-muted/35">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <FinancialEventIcon name={row.label} amountCents={row.change} confidence={row.estimated ? "estimated" : "confirmed"} />
                      <span className="min-w-0"><span className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">{row.label}{row.estimated ? <EstimatedTag /> : <ConfirmedTag />}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{row.day}</span></span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-3 font-mono">
                      <span className="text-muted-foreground">{row.estimated ? "~" : ""}−${Math.abs(row.change).toLocaleString()}</span>
                      <span className="font-semibold text-foreground">${row.runningBalance.toLocaleString()}</span>
                    </span>
                  </motion.div>
                ))}
                <p className="mt-4 text-xs text-muted-foreground">Every step reconciles to $369 on August 15.</p>
              </motion.div>
            )}

            {mode === "lowpoint" && (
              <motion.div key="lowpoint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-sm py-4 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground" style={mono}>August 15</p>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-left text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">Electricity<EstimatedTag /></span>
                  <span className="font-mono">~−$113</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Only Electricity lands on this day. The running balance from every earlier step is what brings the forecast down to <span className="font-semibold text-foreground">$369</span>.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">One forecast. Three ways to inspect it.</p>
      </div>
    </Reveal>
  );
}

/* ── How Cusp Knows: Recognizes / Matches / Projects / Explains ── */
/* ── Each mechanic gets a small native-feeling demo of the real product
   behavior, resolving in only once its card scrolls into view. ── */
/* Mirrors the real CSV-import "New patterns" review list (csv-import-panel.tsx). */
function RecognizesDemo({ inView }: { inView: boolean }) {
  const activity = [
    { date: "May 1", amount: "−$1,650" },
    { date: "Jun 1", amount: "−$1,650" },
  ] as const;
  return (
    <div className={`mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_26px_rgba(58,49,42,0.05)] transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${inView ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/35 px-4 py-2">
        <div><p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">Activity found</p><p className="mt-0.5 text-sm font-semibold text-foreground">Parkview Rent</p></div>
        <span className="rounded-full bg-primary/[0.09] px-2.5 py-1 text-[10px] font-medium text-primary">Monthly pattern</span>
      </div>
      <div className="space-y-1.5 p-2">
        {activity.map((item, index) => (
          <div key={item.date} className={`flex items-center justify-between rounded-xl border border-border/80 bg-background px-3 py-2 text-xs transition-[opacity,transform] duration-400 ${inView ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"}`} style={{ transitionDelay: `${120 + index * 110}ms` }}>
            <span className="text-muted-foreground">{item.date} · <span className="font-medium text-foreground">Parkview Rent</span></span><span className="font-mono text-foreground">{item.amount}</span>
          </div>
        ))}
      </div>
      <div className={`mx-2 mb-2 flex items-center justify-between rounded-xl border border-[oklch(var(--fs-green))]/20 bg-[oklch(var(--fs-green-bg))] px-3 py-2 transition-[opacity,transform] duration-500 ${inView ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ transitionDelay: "390ms" }}><div><p className="text-sm font-medium text-foreground">Rent · next Aug 1</p><p className="mt-0.5 text-[10px] text-muted-foreground">Stable amount and timing</p></div><div className="text-right"><span className="rounded-full bg-card px-2 py-0.5 text-[9px] font-medium text-[oklch(var(--fs-green))]">Confirmed</span><p className="mt-1 font-mono text-sm text-foreground">−$1,650</p></div></div>
    </div>
  );
}

function MatchesDemo({ inView }: { inView: boolean }) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[0_10px_26px_rgba(58,49,42,0.05)]">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className={`rounded-xl border p-3 transition-colors duration-300 ${inView ? "border-[oklch(var(--fs-transfer))]/30 bg-[oklch(var(--fs-transfer-bg))]" : "border-border bg-background"}`}><p className="text-[10px] text-muted-foreground">Everyday checking · Jul 12</p><p className="mt-1.5 text-xs font-medium">Payment to Northstar Visa</p><p className="mt-3 font-mono text-sm">−$190</p></div>
        <span className="relative inline-flex h-7 w-10 shrink-0 items-center justify-center text-[oklch(var(--fs-transfer))]" aria-hidden="true">
          <svg viewBox="0 0 40 18" className="absolute inset-0 h-full w-full overflow-visible">
            <path className={inView ? "fs-transfer-link-path" : ""} d="M2 9 C11 2 29 16 38 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" pathLength="1" style={{ opacity: inView ? 1 : 0 }} />
          </svg>
          {!inView && <ArrowRight size={15} className="text-muted-foreground" />}
        </span>
        <div className={`rounded-xl border p-3 transition-colors duration-300 ${inView ? "border-[oklch(var(--fs-transfer))]/30 bg-[oklch(var(--fs-transfer-bg))]" : "border-border bg-background"}`}><p className="text-[10px] text-muted-foreground">Northstar Visa · Jul 13</p><p className="mt-1.5 text-xs font-medium">Payment received</p><p className="mt-3 font-mono text-sm">+$190</p></div>
      </div>
      <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium text-[oklch(var(--fs-transfer))] transition-opacity duration-500 ${inView ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "480ms" }}><Link2 size={14} />Strong match · linked as a transfer</div>
    </div>
  );
}

/* Mirrors the real "Credit card cash timing" card payment estimate row
   (forecast-view.tsx), using the app's actual strategy label wording. */
function ProjectsDemo({ inView }: { inView: boolean }) {
  const charges = [["Market Basket", "−$60"], ["Trader Joe's", "−$30"], ["Netflix", "−$18"]] as const;
  return (
    <div className={`mt-4 rounded-2xl border border-border bg-card p-4 text-sm shadow-[0_10px_26px_rgba(58,49,42,0.05)] transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${inView ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
      <div className="grid grid-cols-3 gap-2 border-b border-border pb-3">
        {charges.map(([name, amount], index) => <div key={name} className={`rounded-lg border border-border bg-background px-2 py-2.5 text-center transition-[opacity,transform] duration-400 ${inView ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ transitionDelay: `${100 + index * 110}ms` }}><p className="truncate text-[9px] text-muted-foreground">{name}</p><p className="mt-1.5 font-mono text-[11px] text-foreground">{amount}</p></div>)}
      </div>
      <div className={`mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3 transition-[opacity,transform] duration-500 ${inView ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ transitionDelay: "480ms" }}><div><p className="text-xs font-medium text-foreground">Estimated card payment</p><p className="mt-0.5 text-[10px] text-muted-foreground">Due Sep 3 · based on charges so far</p></div><div className="text-right"><span className="rounded-full bg-card px-1.5 py-0.5 text-[9px] text-primary">Estimated</span><p className="mt-1 font-mono text-sm text-foreground">−$340</p></div></div>
    </div>
  );
}

function ExplainsDemo({ inView }: { inView: boolean }) {
  return (
    <div className={`mt-4 rounded-2xl border border-border bg-card p-3 shadow-[0_10px_26px_rgba(58,49,42,0.05)] transition-opacity duration-500 ${inView ? "opacity-100" : "opacity-0"}`}>
      <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-3 text-sm">
        <div><span className="text-foreground">Rent</span><p className="mt-0.5 text-[10px] text-muted-foreground">6 occurrences · same amount</p></div>
        <div className="text-right"><span className="rounded-full bg-[oklch(var(--fs-green-bg))] px-1.5 py-0.5 text-[9px] text-[oklch(var(--fs-green))]">Confirmed</span><p className="mt-1 font-mono text-foreground">−$1,650</p></div>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-[oklch(var(--fs-estimate))]/45 bg-[oklch(var(--fs-estimate-bg))] px-3 py-3 text-sm">
        <div><span className="text-foreground">Electricity</span><p className="mt-0.5 text-[10px] text-muted-foreground">6 occurrences · $84–$139</p></div>
        <div className="text-right"><span className="rounded-full bg-card px-1.5 py-0.5 text-[9px] text-[oklch(var(--fs-estimate))]">Estimated</span><p className="mt-1 font-mono text-[oklch(var(--fs-estimate))]">~−$113</p></div>
      </div>
      <p className="px-1 pt-3 text-[11px] leading-relaxed text-muted-foreground">The forecast always shows which numbers are known and which still carry a range.</p>
    </div>
  );
}

const mechanics = [
  {
    eyebrow: "Recognizes",
    title: "Repeated activity becomes something useful.",
    body: "Cusp groups repeated transactions, checks timing and amount, and asks you to confirm before anything enters the forecast.",
    demo: RecognizesDemo,
  },
  {
    eyebrow: "Matches",
    title: "The same money is not counted twice.",
    body: "Money moved between your own accounts is linked instead of being counted as new income or a second expense.",
    demo: MatchesDemo,
  },
  {
    eyebrow: "Projects",
    title: "Purchases explain spending. The due date explains cash.",
    body: "Cusp places one estimated card payment on checking rather than projecting every card purchase independently.",
    demo: ProjectsDemo,
  },
  {
    eyebrow: "Explains",
    title: "Confirmed and estimated never look the same.",
    body: "They are not equally certain, so they don't look equally certain. Evidence stays visible behind every number — what caused the forecast is always one click away.",
    demo: ExplainsDemo,
  },
] as const;

function MechanicCard({ eyebrow, title, body, demo: Demo, className = "" }: {
  eyebrow: string;
  title: string;
  body: string;
  demo: (props: { inView: boolean }) => React.ReactNode;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  return (
    <div ref={ref} className={`fs-layered-card rounded-2xl border p-4 sm:p-5 md:h-full ${className}`}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-primary" style={mono}>{eyebrow}</p>
      <h3 className="mt-2 text-lg font-medium leading-snug">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Demo inView={inView} />
    </div>
  );
}

function HowCuspKnows() {
  return (
    <Reveal as="section" className="fs-feature-field relative overflow-hidden px-5 py-16" id="features">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 25% 52%, oklch(var(--fs-brand) / 0.11), transparent 35%), radial-gradient(circle at 80% 58%, oklch(var(--fs-brand) / 0.07), transparent 37%)" }} />
      <div className="relative mx-auto mb-12 max-w-3xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>What your forecast already knows</p>
        <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>The work happens quietly.<br />The assumptions stay <span className="text-primary" style={editorialItalic}>visible.</span></h2>
        <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">Cusp finds the shape in your activity, then makes every useful assumption available for you to inspect.</p>
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-4 md:auto-rows-[404px] md:grid-cols-2">
        {mechanics.map((mechanic) => <MechanicCard key={mechanic.eyebrow} {...mechanic} />)}
      </div>
      <div className="relative mt-8 flex justify-center">
        <Link href="/features" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-[0_8px_24px_rgba(15,29,58,0.05)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_12px_30px_rgba(15,29,58,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          See all features <ArrowRight className="h-4 w-4 text-primary" />
        </Link>
      </div>
    </Reveal>
  );
}

/* ── Editorial Pause ── */
function EditorialPause() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={rootRef} className="bg-background px-5 py-12 text-center sm:py-14">
      <p className={`mx-auto max-w-xl text-[24px] font-normal leading-[1.35] text-muted-foreground transition-[opacity,transform] duration-1000 ease-out motion-reduce:transition-none sm:text-[30px] ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={editorialItalic}>
        You don&apos;t discover the future. You arrive in it.
      </p>
    </div>
  );
}

const scenarios = [
  { label: "No purchase", amount: 0 },
  { label: "Weekend trip ($480)", amount: 480 },
  { label: "New laptop ($1,999)", amount: 1999 },
  { label: "MacBook Pro ($2,499)", amount: 2499 },
];

const generateScenarioData = (amount: number, moveToRecommendedDate = false) => [
  { day: "Jul 21", balance: 4240, baseline: null, projected: null },
  { day: "Jul 23", balance: 3720, baseline: null, projected: null },
  { day: "Jul 25", balance: 5490, baseline: null, projected: null },
  { day: "Jul 27", balance: 5220, baseline: null, projected: null },
  { day: "Jul 29", balance: 5740, baseline: null, projected: null },
  { day: "Today", balance: 5500, baseline: 5500, projected: 5500 - (moveToRecommendedDate ? 0 : amount) },
  { day: "Aug 2", baseline: 4210, projected: 4210 - (moveToRecommendedDate ? 0 : amount) },
  { day: "Aug 7", baseline: 3340, projected: 3340 - (moveToRecommendedDate ? 0 : amount) },
  { day: "Aug 11", baseline: 5740, projected: 5740 - amount },
  { day: "Aug 15", baseline: 5120, projected: 5120 - amount },
  { day: "Aug 20", baseline: 4460, projected: 4460 - amount },
];

const trustItems = [
  { icon: Unplug, title: "No bank connection required", desc: "Start with a CSV or enter your essentials manually. Bank connectivity may become an option later, but is not required to use Cusp." },
  { icon: ShieldCheck, title: "You stay in control", desc: "Review information before it enters the forecast. Download or remove data at any time." },
  { icon: Eye, title: "Evidence stays visible", desc: "Nothing enters the forecast as a silent guess. Confirmed and estimated items remain visibly distinct." },
];

const faqs = [
  { category: "Getting started", question: "What is Cusp?", answer: "Cusp is a personal cash-flow forecasting tool. It projects your balance forward using the income, bills, and patterns you’ve confirmed, so you see a tight day coming before it arrives—not the morning of." },
  { category: "Getting started", question: "Is Cusp a budgeting app?", answer: "No. Cusp doesn’t categorize spending or set limits. It projects your balance forward and finds the day it runs lowest, so that day is something you plan around instead of discover." },
  { category: "Getting started", question: "Do I need to connect my bank?", answer: "No. Start with a CSV export or enter your income and bills manually. Bank connectivity may come later—it’s never required to start." },
  { category: "Getting started", question: "Does Cusp work with irregular or mixed income?", answer: "Yes. You can flag irregular or variable income during setup, and the forecast treats it with appropriately wider uncertainty rather than assuming it is as predictable as a fixed salary." },
  { category: "Forecasts and decisions", question: "What do Clear, Watch, Tight, and Update Needed mean?", answer: "Clear means you’re comfortably above your safety buffer. Watch means something ahead deserves attention. Tight means your projected balance crosses that buffer. Update Needed is different: it means your data is missing or out of date, so the forecast can’t be fully trusted until it’s resolved." },
  { category: "Forecasts and decisions", question: "How is Safe to Spend calculated?", answer: "Cusp takes the lowest balance in your forecast window, then subtracts your safety buffer. It’s the largest amount you could spend today without a future day dropping below that buffer." },
  { category: "Forecasts and decisions", question: "Can I test a purchase before making it?", answer: "Yes. Scenario Planner runs a hypothetical purchase against your real forecast and can show the safest date to make it without changing your actual data." },
  { category: "Forecasts and decisions", question: "Why does my forecast look wrong?", answer: "Common causes include a balance that hasn’t been updated recently, a bill or income pattern that hasn’t been confirmed, or an estimated amount that still carries a wide range. See the full troubleshooting guide in Learn." },
  { category: "Credit cards and transactions", question: "How does Cusp handle credit cards and transfers?", answer: "Card purchases are tracked as they happen, and Cusp estimates one payment on the statement due date rather than projecting every charge independently. Transfers between your own accounts are matched and linked so they aren’t counted as new income or a second expense. Cusp never links an ambiguous transfer automatically." },
  { category: "Security and privacy", question: "Is my financial data secure?", answer: "Cusp never asks for your bank login. You bring data through CSV upload or manual entry, so no bank credential is stored. Your data is encrypted in transit and at rest." },
  { category: "Security and privacy", question: "Do you sell my data?", answer: "No. Your financial information is never sold or shared with third parties." },
  { category: "Security and privacy", question: "Can I export or delete my data?", answer: "Yes. You can export or delete your data at any time from Settings." },
  { category: "Beta and billing", question: "Is Cusp free during beta?", answer: "Yes. Explore your forecast and help shape Cusp at no cost during the private beta." },
  { category: "Beta and billing", question: "Will I need a payment method?", answer: "No. Pricing will be published in advance of any change, and you’ll choose whether to opt in. Nothing switches to paid without your action." },
  { category: "Beta and billing", question: "How can I contact support?", answer: "Email support@cusp.sh and we’ll help." },
];

const faqGroups = faqs.reduce<Record<string, typeof faqs>>((groups, item) => {
  (groups[item.category] ??= []).push(item)
  return groups
}, {})

function ScenarioTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; dataKey?: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const values = payload.filter((item) => typeof item.value === "number");
  if (!values.length) return null;
  const projected = values.find((item) => item.dataKey === "projected");
  const recorded = values.find((item) => item.dataKey === "balance");
  const baseline = values.find((item) => item.dataKey === "baseline");
  const primary = projected ?? recorded ?? baseline;
  if (typeof primary?.value !== "number") return null;
  return <div className="min-w-[130px] rounded-xl border border-border bg-card/95 px-3 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.10)] backdrop-blur-sm">
    <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground" style={mono}>{label}</p>
    <p className="mt-1 text-sm font-medium text-foreground" style={mono}>${primary.value.toLocaleString()}</p>
    <p className="mt-1 text-[9px] text-muted-foreground">{recorded ? "Recorded balance" : "Projected balance"}</p>
    {projected && baseline && projected.value !== baseline.value && <p className="mt-1.5 border-t border-border pt-1.5 text-[9px] text-primary" style={mono}>${Math.abs(baseline.value! - projected.value!).toLocaleString()} purchase impact</p>}
  </div>;
}

/* ── Scenario Planner: the second hero, richest interaction on the page ── */
function ScenarioPlanner({ scenario, setScenario, scenarioUsesRecommendedDate, setScenarioUsesRecommendedDate }: {
  scenario: number; setScenario: (n: number) => void;
  scenarioUsesRecommendedDate: boolean; setScenarioUsesRecommendedDate: (fn: (v: boolean) => boolean) => void;
}) {
  const scenarioData = generateScenarioData(scenarios[scenario].amount, scenarioUsesRecommendedDate);
  const projectedBalances = scenarioData.flatMap((point) => typeof point.projected === "number" ? [point.projected] : []);
  const lowestProjectedBalance = Math.min(...projectedBalances);
  const safeToSpend = Math.max(0, lowestProjectedBalance - 500);
  const scenarioLowPoint = scenarioData.reduce<{ day: string; value: number } | null>((lowest, point) => {
    if (typeof point.projected !== "number") return lowest;
    return !lowest || point.projected < lowest.value ? { day: point.day, value: point.projected } : lowest;
  }, null);
  const scenarioCondition = safeToSpend < 500
    ? { label: "Tight", condition: "tight" as const, className: "bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]" }
    : safeToSpend < 1000
      ? { label: "Watch", condition: "watch" as const, className: "bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]" }
      : { label: scenario === 0 ? "Baseline" : "Clear", condition: scenario === 0 ? "update_needed" as const : "clear" as const, className: "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]" };

  return (
    <Reveal as="section" className="relative bg-background px-5 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Before you spend</p>
          <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>Test a purchase <span className="text-primary" style={editorialItalic}>before your balance does.</span></h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">A weekend trip. A new laptop. Enter it, and watch your baseline forecast shift into a new projected low — the actual financial picture with this purchase in it, not just a yes or no.</p>
          <div className="mt-7 grid grid-cols-2 gap-2" aria-label="Scenario demo">
            {scenarios.map((item, index) => <button type="button" onClick={() => { setScenario(index); setScenarioUsesRecommendedDate(() => false); }} key={item.label} aria-pressed={scenario === index} className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${scenario === index ? "border-primary/40 bg-primary/[0.10] font-medium text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground"}`}>{item.label}</button>)}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-[0_24px_70px_rgba(0,0,0,0.06)] sm:p-7">
          <div className="relative flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground" style={mono}>{scenario === 0 ? "Your current plan" : `Private what-if · ${scenarioUsesRecommendedDate ? "tested Aug 11" : "tested today"}`}</p><p className="mt-2 font-medium">{scenario === 0 ? "No extra purchase" : `${scenarios[scenario].label.replace(/\s*\([^)]*\)$/, "")} · −$${scenarios[scenario].amount.toLocaleString()}`}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${scenarioCondition.className}`}>{scenarioCondition.label}</span></div>
          <div className="relative mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dashed border-muted-foreground" />Baseline forecast</span>
            <span className="flex items-center gap-1.5 text-primary"><span className="inline-block h-0 w-4 border-t-2 border-primary" />With this purchase</span>
          </div>
          <div className="relative"><ResponsiveContainer width="100%" height={230}><AreaChart data={scenarioData} margin={{ top: 24, right: 8, left: -18, bottom: 0 }}><XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8a8f8b" }} tickLine={false} axisLine={false} interval={2} /><YAxis domain={[0, 6500]} ticks={[0, 3000, 6000]} tick={{ fontSize: 9, fill: "#8a8f8b" }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} /><Tooltip content={<ScenarioTooltip />} cursor={{ stroke: "#D67563", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.55 }} isAnimationActive={false} /><ReferenceLine x={scenarioUsesRecommendedDate ? "Aug 11" : "Today"} stroke="#8a8f8b" strokeDasharray="4 4" label={{ value: "Purchase", position: "insideTopLeft", fill: "#8a8f8b", fontSize: 9 }} /><ReferenceLine y={500} stroke="#c78a3a" strokeDasharray="5 4" label={{ value: "$500 buffer", position: "insideBottomLeft", fill: "#c78a3a", fontSize: 9 }} /><Area type="monotone" dataKey="balance" stroke="#1D221E" strokeWidth={2.5} fill="#1D221E0A" dot={false} isAnimationActive={false} connectNulls={false} />{scenario > 0 && <Area type="monotone" dataKey="baseline" stroke="#8a8f8b" strokeDasharray="5 5" strokeWidth={1.5} fill="transparent" dot={false} isAnimationActive={false} />}<Area type="monotone" dataKey="projected" stroke="#D67563" strokeWidth={2.75} fill="#D6756314" dot={false} animationDuration={SCENARIO_MOTION_MS} connectNulls={false} />{scenarioLowPoint && <ReferenceDot x={scenarioLowPoint.day} y={scenarioLowPoint.value} r={4} fill="#D67563" stroke="#fff" strokeWidth={2} />}</AreaChart></ResponsiveContainer></div>
          {scenario === 3 && <div className={`relative mb-4 rounded-xl border p-3 ${scenarioUsesRecommendedDate ? "border-[oklch(var(--fs-green))]/25 bg-[oklch(var(--fs-green-bg))]/55" : "border-[oklch(var(--fs-amber))]/25 bg-[oklch(var(--fs-amber-bg))]/55"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium">{scenarioUsesRecommendedDate ? "August 11 keeps the forecast clear." : "Buying today creates a tight day on August 7."}</p><p className="mt-1 text-[10px] text-muted-foreground">{scenarioUsesRecommendedDate ? "Compared with your original date—nothing has been saved." : "August 11 is the earliest date that stays clear."}</p></div><button type="button" onClick={() => setScenarioUsesRecommendedDate((value) => !value)} className="rounded-lg border border-border bg-card px-3 py-2 text-[10px] font-medium text-primary hover:border-primary/30">{scenarioUsesRecommendedDate ? "Compare today" : "Compare Aug 11"}</button></div></div>}
          <div className="relative grid grid-cols-2 gap-4 border-t border-border pt-4"><div><p className="text-[10px] text-muted-foreground">Projected low</p><p className="mt-1 text-lg font-medium" style={mono}>${lowestProjectedBalance.toLocaleString()}</p><p className="mt-1 text-[10px] text-muted-foreground">{scenarioLowPoint?.day}</p></div><div><p className="text-[10px] text-muted-foreground">Safe to Spend</p><p className={`mt-1 text-lg font-medium ${scenarioCondition.condition === "tight" ? "text-[oklch(var(--fs-red))]" : scenarioCondition.condition === "watch" ? "text-[oklch(var(--fs-amber))]" : "text-[oklch(var(--fs-green))]"}`} style={mono}>${safeToSpend.toLocaleString()}</p><p className="mt-1 text-[10px] text-muted-foreground">after $500 buffer</p></div></div>
        </div>
      </div>
    </Reveal>
  );
}

export default function Landing({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const router = useRouter();
  const navigate = router.push;
  const primaryHref = isSignedIn ? "/app/dashboard" : "/sign-up";
  const primaryLabel = isSignedIn ? "Open dashboard" : "Get early access";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [scenarioUsesRecommendedDate, setScenarioUsesRecommendedDate] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Global entrance system: opacity 0→1, translateY 18px→0, ~560ms, one
     controlled stagger per section (data-stagger-child), trigger once. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    sections.forEach((section) => {
      section.style.opacity = "0";
      section.style.transform = "translateY(18px)";
      section.style.transition = "opacity 560ms var(--ease-cusp), transform 560ms var(--ease-cusp)";
      const staggerChildren = Array.from(section.querySelectorAll<HTMLElement>("[data-stagger-child]"));
      staggerChildren.forEach((child, index) => {
        child.style.opacity = "0";
        child.style.transform = "translateY(12px)";
        child.style.transition = `opacity 500ms var(--ease-cusp) ${100 + index * 90}ms, transform 500ms var(--ease-cusp) ${100 + index * 90}ms`;
      });
    });
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const section = entry.target as HTMLElement;
      section.style.opacity = "1";
      section.style.transform = "translateY(0)";
      section.querySelectorAll<HTMLElement>("[data-stagger-child]").forEach((child) => {
        child.style.opacity = "1";
        child.style.transform = "translateY(0)";
      });
      observer.unobserve(section);
    }), { threshold: 0.12 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="fs-landing relative min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-200 ${scrolled ? "border-border bg-background/90 backdrop-blur-xl" : "border-transparent bg-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <button type="button" className="cursor-pointer" onClick={() => navigate("/")} aria-label="Cusp home">
            <Image src="/cusp-logo.svg?v=2" alt="Cusp" width={125} height={29} loading="eager" className="h-7 w-auto" />
          </button>
          <div className="hidden md:flex items-center gap-7">
            <Link href="/features" className="relative py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="/learn" className="relative py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">Learn</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {!isSignedIn && <button onClick={() => navigate("/sign-in")} className="px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Sign in</button>}
            <button onClick={() => navigate(primaryHref)} className="fs-brand-action inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium">{primaryLabel} <ArrowRight size={14} /></button>
          </div>
          <button className="md:hidden text-muted-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="mx-3 mb-3 flex flex-col gap-4 rounded-2xl border border-border bg-background/95 px-5 py-5 shadow-xl backdrop-blur-2xl md:hidden">
            <Link href="/features" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Features</Link>
            <Link href="/learn" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Learn</Link>
            {!isSignedIn && <button onClick={() => navigate("/sign-in")} className="text-left text-sm text-muted-foreground">Sign in</button>}
            <button onClick={() => navigate(primaryHref)} className="fs-brand-action text-sm px-4 py-2.5 rounded-xl font-medium">{primaryLabel}</button>
          </div>
        )}
      </nav>

      {/* 1. HERO — kept outside the overflow-x-hidden wrapper below: any
          overflow-hidden ancestor (even on html/body) breaks the hero's
          `position: sticky` pin, so horizontal-scroll clipping is scoped to
          everything after it instead. */}
      <ExpandingLandingHero isSignedIn={isSignedIn} navigate={navigate} />

      <div className="overflow-x-hidden">
      {/* 2. WHY THIS IS DIFFERENT */}
      <WhyDifferent />

      {/* 3. CLEAR / WATCH / TIGHT — one system, one product frame */}
      <ConditionSystem />

      {/* 4. FORECAST — real chart + step by step + review low point */}
      <ForecastSection />

      {/* 5. HOW CUSP KNOWS */}
      <HowCuspKnows />

      {/* 6. EDITORIAL PAUSE — quiet moment, no motif, no icon */}
      <EditorialPause />

      {/* 7. SCENARIO PLANNER — second hero */}
      <ScenarioPlanner
        scenario={scenario}
        setScenario={setScenario}
        scenarioUsesRecommendedDate={scenarioUsesRecommendedDate}
        setScenarioUsesRecommendedDate={setScenarioUsesRecommendedDate}
      />

      {/* 8. SECURITY — kept small */}
      <Reveal as="section" className="relative py-12 px-5" id="security">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Security</p>
            <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>Start <span className="text-primary" style={editorialItalic}>without handing over</span> your bank login.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trustItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 transition-colors duration-200 hover:border-primary/20 group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-[background-color] duration-200 group-hover:bg-primary/15">
                  <Icon size={18} strokeWidth={1.75} className="text-primary" />
                </div>
                <h3 className="font-semibold text-base text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 9. PRICING — Free and Pro */}
      <Reveal as="section" className="relative scroll-mt-16 px-5 py-12" id="pricing">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Pricing</p>
            <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>Start with clarity. <span className="text-primary" style={editorialItalic}>Go deeper when you’re ready.</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">The core forecast stays useful for free. Pro unlocks more room to plan ahead as your picture gets more detailed.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_28px_rgba(29,34,30,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground" style={mono}>Free</p><h3 className="mt-2 text-xl font-medium" style={display}>See what’s coming</h3></div>
                <p className="font-mono text-sm text-foreground">$0</p>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                <li>Manual entry and CSV import</li><li>One active account</li><li>Up to 8 recurring items</li><li>30-day forecast and Safe to Spend</li><li>Confirmed versus estimated labels</li><li>Basic transfers, card timing, and alerts</li><li>One simple scenario test</li><li>Export and delete your data</li>
              </ul>
              <Link href="/sign-up" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90">Get started free</Link>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-6 shadow-[0_10px_32px_rgba(212,117,74,0.08)]">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.15em] text-primary" style={mono}>Pro · popular</p><h3 className="mt-2 text-xl font-medium" style={display}>See the full picture</h3></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">Beta included</span></div>
              <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                <li>Everything in Free</li><li>Unlimited accounts and recurring items</li><li>60- and 90-day forecasts</li><li>Full Scenario Planner comparisons</li><li>Complete credit-card timeline</li><li>Cross-account transfer matching</li><li>Forecast history and accuracy tracking</li><li>Custom alerts and detailed Show Your Work</li>
              </ul>
              <Link href="/sign-up" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">Explore Pro</Link>
            </div>
          </div>
          <p className="mx-auto mt-5 max-w-xl text-center text-xs text-muted-foreground">Pro features are included during the private beta. We’ll publish pricing before billing begins—nothing changes without your choice.</p>
        </div>
      </Reveal>

      {/* 10. FAQ */}
      <Reveal as="section" className="relative overflow-hidden bg-[color-mix(in_oklab,var(--background)_96%,var(--primary)_4%)] px-5 py-12 sm:py-14" id="faq">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(212,117,74,0.14),transparent_68%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 text-center sm:mb-9">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Common questions</p>
            <h2 className="text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>A few things to <span className="text-primary" style={editorialItalic}>know.</span></h2>
          </div>
          <div className="mx-auto max-w-2xl space-y-7 sm:space-y-8">
            {Object.entries(faqGroups).map(([category, items]) => <section key={category}>
              <p className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/60">{category}</p>
              <div className="space-y-3">
                {items.map((item) => {
                  const index = faqs.indexOf(item)
                  return <div key={item.question} data-stagger-child className={`rounded-[22px] border bg-card px-5 shadow-[0_1px_2px_rgba(29,34,30,0.035)] transition-[border-color,box-shadow,background-color] duration-200 sm:px-7 ${openFaq === index ? "border-primary/35 bg-primary/[0.025] shadow-[0_10px_26px_rgba(29,34,30,0.055)]" : "border-border hover:border-primary/25 hover:shadow-[0_6px_18px_rgba(29,34,30,0.04)]"}`}>
                    <button type="button" aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq((current) => current === index ? null : index)} className="flex w-full items-start justify-between gap-4 py-4 text-left text-sm font-medium text-foreground outline-none hover:underline focus-visible:rounded-md focus-visible:ring-[3px] focus-visible:ring-primary/20"><span>{item.question}</span><ChevronDown size={16} className={`shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200 ${openFaq === index ? "rotate-180 text-primary" : ""}`} /></button>
                    <div id={`faq-answer-${index}`} aria-hidden={openFaq !== index} className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${openFaq === index ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden"><p className="max-w-3xl pr-7 text-sm leading-6 text-muted-foreground">{item.answer}</p></div></div>
                  </div>
                })}
              </div>
            </section>)}
          </div>
        </div>
      </Reveal>

      {/* 11. FINAL CTA */}
      <Reveal as="section" className="py-14 px-5 relative">
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <div className="bg-card border border-border rounded-3xl px-8 py-14">
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-5" style={mono}>Early access</p>
            <h2 className="mb-4 text-[34px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[42px]" style={display}>See it <span className="text-primary" style={editorialItalic}>before it happens.</span></h2>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm">Join the beta and be among the first to see your tightest day before it gets here.</p>
            {isSignedIn ? (
              <button type="button" onClick={() => navigate("/app/dashboard")} className="fs-brand-action px-6 py-3 rounded-xl text-sm font-medium">Open dashboard</button>
            ) : submitted ? (
              <div className="flex flex-col items-center gap-3 py-2" aria-live="polite">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(var(--fs-green-bg))]"><CheckCircle size={22} className="text-[oklch(var(--fs-green))]" /></div>
                <p className="text-foreground font-semibold">You&apos;re on the list!</p>
                <p className="text-sm text-muted-foreground">We&apos;ll reach out when your spot opens up.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
                <div className="relative flex-1"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required aria-invalid={email.length > 0 && !emailLooksValid}
                  className="w-full bg-muted border border-border rounded-xl py-3 pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />{emailLooksValid && <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(var(--fs-green))]" aria-label="Email address looks valid" />}</div>
                <button type="submit" className="fs-brand-action w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap">Join Beta</button>
              </form>
            )}
            <p className="text-xs text-muted-foreground mt-5">Private beta · shaped with early-user feedback</p>
            <div className="mt-8"><TimelineMotif label="Today" /></div>
          </div>
        </div>
      </Reveal>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <button type="button" className="mb-3 cursor-pointer" onClick={() => navigate("/")} aria-label="Cusp home">
                <Image src="/cusp-logo.svg?v=2" alt="Cusp" width={125} height={29} className="h-7 w-auto" />
              </button>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[170px]">Know what&apos;s next for your money.</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Product</p>
              <div className="space-y-2.5">
                <Link href="/features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <Link href="/learn" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Learn</Link>
                <a href="#security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
                <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Company</p>
              <div className="space-y-2.5">
                <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <a href="mailto:support@cusp.sh" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Legal</p>
              <div className="space-y-2.5">
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Cusp. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
