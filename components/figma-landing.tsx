"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import {
  Shield, TrendingUp, ArrowRight, Lock,
  BarChart3,
  X, Menu, Sparkles, CheckCircle, ChevronDown,
} from "lucide-react";

const display: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };
const SCENARIO_MOTION_MS = 600;
const GRID_THINK_MS = 950;
const AHA_MOTION = {
  cycleMs: 4800,
  morphMs: 760,
  badgeMs: 320,
  copyMs: 320,
  chipStaggerMs: 90,
} as const;

function CountUp({ value, prefix = "", suffix = "", duration = 900, delay = 0, active = true }: { value: number; prefix?: string; suffix?: string; duration?: number; delay?: number; active?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValue = useRef(0);
  useEffect(() => {
    if (!active) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = currentValue.current;
    const animationDuration = reducedMotion ? 0 : duration;
    let frame = 0;
    let startedAt = 0;
    const tick = (now: number) => {
      if (startedAt === 0) startedAt = now;
      const progress = animationDuration === 0 ? 1 : Math.min(1, (now - startedAt) / animationDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (value - from) * eased);
      currentValue.current = next;
      setDisplayValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => { frame = requestAnimationFrame(tick); }, reducedMotion ? 0 : delay);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [active, delay, duration, value]);
  return <span className="tabular-nums" aria-label={`${prefix}${value.toLocaleString()}${suffix}`}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

function Magnetic({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  return <span
    ref={ref}
    className={`inline-flex rounded-xl transition-[transform,filter] duration-200 ease-out hover:drop-shadow-[0_8px_14px_rgba(201,99,59,0.20)] ${className}`}
    onMouseMove={(event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
      event.currentTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }}
    onMouseLeave={(event) => { event.currentTarget.style.transform = "translate3d(0, 0, 0)"; }}
  >{children}</span>;
}

function moveCursorGlow(event: React.PointerEvent<HTMLElement>) {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  const glow = event.currentTarget.querySelector<HTMLElement>("[data-cursor-glow]");
  if (!glow) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  glow.style.opacity = "1";
  glow.style.transform = `translate3d(${event.clientX - bounds.left - 240}px, ${event.clientY - bounds.top - 240}px, 0)`;
}

function hideCursorGlow(event: React.PointerEvent<HTMLElement>) {
  const glow = event.currentTarget.querySelector<HTMLElement>("[data-cursor-glow]");
  if (glow) glow.style.opacity = "0";
}

const ahaBuildSteps = [
  { label: "Starting balance", date: "Today", amount: 2660, delta: null, x: 28, y: 30 },
  { label: "Rent", date: "Aug 1", amount: 1010, delta: "−$1,650", x: 205, y: 74 },
  { label: "Insurance", date: "Aug 3", amount: 830, delta: "−$180", x: 372, y: 88 },
  { label: "Car payment", date: "Aug 3", amount: 420, delta: "−$410", x: 548, y: 123 },
] as const;

function CausalAhaForecast() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(0);
  const [entered, setEntered] = useState(false);
  const [inspectedStep, setInspectedStep] = useState<number | null>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setEntered(true);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!entered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => setPhase(4));
      return () => window.cancelAnimationFrame(frame);
    }
    const resetFrame = window.requestAnimationFrame(() => setPhase(0));
    const timers = [700, 1450, 2200, 3000].map((delay, index) => window.setTimeout(() => setPhase(index + 1), delay));
    return () => {
      window.cancelAnimationFrame(resetFrame);
      timers.forEach(window.clearTimeout);
    };
  }, [entered, run]);

  const eventPhase = Math.min(phase, 3);
  const displayedPhase = inspectedStep ?? eventPhase;
  const balance = ahaBuildSteps[displayedPhase].amount;
  const fullPath = ahaBuildSteps.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const areaPath = `${fullPath} L548,138 L28,138 Z`;

  return (
    <div ref={rootRef} className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="order-2 relative overflow-hidden rounded-[30px] border border-[#D7E0EC] bg-[linear-gradient(135deg,#FFFFFF_0%,#FFFFFF_48%,#F2F7FD_100%)] p-5 shadow-[0_28px_80px_rgba(28,28,34,0.10)] sm:p-8 lg:order-1">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs text-muted-foreground">Example forecast</p><p className="font-medium">Today → August 3</p></div>
          <span className="rounded-full bg-[hsl(var(--fs-amber-bg))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--fs-amber))]">{phase === 4 ? "Watch · Aug 3" : "Building forecast"}</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-[150px_1fr] sm:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground" style={mono}>Projected balance</p>
            <p className="mt-2 text-[38px] font-medium leading-none text-foreground" style={mono}><CountUp value={balance} prefix="$" duration={600} /></p>
            <p className="mt-2 min-h-5 text-xs text-muted-foreground">{displayedPhase === 0 ? "Before upcoming bills" : `After ${ahaBuildSteps[displayedPhase].label.toLowerCase()}`}</p>
          </div>
          <svg viewBox="0 0 576 154" className="h-[190px] w-full" role="img" aria-label="Projected balance falling as rent, insurance, and the car payment arrive">
            {[38, 76, 114].map((y) => <line key={y} x1="20" y1={y} x2="558" y2={y} stroke="#D7E0EC" strokeWidth="1" opacity=".7" />)}
            <line x1="20" y1="116" x2="558" y2="116" stroke="#B7791F" strokeDasharray="6 5" opacity=".75" />
            <text x="22" y="108" fill="#B7791F" fontSize="10">$500 safety buffer</text>
            <path d={areaPath} fill="#C9633B" className={`transition-opacity duration-500 ${eventPhase === 3 ? "opacity-[0.08]" : "opacity-0"}`} />
            <path d={fullPath} fill="none" stroke="#C9633B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - eventPhase / 3} className="transition-[stroke-dashoffset] duration-700 ease-out" />
            {ahaBuildSteps.map((step, index) => <g key={step.label} className={`transition-[opacity,transform] duration-300 ${index <= eventPhase ? "opacity-100" : "translate-y-1 opacity-0"}`}><line x1={step.x} y1={step.y + 7} x2={step.x} y2="138" stroke="#C9633B" strokeDasharray="3 3" opacity={index === displayedPhase ? ".8" : ".3"} className="transition-opacity duration-200" /><circle cx={step.x} cy={step.y} r={index === displayedPhase ? 8 : 5} fill={index === 0 ? "#111827" : "#C9633B"} stroke="#FFFFFF" strokeWidth={index === displayedPhase ? 3 : 2} className="transition-[r,stroke-width] duration-200" /></g>)}
          </svg>
        </div>
        <div className="mt-2 grid min-h-[80px] gap-2 sm:grid-cols-3">
          {ahaBuildSteps.slice(1).map((step, index) => {
            const stepIndex = index + 1;
            const isInspected = displayedPhase === stepIndex;
            return <button
              type="button"
              key={step.label}
              disabled={stepIndex > eventPhase}
              onMouseEnter={() => setInspectedStep(stepIndex)}
              onMouseLeave={() => setInspectedStep(null)}
              onFocus={() => setInspectedStep(stepIndex)}
              onBlur={() => setInspectedStep(null)}
              className={`rounded-xl border p-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${stepIndex <= eventPhase ? `translate-y-0 opacity-100 ${isInspected ? "border-primary/45 bg-primary/[0.06] shadow-[0_8px_22px_rgba(201,99,59,0.10)]" : "border-[#D7E0EC] bg-white hover:border-primary/30"}` : "translate-y-2 cursor-default border-transparent bg-transparent opacity-0"}`}
              aria-label={`Inspect ${step.label}: ${step.delta}, projected balance $${step.amount.toLocaleString()}`}
            ><div className="flex justify-between gap-2 text-xs"><span className="font-medium">{step.label}</span><span style={mono}>{step.delta}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{step.date} · confirmed</p></button>;
          })}
        </div>
      </div>
      <div className="order-1 flex min-h-0 flex-col justify-center lg:order-2 lg:min-h-[330px]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Five days of warning</p>
        <h2 className="text-[40px] font-medium leading-[1.06] tracking-tight lg:text-[48px]" style={display}>See it <span className="text-primary">before it arrives.</span></h2>
        <p className={`mt-5 text-[18px] leading-relaxed text-muted-foreground transition-all duration-500 ${phase === 4 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-35"}`}>
          Your projected balance drops to <strong className="font-medium text-foreground" style={mono}>$420 on August 3</strong>—five days before payday. Rent, insurance, and your car payment all land in the same week.
        </p>
        <button type="button" onClick={() => setRun((current) => current + 1)} className="mt-6 w-fit text-sm font-medium text-primary hover:text-[hsl(var(--fs-primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25">↻ Replay forecast</button>
        <span className="sr-only" aria-live="polite">{phase === 4 ? "Projected balance is 420 dollars on August 3, five days before payday." : ""}</span>
      </div>
    </div>
  );
}

function LandingDashboardMockup({ expanded: _expanded }: { expanded: boolean }) {
  const navItems = ["Dashboard", "Forecast", "Scenarios", "Transactions", "Accounts"];
  return <div className="overflow-hidden rounded-[30px] border border-[#D9DEE7] bg-white shadow-[0_34px_100px_rgba(15,29,58,0.17)]">
    <div className="grid min-h-[650px] sm:grid-cols-[190px_1fr]">
      <aside className="hidden border-r border-[#D9DEE7] bg-white px-4 py-5 sm:flex sm:flex-col">
        <div className="flex items-center gap-2.5 px-2"><TrendingUp size={17} className="text-[#111]" /><span className="text-sm font-medium">FlowSight</span></div>
        <nav className="mt-7 space-y-1.5">{navItems.map((item, index) => <div key={item} className={`rounded-xl px-3 py-2.5 text-[12px] ${index === 0 ? "bg-[#F3EAE5] font-medium text-[#9D4B2C]" : "text-muted-foreground"}`}>{item}</div>)}</nav>
        <div className="mt-auto border-t border-[#E2E5EB] px-2 pt-4"><p className="text-[11px] font-medium">Taylor’s workspace</p><p className="mt-1 text-[10px] text-muted-foreground">Updated today</p></div>
      </aside>
      <main className="min-w-0 bg-[#F6F8FB] p-6">
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-[22px] font-medium leading-tight" style={display}>Good afternoon, Taylor.</h3><p className="mt-1.5 text-[11px] text-muted-foreground">Sunday, August 2 · Here’s your financial picture.</p></div><span className="rounded-full border border-[#D9DEE7] bg-white px-3 py-1.5 text-[10px] text-muted-foreground">Calculated from your latest details</span></div>
        <div className="mt-5 rounded-2xl border border-[#E7D8B7] bg-[#FFF9EA] p-5"><div className="flex items-center justify-between gap-5"><div><p className="text-[9px] uppercase tracking-[0.15em] text-[#9A6807]" style={mono}>Watch · low point ahead</p><p className="mt-2 text-[16px] font-medium">One tight spot is coming before payday.</p><p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">Rent, insurance, and your car payment bring the projected balance to $420 on August 3—below your $500 buffer.</p></div><span className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-[11px] font-medium text-primary shadow-sm">Review low point →</span></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Current balance", "$4,260", "as of Aug 2"], ["Safe to Spend", "$680", "after $500 buffer"], ["Projected low", "$420", "August 3"], ["Next important event", "Rent", "Tomorrow · −$1,650"]].map(([label, value, detail], index) => <div key={label} className="rounded-2xl border border-[#D9DEE7] bg-white p-4"><p className="text-[10px] text-muted-foreground">{label}</p><p className={`mt-2 text-[18px] font-medium ${index === 1 ? "text-[#2D8B5A]" : index === 2 ? "text-primary" : ""}`} style={index < 3 ? mono : undefined}>{value}</p><p className="mt-1.5 text-[9px] text-muted-foreground">{detail}</p></div>)}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_0.65fr]">
          <div className="rounded-2xl border border-[#D9DEE7] bg-white p-4"><div className="flex items-start justify-between"><div><p className="text-[13px] font-medium">Cash Flow Forecast</p><p className="mt-1 text-[10px] text-muted-foreground">Projected through August 31</p></div><span className="rounded-full bg-[#F5F6FA] px-2.5 py-1 text-[9px] text-muted-foreground">30 days</span></div><svg viewBox="0 0 620 190" className="mt-3 h-[190px] w-full" role="img" aria-label="Projected balance falls to 420 dollars on August 3 before recovering"><defs><linearGradient id="heroDashboardArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9633B" stopOpacity=".20" /><stop offset="1" stopColor="#C9633B" stopOpacity=".01" /></linearGradient></defs>{[36,88,140].map((y) => <line key={y} x1="0" x2="620" y1={y} y2={y} stroke="#E2E5EB" />)}<line x1="0" x2="620" y1="145" y2="145" stroke="#CA8A04" strokeDasharray="6 5" /><path d="M0 34 C72 38 124 44 178 61 S270 138 324 146 S410 74 476 71 S554 90 620 101 L620 168 L0 168 Z" fill="url(#heroDashboardArea)" /><path d="M0 34 C72 38 124 44 178 61 S270 138 324 146 S410 74 476 71 S554 90 620 101" fill="none" stroke="#C9633B" strokeWidth="3.5" strokeLinecap="round" /><circle cx="324" cy="146" r="6" fill="#C9633B" stroke="white" strokeWidth="3" /><text x="337" y="164" fill="#C9633B" fontSize="10">Aug 3 · $420</text></svg></div>
          <div className="rounded-2xl border border-[#D9DEE7] bg-white p-4"><div className="flex items-center justify-between"><p className="text-[13px] font-medium">Upcoming</p><span className="text-[10px] text-primary">View forecast</span></div><div className="mt-3 divide-y divide-[#E2E5EB]">{[["Rent", "Tomorrow", "−$1,650"], ["Insurance", "Aug 3", "−$180"], ["Car payment", "Aug 3", "−$410"], ["Paycheck", "Aug 8", "+$2,400"]].map(([name, timing, amount]) => <div key={name} className="flex items-center justify-between gap-3 py-3 text-[11px]"><div><p className="font-medium">{name}</p><p className="mt-1 text-[9px] text-muted-foreground">{timing}</p></div><span className={amount.startsWith("+") ? "text-[#2D8B5A]" : ""} style={mono}>{amount}</span></div>)}</div></div>
        </div>
      </main>
    </div>
  </div>;
}

function ExpandingLandingHero({ isSignedIn, navigate }: { isSignedIn: boolean; navigate: (href: string) => void }) {
  const expansionRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [gradientVisible, setGradientVisible] = useState(false);
  const [expansionProgress, setExpansionProgress] = useState(0);
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHeroVisible(true));
    const gradientTimer = window.setTimeout(() => setGradientVisible(true), 900);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(gradientTimer);
    };
  }, []);
  useEffect(() => {
    const expansion = expansionRef.current;
    if (!expansion) return;
    let frame = 0;
    const update = () => {
      const rect = expansion.getBoundingClientRect();
      const start = window.innerHeight * 0.56;
      const end = window.innerHeight * 0.06;
      const next = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      setExpansionProgress(next);
      setHeroScrollProgress(Math.min(1, window.scrollY / 360));
      frame = 0;
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
  const mockupTranslate = 36 - expansionProgress * 36;
  const mockupOpacity = 0.82 + expansionProgress * 0.18;
  return <section className="relative overflow-hidden bg-white pt-24">
    <div className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none ${gradientVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="sticky top-0 h-screen overflow-hidden"><div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(99,164,235,0.20)_0%,rgba(184,216,249,0.10)_52%,transparent_100%)]" /><div className="absolute left-1/2 top-0 h-[800px] w-[min(1240px,112vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_-6%,rgba(99,164,235,0.50)_0%,rgba(161,204,247,0.32)_26%,rgba(210,231,252,0.20)_48%,rgba(238,246,255,0.10)_64%,transparent_79%)] blur-2xl" /></div>
    </div>
    <div className="relative z-10 mx-auto max-w-[1240px] px-5 will-change-transform" style={{ opacity: 1 - heroScrollProgress * 0.88, transform: `translateY(${-heroScrollProgress * 34}px)` }}>
      <div className="mx-auto max-w-4xl text-center">
        <div className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Cash flow, with context</p>
          <h1 className="text-[50px] font-medium leading-[1.02] tracking-[-0.02em] sm:text-[66px]" style={display}>Know what your money <span className="text-primary">does next.</span></h1>
        </div>
        <p className={`mx-auto mt-6 max-w-[620px] text-[17px] leading-relaxed text-muted-foreground transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={{ transitionDelay: "220ms" }}>FlowSight brings your balance, income, bills, and recent activity together to find the days that matter—and give you time to plan.</p>
        <div className={`mt-8 flex flex-wrap justify-center gap-3 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={{ transitionDelay: "440ms" }}><Magnetic><button onClick={() => navigate(isSignedIn ? "/app/dashboard" : "/sign-up")} className="fs-brand-action inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium">{isSignedIn ? "Open dashboard" : "Join the Beta"} <ArrowRight size={15} /></button></Magnetic><button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="fs-interactive rounded-xl border border-border bg-white px-6 py-3 text-sm font-medium">See how it works</button></div>
      </div>
    </div>
    <div ref={expansionRef} className="relative mt-5 h-[640px] overflow-visible px-2 pt-7 sm:px-4 sm:pt-8">
      <div className="flex items-start justify-center">
        <div className="relative w-full max-w-[1360px] origin-top motion-reduce:opacity-100" style={{ transform: `translateY(${mockupTranslate}px) scale(0.8)`, opacity: mockupOpacity }}>
          <div className="pointer-events-none absolute -inset-x-10 -inset-y-7 -z-10 rounded-[32px] bg-white shadow-[0_30px_90px_rgba(15,29,58,0.12)]" />
          <LandingDashboardMockup expanded />
        </div>
      </div>
    </div>
  </section>;
}

const flowsightLandingTheme = {
  "--background": "0 0% 100%",
  "--foreground": "218 41% 14%",
  "--card": "0 0% 100%",
  "--card-foreground": "218 41% 14%",
  "--primary": "18 55% 51%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "216 43% 94%",
  "--secondary-foreground": "218 41% 14%",
  "--muted": "216 43% 94%",
  "--muted-foreground": "218 13% 46%",
  "--accent": "18 55% 51%",
  "--accent-foreground": "0 0% 100%",
  "--destructive": "350 45% 49%",
  "--border": "215 29% 88%",
  "--input": "215 29% 85%",
  "--ring": "18 55% 51%",
  "--fs-tint": "#EAF0F7",
  "--fs-tint-soft": "#F2F6FC",
  backgroundImage: "none",
} as React.CSSProperties;

const faqs = [
  { question: "Is FlowSight a budgeting app?", answer: "No. FlowSight starts with your balance and known upcoming activity to show how the next 30 days may unfold. You do not need to maintain category budgets." },
  { question: "Do I need to connect my bank?", answer: "No. You can start with a CSV from your bank or enter your balance, income and bills manually." },
  { question: "How does FlowSight build the forecast?", answer: "It combines the current balances, transactions, recurring activity and safety buffer you provide. Confirmed and estimated events are labelled separately." },
  { question: "How is Safe to Spend calculated?", answer: "FlowSight takes the lowest balance in your 30-day forecast and protects the safety buffer you choose. Open Show Your Work to review every included event and assumption." },
  { question: "Does FlowSight use AI?", answer: "The Phase 1 forecast is deterministic, not an AI guess. It calculates daily balances from the information you provide. Pattern detection may suggest recurring activity, but you review it before it enters your forecast." },
  { question: "Can I correct an estimate?", answer: "Yes. You can review recurring suggestions and edit or confirm upcoming events as you learn more." },
  { question: "Can I export or delete my data?", answer: "Yes. FlowSight includes data export and account deletion controls." },
];

const scenarios = [
  { label: "No purchase", amount: 0 },
  { label: "Weekend trip ($480)", amount: 480 },
  { label: "New iPhone ($1,099)", amount: 1099 },
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
  { icon: Lock, title: "No bank connection required", desc: "Start with a CSV or enter your essentials manually. Bank connectivity is a future Premium option." },
  { icon: Shield, title: "You stay in control", desc: "Review what enters your forecast, download a copy of your data, or remove your financial information from FlowSight." },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? payload[1]?.value;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground font-semibold" style={mono}>${value?.toLocaleString()}</p>
    </div>
  );
};

function ScenarioTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; dataKey?: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const values = payload.filter((item) => typeof item.value === "number");
  if (!values.length) return null;
  const projected = values.find((item) => item.dataKey === "projected");
  const recorded = values.find((item) => item.dataKey === "balance");
  const baseline = values.find((item) => item.dataKey === "baseline");
  const primary = projected ?? recorded ?? baseline;
  if (typeof primary?.value !== "number") return null;
  return <div className="min-w-[130px] rounded-xl border border-[#D7E0EC] bg-white/95 px-3 py-2.5 shadow-[0_12px_30px_rgba(28,28,34,0.12)] backdrop-blur-sm">
    <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground" style={mono}>{label}</p>
    <p className="mt-1 text-sm font-medium text-foreground" style={mono}>${primary.value.toLocaleString()}</p>
    <p className="mt-1 text-[9px] text-muted-foreground">{recorded ? "Recorded balance" : "Projected balance"}</p>
    {projected && baseline && projected.value !== baseline.value && <p className="mt-1.5 border-t border-border pt-1.5 text-[9px] text-primary" style={mono}>${Math.abs(baseline.value! - projected.value!).toLocaleString()} purchase impact</p>}
  </div>;
}

const ahaStories = [
  {
    label: "Tight week",
    eyebrow: "Five days of warning",
    primary: 420,
    secondary: 5,
    headline: "on August 3.",
    accent: "Payday is five days away.",
    body: "Rent, insurance, and your car payment all land in the same week.",
    note: "FlowSight shows you the squeeze while there is still time to respond.",
    condition: "Watch · Aug 3",
    conditionTone: "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]",
    balances: [5500, 5200, 5100, 4200, 2600, 1800, 420, 2820, 2610, 2450, 2300, 2180],
    events: [
      { label: "Rent", date: "Aug 1", amount: "−$1,650", point: 4 },
      { label: "Insurance", date: "Aug 3", amount: "−$180", point: 6 },
      { label: "Car payment", date: "Aug 3", amount: "−$410", point: 6 },
    ],
    kind: "tight" as const,
  },
  {
    label: "Safer month",
    eyebrow: "Room to decide",
    primary: 820,
    secondary: 0,
    headline: "safe to spend.",
    accent: "No below-buffer days ahead.",
    body: "Known bills stay covered and your lowest projected balance remains above the amount you want protected.",
    note: "FlowSight turns the whole month into one usable decision number.",
    condition: "Clear · through Aug 20",
    conditionTone: "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]",
    balances: [5500, 5320, 5160, 4980, 4620, 4380, 4200, 6600, 6280, 6010, 5780, 5600],
    events: [
      { label: "Rent covered", date: "Aug 1", amount: "−$1,650", point: 4 },
      { label: "Paycheck", date: "Aug 5", amount: "+$2,400", point: 7 },
      { label: "Buffer protected", date: "All month", amount: "$500", point: 6 },
    ],
    kind: "clear" as const,
  },
  {
    label: "Irregular income",
    eyebrow: "A range, not one guess",
    primary: 220,
    secondary: 1460,
    headline: "possible range.",
    accent: "Invoice timing sets the low.",
    body: "Your salary covers the known bills. The range changes mainly with when the Acme invoice arrives.",
    note: "Confirmed income stays fixed; uncertain payments remain visibly estimated.",
    condition: "Estimated · invoice timing",
    conditionTone: "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]",
    balances: [3900, 3760, 3540, 3320, 2940, 2720, 220, 1460, 1240, 1160, 980, 910],
    events: [
      { label: "Salary", date: "Regular", amount: "+$1,950", point: 3 },
      { label: "Acme invoice", date: "Aug 4–12", amount: "~+$1,240", point: 7 },
      { label: "Client deposit", date: "Possible", amount: "~+$600", point: 9 },
    ],
    kind: "irregular" as const,
  },
];

function AhaConditionBadge({ activeStory }: { activeStory: number }) {
  return <span className="relative grid shrink-0" aria-live="polite">{ahaStories.map((story, index) => <span key={story.condition} aria-hidden={activeStory !== index} className={`col-start-1 row-start-1 rounded-full px-3 py-1.5 text-xs font-medium transition-[opacity,transform] ease-out motion-reduce:transition-none ${story.conditionTone} ${activeStory === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"}`} style={{ transitionDuration: `${AHA_MOTION.badgeMs}ms` }}>{story.condition}</span>)}</span>;
}

function ForecastStoryChart({ activeStory, onStoryChange }: { activeStory: number; onStoryChange: (story: number) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const story = ahaStories[activeStory];
  const [animatedBalances, setAnimatedBalances] = useState<number[]>(ahaStories[0].balances);
  const animatedBalancesRef = useRef<number[]>(ahaStories[0].balances);
  const width = 600;
  const height = 170;
  const top = 16;
  const bottom = 24;
  const maxBalance = 7000;
  const points = animatedBalances.map((balance, index) => ({
    x: (index / (animatedBalances.length - 1)) * width,
    y: top + (1 - balance / maxBalance) * (height - top - bottom),
    date: `Day ${index * 3 + 1}`,
    balance,
  }));
  const lowIndex = animatedBalances.indexOf(Math.min(...animatedBalances));
  const lowPoint = points[lowIndex];
  const eventPoints = story.events.map((event, index, events) => {
    const matches = events.filter((candidate) => candidate.point === event.point);
    const matchIndex = matches.findIndex((candidate) => candidate.label === event.label);
    const offset = matches.length > 1 ? (matchIndex - (matches.length - 1) / 2) * 16 : 0;
    return { ...event, x: points[event.point].x + offset, y: points[event.point].y };
  });
  const linePath = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const areaPath = `${points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ")} L${width},${height - bottom} L0,${height - bottom} Z`;
  const bufferY = top + (1 - 500 / maxBalance) * (height - top - bottom);
  const hovered = hoveredIndex === null ? null : points[hoveredIndex];

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = story.balances;
    const from = animatedBalancesRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animatedBalancesRef.current = target;
      const reducedMotionFrame = window.requestAnimationFrame(() => setAnimatedBalances(target));
      return () => window.cancelAnimationFrame(reducedMotionFrame);
    }
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / AHA_MOTION.morphMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = target.map((value, index) => from[index] + (value - from[index]) * eased);
      animatedBalancesRef.current = next;
      setAnimatedBalances(next);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [story]);

  return <div ref={rootRef}>
    <div className="relative flex flex-wrap items-center justify-between gap-3 mb-4"><div><p className="text-xs text-muted-foreground">Example forecast</p><p className="font-medium">Today → next 30 days</p></div><AhaConditionBadge activeStory={activeStory} /></div>
    <div className="relative h-[190px]" aria-label={`${story.label} example forecast`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" role="img">
        <defs><linearGradient id="storyArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C9633B" stopOpacity=".18" /><stop offset="100%" stopColor="#C9633B" stopOpacity=".01" /></linearGradient></defs>
        {[.25, .5, .75].map((position) => <line key={position} x1="0" y1={top + (height - top - bottom) * position} x2={width} y2={top + (height - top - bottom) * position} stroke="#D7E0EC" strokeWidth="1" opacity=".55" />)}
        <path d={areaPath} fill="url(#storyArea)" className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`} />
        <line x1="0" y1={top} x2="0" y2={height - bottom} stroke="#6B7280" strokeDasharray="4 4" opacity=".55" /><text x="7" y="14" fill="#6B7280" fontSize="10">Today</text>
        <line x1="0" y1={bufferY} x2={width} y2={bufferY} stroke="#CA8A04" strokeDasharray="6 5" opacity=".8" /><text x="6" y={bufferY - 7} fill="#CA8A04" fontSize="10">$500 safety buffer</text>
        <path d={linePath} fill="none" stroke="#C9633B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={visible ? 0 : 1} className="transition-[stroke-dashoffset] duration-1000 ease-out" />
        {eventPoints.map((event, index) => <g key={event.label}><line x1={event.x} y1={event.y + 7} x2={event.x} y2={height - bottom} stroke={event.amount.startsWith("+") ? "#2D7A55" : "#C9633B"} strokeWidth="1.25" strokeDasharray="3 3" opacity=".48" /><circle cx={event.x} cy={event.y} r="7" fill={event.amount.startsWith("+") ? "#2D7A55" : "#C9633B"} stroke="#F7FAFF" strokeWidth="2" /><text x={event.x} y={event.y + 2.7} fill="white" fontSize="7.5" fontWeight="600" textAnchor="middle">{index + 1}</text></g>)}
        <circle cx={lowPoint.x} cy={lowPoint.y} r="5" fill="#B7791F" stroke="white" strokeWidth="2.5" className={visible ? "fs-low-pulse" : "opacity-0"} />
        {points.map((point, index) => <circle key={point.date} cx={point.x} cy={point.y} r="10" fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} tabIndex={0} onFocus={() => setHoveredIndex(index)} onBlur={() => setHoveredIndex(null)} aria-label={`${point.date}: $${point.balance.toLocaleString()} projected balance`} />)}
      </svg>
      {hovered && <div className="pointer-events-none absolute z-10 rounded-xl border border-[#D7E0EC] bg-[#F7FAFF] px-3 py-2 text-xs shadow-lg" style={{ left: `${Math.min(88, Math.max(4, hovered.x / width * 100))}%`, top: `${Math.max(2, hovered.y / height * 100 - 14)}%`, transform: "translateX(-50%)" }}><p className="text-[#73766F]">{hovered.date}</p><p className="font-medium text-[#111827] mt-0.5" style={mono}>${hovered.balance.toLocaleString()}</p>{hoveredIndex === lowIndex && <p className="mt-1 text-[hsl(var(--fs-amber))]">Lowest projected point</p>}</div>}
    </div>
    <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground" style={mono}>What creates this forecast</p>
    <div key={`events-${activeStory}`} className="relative mt-2 grid min-h-[76px] gap-2 sm:grid-cols-3">{story.events.map((event, index) => <button type="button" key={event.label} onClick={() => setHoveredIndex(event.point)} className={`rounded-xl border border-l-2 bg-white p-3 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 ${event.amount.startsWith("+") ? "border-l-[#2D8B5A]" : "border-l-primary"} ${story.kind === "irregular" && index > 0 ? "border-dashed border-[hsl(var(--fs-amber))]/35" : "border-[#D7E0EC]"}`} style={{ animationDelay: `${index * AHA_MOTION.chipStaggerMs}ms`, animationDuration: `${AHA_MOTION.copyMs}ms`, animationFillMode: "both" }}><div className="flex items-center gap-2 text-xs"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ${event.amount.startsWith("+") ? "bg-[hsl(var(--fs-green))]" : "bg-primary"}`}>{index + 1}</span><span className="min-w-0 flex-1 truncate font-medium">{event.label}</span><span style={mono}>{event.amount}</span></div><p className="pl-7 text-[10px] text-muted-foreground mt-1">{event.date} · {story.kind === "irregular" && index > 0 ? "estimated" : "confirmed"}</p></button>)}</div>
    <div className="mt-4 grid grid-cols-3 gap-2" role="tablist" aria-label="Example forecast stories">{ahaStories.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={activeStory === index} onClick={() => onStoryChange(index)} className={`rounded-xl border px-3 py-2 text-xs transition-[background-color,border-color,color] duration-200 ${activeStory === index ? "border-primary/35 bg-primary/[0.08] font-medium text-foreground" : "border-[#D7E0EC] bg-white text-muted-foreground hover:border-primary/25 hover:text-foreground"}`}>{item.label}</button>)}</div>
  </div>;
}

function InteractiveAhaShowcase() {
  const [activeStory, setActiveStory] = useState(0);
  const story = ahaStories[activeStory];
  const headings = ["See it before it arrives.", "Know what stays available.", "See the range—not one guess."];
  const outcomes = [
    "$420 on August 3",
    "$820 safe to spend",
    "$220–$1,460 projected range",
  ];

  return <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
    <div className="max-w-xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>{story.eyebrow}</p>
      <h2 className="text-[40px] font-medium leading-[1.06] tracking-tight lg:text-[48px]" style={display}>{headings[activeStory]}</h2>
      <p className="mt-5 text-[18px] leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground" style={mono}>{outcomes[activeStory]}</strong>. {story.body}</p>
      <div className="mt-6 rounded-2xl border border-primary/15 bg-white/70 p-4 backdrop-blur-sm"><p className="text-[10px] uppercase tracking-[0.14em] text-primary" style={mono}>Why it matters</p><p className="mt-2 text-sm font-medium text-foreground">{story.accent}</p><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{story.note}</p></div>
      <p className="mt-5 text-xs text-muted-foreground">Choose an example to inspect. FlowSight will not advance it for you.</p>
    </div>
    <div className="rounded-[30px] border border-[#D7E0EC] bg-[#F7FAFF] p-5 shadow-[0_28px_80px_rgba(28,28,34,0.10)] sm:p-7">
      <ForecastStoryChart activeStory={activeStory} onStoryChange={setActiveStory} />
    </div>
  </div>;
}

const processSteps = [
  { n: "01", title: "Bring in your numbers", desc: "Import a CSV from your bank, or enter the essentials yourself. No bank connection required." },
  { n: "02", title: "Check what we found", desc: "Review your transactions and confirm the paychecks, bills, and subscriptions that happen regularly." },
  { n: "03", title: "See what’s ahead", desc: "Get a clear 30-day view of your balance, your safest spending amount, and the days that may need attention." },
];

function StepIllustration({ step }: { step: number }) {
  if (step === 0) return <div className="min-h-[286px] rounded-2xl border border-[#E2E5EB] bg-white p-5 flex flex-col"><div className="flex items-center justify-between mb-5"><div><p className="text-[10px] uppercase tracking-[0.15em] text-primary">Connection-free import</p><h4 className="font-medium text-[#0F1D3A] mt-1">Import a CSV</h4></div><span className="rounded-full bg-[#2D8B5A]/10 px-2.5 py-1 text-[10px] text-[#2D8B5A]">No bank login</span></div><div className="grid grid-cols-2 gap-3 mb-3"><div className="rounded-xl border border-[#E2E5EB] px-3 py-2"><p className="text-[10px] text-[#6B7280]">Account name</p><p className="text-xs text-[#0F1D3A] mt-1">Everyday checking</p></div><div className="rounded-xl border border-[#E2E5EB] px-3 py-2"><p className="text-[10px] text-[#6B7280]">Account type</p><p className="text-xs text-[#0F1D3A] mt-1">Checking</p></div></div><div className="flex-1 rounded-xl border border-dashed border-primary/40 bg-primary/[0.04] flex flex-col items-center justify-center text-center px-5"><ArrowRight className="-rotate-90 text-primary mb-2" size={20} /><p className="text-sm font-medium text-[#0F1D3A]">Choose a transaction file</p><p className="text-[11px] text-[#6B7280] mt-1">You’ll review everything before it is saved.</p></div></div>;
  if (step === 1) return <div className="min-h-[286px] rounded-2xl border border-[#E2E5EB] bg-white p-5"><div className="flex items-center justify-between mb-4"><div><p className="text-[10px] uppercase tracking-[0.15em] text-primary">Review patterns</p><h4 className="font-medium text-[#0F1D3A] mt-1">3 recurring suggestions</h4></div><span className="text-[10px] text-[#6B7280]">Review each one</span></div><div className="divide-y divide-[#E2E5EB]">{[["Rent", "Monthly · $1,650", "Confirmed", "#2D8B5A"], ["Paycheck", "Every 2 weeks · $2,400", "Confirmed", "#2D8B5A"], ["Electricity", "6 occurrences · $84–$139", "Estimated", "#CA8A04"]].map(([name, detail, status, color]) => <div key={name} className="flex items-center gap-3 py-4"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#0F1D3A]">{name}</p><p className="text-[11px] text-[#6B7280] mt-0.5">{detail}</p></div><span className="rounded-full px-2.5 py-1 text-[10px]" style={{ color, backgroundColor: `${color}14` }}>{status}</span></div>)}</div></div>;
  return <div className="min-h-[286px] rounded-2xl border border-[#E2E5EB] bg-white p-5"><div className="grid grid-cols-3 gap-2 mb-5"><div className="rounded-xl bg-[var(--fs-tint)] p-3"><p className="text-[10px] text-[#6B7280]">Safe to spend</p><p className="text-lg font-medium text-[#0F1D3A] mt-1" style={mono}>$680</p></div><div className="rounded-xl bg-[var(--fs-tint)] p-3"><p className="text-[10px] text-[#6B7280]">Projected low</p><p className="text-lg font-medium text-[#CA8A04] mt-1" style={mono}>$420</p></div><div className="rounded-xl bg-[#CA8A04]/10 p-3"><p className="text-[10px] text-[#6B7280]">Condition</p><p className="text-xs font-medium text-[#CA8A04] mt-2">Watch · Aug 3</p></div></div><div className="rounded-xl border border-[#E2E5EB] p-4"><div className="flex justify-between text-[10px] text-[#6B7280] mb-4"><span>30-day forecast</span><span>Jul 21 → Aug 20</span></div><div className="h-24 flex items-end gap-1.5">{[72, 67, 62, 56, 50, 35, 16, 43, 39, 34, 30, 27].map((height, index) => <span key={index} className={`flex-1 rounded-t ${index === 6 ? "bg-[#CA8A04]" : "bg-primary/70"}`} style={{ height: `${height}%` }} />)}</div><div className="border-t border-dashed border-[#CA8A04] mt-1 pt-2 text-[10px] text-[#CA8A04]">$500 safety buffer</div></div></div>;
}

export default function Landing({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const router = useRouter();
  const navigate = router.push;
  const primaryHref = isSignedIn ? "/app/dashboard" : "/sign-up";
  const primaryLabel = isSignedIn ? "Open dashboard" : "Join Beta";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [scenarioUsesRecommendedDate, setScenarioUsesRecommendedDate] = useState(false);
  const [comparisonFocus, setComparisonFocus] = useState<"past" | "future">("past");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [featurePanelVisible, setFeaturePanelVisible] = useState([false, false, false, false]);
  const [featurePanelResolved, setFeaturePanelResolved] = useState([false, false, false, false]);
  const [featurePanelRuns, setFeaturePanelRuns] = useState([0, 0, 0, 0]);
  const [activeSection, setActiveSection] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const sectionVisibility = useRef(new Map<string, number>());
  const featurePanelRefs = useRef<Array<HTMLElement | null>>([]);

  const replayFeaturePanel = (panel: number) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setFeaturePanelRuns((runs) => runs.map((run, index) => index === panel ? run + 1 : run));
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => {
        setFeaturePanelVisible([true, true, true, true]);
        setFeaturePanelResolved([true, true, true, true]);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    const resolveTimers: number[] = [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const panel = Number((entry.target as HTMLElement).dataset.enginePanel);
        setFeaturePanelVisible((visible) => visible.map((value, index) => index === panel ? true : value));
        resolveTimers.push(window.setTimeout(() => {
          setFeaturePanelResolved((resolved) => resolved.map((value, index) => index === panel ? true : value));
        }, GRID_THINK_MS));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.42 });
    featurePanelRefs.current.forEach((panel) => panel && observer.observe(panel));
    return () => {
      observer.disconnect();
      resolveTimers.forEach(window.clearTimeout);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(available > 0 ? Math.min(1, window.scrollY / available) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  useEffect(() => {
    const ids = ["features", "security", "faq"];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => sectionVisibility.current.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      const mostVisible = ids.reduce((best, id) => (sectionVisibility.current.get(id) ?? 0) > (sectionVisibility.current.get(best) ?? 0) ? id : best, "");
      setActiveSection((sectionVisibility.current.get(mostVisible) ?? 0) > 0 ? mostVisible : "");
    }, { rootMargin: "-20% 0px -45% 0px", threshold: [0.15, 0.3, 0.5, 0.7] });
    ids.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    sections.forEach((section) => {
      section.style.opacity = "0";
      section.style.transform = "translateY(20px)";
      section.style.transition = "opacity 400ms ease-out, transform 400ms ease-out";
    });
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const section = entry.target as HTMLElement;
      section.style.opacity = "1";
      section.style.transform = "translateY(0)";
      observer.unobserve(section);
    }), { threshold: 0.12 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scenarioData = generateScenarioData(scenarios[scenario].amount, scenarioUsesRecommendedDate);
  const projectedBalances = scenarioData.flatMap((point) => typeof point.projected === "number" ? [point.projected] : []);
  const lowestProjectedBalance = Math.min(...projectedBalances);
  const safeToSpend = Math.max(0, lowestProjectedBalance - 500);
  const scenarioLowPoint = scenarioData.reduce<{ day: string; value: number } | null>((lowest, point) => {
    if (typeof point.projected !== "number") return lowest;
    return !lowest || point.projected < lowest.value ? { day: point.day, value: point.projected } : lowest;
  }, null);
  const scenarioCondition = safeToSpend < 500
    ? { label: "Tight", className: "bg-[hsl(var(--fs-red-bg))] text-[hsl(var(--fs-red))]" }
    : safeToSpend < 1000
      ? { label: "Watch", className: "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]" }
      : { label: scenario === 0 ? "Baseline" : "Clear", className: "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]" };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="fs-landing min-h-screen bg-background text-foreground overflow-x-hidden" style={flowsightLandingTheme}>
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent" aria-hidden="true"><span className="block h-full origin-left bg-[linear-gradient(90deg,#2D7A55_0%,#C9633B_52%,#2D7A55_100%)] transition-transform duration-75" style={{ transform: `scaleX(${scrollProgress})` }} /></div>

      {/* NAV */}
      <nav className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3">
        <div className={`pointer-events-auto mx-auto flex h-[60px] max-w-6xl items-center justify-between rounded-[22px] border px-5 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${scrolled ? "border-white/65 bg-white/[0.42] shadow-[0_10px_34px_rgba(15,29,58,0.09)] backdrop-blur-2xl" : "border-white/50 bg-white/[0.30] shadow-[0_8px_28px_rgba(15,29,58,0.055)] backdrop-blur-xl"}`}>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <TrendingUp size={22} strokeWidth={2.2} className="text-[#111111]" />
            <span className="font-medium text-[#111111] text-sm tracking-tight" style={display}>FlowSight</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {["Features", "Pricing", "Security", "FAQ"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} aria-current={activeSection === l.toLowerCase().replace(/\s+/g, "-") ? "location" : undefined} className={`relative py-2 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-primary after:transition-transform after:duration-300 ${activeSection === l.toLowerCase().replace(/\s+/g, "-") ? "font-medium text-foreground after:scale-x-100" : "text-muted-foreground hover:text-foreground after:scale-x-0"}`}>{l}</a>
            ))}
            <Link href="/learn" className="relative py-2 text-sm text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100">Learn</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {!isSignedIn && <button onClick={() => navigate("/sign-in")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Sign in</button>}
            <Magnetic><button onClick={() => navigate(primaryHref)} className="fs-brand-action text-sm px-4 py-2 rounded-xl font-medium">{primaryLabel}</button></Magnetic>
          </div>
          <button className="md:hidden text-muted-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="pointer-events-auto mx-auto mt-2 flex max-w-6xl flex-col gap-4 rounded-[22px] border border-white/70 bg-white/90 px-5 py-5 shadow-xl backdrop-blur-2xl md:hidden">
            {["Features", "Pricing", "Security", "FAQ"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>{l}</a>
            ))}
            <Link href="/learn" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Learn</Link>
            {!isSignedIn && <button onClick={() => navigate("/sign-in")} className="text-sm text-muted-foreground text-left">Sign in</button>}
            <button onClick={() => navigate(primaryHref)} className="fs-brand-action text-sm px-4 py-2.5 rounded-xl font-medium">{primaryLabel}</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <ExpandingLandingHero isSignedIn={isSignedIn} navigate={navigate} />

      {/* AHA FORECAST */}
      <section id="how-it-works" data-reveal className="relative scroll-mt-16 overflow-hidden border-y border-[#D7E0EC]/70 bg-white px-5 py-24">
        <div className="relative z-10 max-w-6xl mx-auto"><CausalAhaForecast /></div>
      </section>

      {/* ENGINE QUALITIES */}
      <section
        data-reveal
        className="relative overflow-hidden px-5 py-24"
        id="features"
        onPointerMove={moveCursorGlow}
        onPointerLeave={(event) => {
          hideCursorGlow(event);
        }}
      >
        <div data-cursor-glow className="pointer-events-none absolute left-0 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(201,99,59,0.09),rgba(201,99,59,0.025)_40%,transparent_70%)] opacity-0 blur-xl transition-[transform,opacity] duration-150 ease-out" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>What your forecast already knows</p>
            <h2 className="text-[40px] font-medium leading-[1.08] tracking-tight lg:text-[48px]" style={display}>The work happens quietly.<br />The assumptions stay <span className="text-primary">visible.</span></h2>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">From the numbers you provide, FlowSight finds the structure—and shows you what it assumed.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article ref={(node) => { featurePanelRefs.current[0] = node; }} data-engine-panel="0" tabIndex={0} onMouseEnter={() => replayFeaturePanel(0)} onFocus={() => replayFeaturePanel(0)} className="group rounded-3xl border border-[#D7E0EC] bg-white p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_55px_rgba(28,28,34,0.09)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary" style={mono}>Patterns recognised</p>
              <h3 className="mt-3 text-[25px] font-medium" style={display}>Repeated activity becomes something useful.</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">FlowSight groups repeated transactions, checks their timing and amount, then lets you confirm what belongs in the forecast.</p>
              <div key={`pattern-${featurePanelVisible[0]}-${featurePanelRuns[0]}`} className="mt-6 grid gap-3 rounded-2xl border border-[#D7E0EC] bg-[#F2F6FC] p-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                <div className="space-y-2">
                  {["May 1 · −$1,650", "Jun 1 · −$1,650", "Jul 1 · −$1,650"].map((row, index) => <div key={row} className={`rounded-xl border border-[#D7E0EC] bg-white px-3 py-2 text-xs ${featurePanelVisible[0] ? "fs-engine-list-row" : "opacity-0"}`} style={{ animationDelay: `${index * 220}ms` }}><span className="font-medium">Parkview Rent</span><span className="float-right text-muted-foreground" style={mono}>{row}</span></div>)}
                </div>
                <ArrowRight className={`mx-auto text-primary ${featurePanelResolved[0] ? "fs-engine-converge-arrow" : "opacity-0"}`} size={18} />
                <div className={`rounded-2xl border border-primary/20 bg-white p-4 ${featurePanelResolved[0] ? "fs-engine-resolve-card" : "opacity-0"}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="font-medium">Rent</p><p className="mt-1 text-xs text-muted-foreground">Monthly · next Aug 1</p></div><span className="rounded-full bg-[hsl(var(--fs-green-bg))] px-2 py-1 text-[10px] font-medium text-[hsl(var(--fs-green))]">Confirmed</span></div>
                  <p className="mt-5 text-lg font-medium" style={mono}>−$1,650</p>
                </div>
              </div>
            </article>

            <article ref={(node) => { featurePanelRefs.current[1] = node; }} data-engine-panel="1" tabIndex={0} onMouseEnter={() => replayFeaturePanel(1)} onFocus={() => replayFeaturePanel(1)} className="group rounded-3xl border border-[#D7E0EC] bg-[#F2F6FC] p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_55px_rgba(28,28,34,0.09)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary" style={mono}>Certainty stays visible</p>
              <h3 className="mt-3 text-[25px] font-medium" style={display}>Known facts and estimates never look the same.</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Stable amounts stay confirmed. Variable bills keep the evidence behind the estimate.</p>
              <div key={`certainty-${featurePanelVisible[1]}-${featurePanelRuns[1]}`} className="mt-6 space-y-3">
                <div className={`rounded-2xl border border-[#D7E0EC] bg-white p-4 ${featurePanelVisible[1] ? "fs-engine-classify-confirmed" : "opacity-0"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Netflix</p><p className="mt-1 text-xs text-muted-foreground">6 occurrences · same amount</p></div><div className="text-right"><span className="rounded-full bg-[hsl(var(--fs-green-bg))] px-2 py-1 text-[10px] text-[hsl(var(--fs-green))]">Confirmed</span><p className="mt-2 text-sm" style={mono}>−$17.99</p></div></div></div>
                <div className={`rounded-2xl border border-dashed border-[hsl(var(--fs-amber))]/40 bg-white p-4 ${featurePanelVisible[1] ? "fs-engine-classify-estimated" : "opacity-0"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Electricity</p><p className={`mt-1 text-xs text-muted-foreground transition-opacity duration-300 ${featurePanelResolved[1] ? "opacity-100" : "opacity-0"}`}>6 occurrences · $84–$139</p></div><div className="text-right"><span className="rounded-full bg-[hsl(var(--fs-amber-bg))] px-2 py-1 text-[10px] text-[hsl(var(--fs-amber))]">Estimated</span><p className="mt-2 text-sm" style={mono}>~−$117</p></div></div></div>
              </div>
            </article>

            <article ref={(node) => { featurePanelRefs.current[2] = node; }} data-engine-panel="2" tabIndex={0} onMouseEnter={() => replayFeaturePanel(2)} onFocus={() => replayFeaturePanel(2)} className="group rounded-3xl border border-[#D7E0EC] bg-[#F2F6FC] p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_55px_rgba(28,28,34,0.09)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary" style={mono}>Transfers connected</p>
              <h3 className="mt-3 text-[25px] font-medium" style={display}>The same money is not counted twice.</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Matching activity across your accounts is linked as a transfer—not mistaken for new income or another expense.</p>
              <div key={`transfer-${featurePanelVisible[2]}-${featurePanelRuns[2]}`} className="relative mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#D7E0EC] bg-white p-4"><p className="text-[10px] text-muted-foreground">Primary checking · Jul 12</p><p className="mt-2 text-sm font-medium">Payment to Amex</p><p className="mt-4" style={mono}>−$1,200</p></div>
                <div className="rounded-2xl border border-[#D7E0EC] bg-white p-4"><p className="text-[10px] text-muted-foreground">Amex · Jul 13</p><p className="mt-2 text-sm font-medium">Payment received</p><p className="mt-4 text-muted-foreground" style={mono}>+$1,200</p></div>
                {featurePanelResolved[2] && <span className="fs-engine-transfer-beam absolute left-1/2 top-1/2 hidden h-px w-[84px] -translate-x-1/2 -translate-y-1/2 bg-primary/25 sm:block"><span className="fs-engine-transfer-pulse absolute -top-1 h-2 w-2 rounded-full bg-primary" /></span>}
                <span className={`absolute left-1/2 top-1/2 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/30 bg-white text-primary sm:flex ${featurePanelResolved[2] ? "fs-engine-transfer-link" : "opacity-0"}`}>↔</span>
              </div>
              <p className={`mt-4 text-center text-xs text-muted-foreground transition-opacity duration-300 ${featurePanelResolved[2] ? "opacity-100" : "opacity-0"}`}>Strong match · linked as a reversible transfer</p>
            </article>

            <article ref={(node) => { featurePanelRefs.current[3] = node; }} data-engine-panel="3" tabIndex={0} onMouseEnter={() => replayFeaturePanel(3)} onFocus={() => replayFeaturePanel(3)} className="group rounded-3xl border border-[#D7E0EC] bg-white p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_55px_rgba(28,28,34,0.09)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary" style={mono}>Card timing understood</p>
              <h3 className="mt-3 text-[25px] font-medium" style={display}>Purchases explain spending. The payment explains cash.</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Card purchases collect through the statement cycle. FlowSight places one estimated cash payment on the due date.</p>
              <div key={`card-${featurePanelVisible[3]}-${featurePanelRuns[3]}`} className="mt-6 rounded-2xl border border-[#D7E0EC] bg-[#F2F6FC] p-4">
                <div className="grid grid-cols-2 gap-2 border-b border-[#D7E0EC] pb-4 text-center text-[10px] text-muted-foreground xl:grid-cols-4">{[["Market Basket", "$60"], ["Trader Joe's", "$30"], ["Whole Foods", "$60"], ["Netflix", "$17.99"]].map(([name, amount], index) => <div key={name} className={`rounded-xl bg-white px-2 py-3 ${featurePanelVisible[3] ? "fs-engine-charge" : "opacity-0"}`} style={{ animationDelay: `${index * 190}ms` }}><p className="truncate">{name}</p><p className="mt-2 font-medium text-foreground" style={mono}>−{amount}</p></div>)}</div>
                <div className={`mt-4 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-white p-4 ${featurePanelResolved[3] ? "fs-engine-payment-total" : "opacity-0"}`}><div><p className="text-sm font-medium">Estimated card payment</p><p className="mt-1 text-xs text-muted-foreground">Due Aug 15 · based on charges so far</p></div><div className="text-right"><span className="rounded-full bg-[hsl(var(--fs-amber-bg))] px-2 py-1 text-[10px] text-[hsl(var(--fs-amber))]">Estimated</span><p className="mt-2 font-medium" style={mono}>−$167.99</p></div></div>
              </div>
            </article>
          </div>

          <button type="button" onClick={() => navigate("/features")} className="mx-auto mt-8 flex items-center gap-2 text-sm font-medium text-primary hover:text-[hsl(var(--fs-primary-hover))]">See all features <ArrowRight size={14} /></button>
        </div>
      </section>

      {/* SCENARIO PLANNER */}
      <section data-reveal className="relative overflow-hidden border-y border-[#D7E0EC]/70 bg-white px-5 py-24">
        <div className="pointer-events-none absolute right-[-12rem] top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(138,181,226,0.20)_0%,rgba(210,231,252,0.10)_45%,transparent_72%)] blur-2xl" />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Scenario planner</p>
            <h2 className="text-[40px] font-medium leading-[1.08] tracking-tight lg:text-[48px]" style={display}>Test a decision <span className="text-primary">before you make it.</span></h2>
            <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">Enter a purchase and when you want to make it. FlowSight compares it with your current plan, checks your safety buffer, and—when timing is tight—finds the earliest date that stays clear. It remains a private what-if and never changes your transactions, accounts, or real forecast.</p>
            <div className="mt-7 grid grid-cols-2 gap-2" aria-label="Scenario demo">
              {scenarios.map((item, index) => <button type="button" onClick={() => { setScenario(index); setScenarioUsesRecommendedDate(false); }} key={item.label} aria-pressed={scenario === index} className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${scenario === index ? "border-primary/40 bg-primary/[0.08] text-foreground" : "border-[#D7E0EC] bg-white text-muted-foreground hover:border-primary/25 hover:text-foreground"}`}>{item.label}</button>)}
            </div>
          </div>
          <div className="rounded-[30px] border border-[#D7E0EC] bg-[linear-gradient(145deg,#FFFFFF_0%,#FFFFFF_46%,#F1F6FC_100%)] p-5 shadow-[0_28px_80px_rgba(28,28,34,0.08)] sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground" style={mono}>{scenario === 0 ? "Your current plan" : `Private what-if · ${scenarioUsesRecommendedDate ? "tested Aug 11" : "tested today"}`}</p><p className="mt-2 font-medium">{scenario === 0 ? "No extra purchase" : `${scenarios[scenario].label.replace(/\s*\([^)]*\)$/, "")} · −$${scenarios[scenario].amount.toLocaleString()}`}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${scenarioCondition.className}`}>{scenarioCondition.label}</span></div>
            <ResponsiveContainer width="100%" height={230}><AreaChart data={scenarioData} margin={{ top: 24, right: 8, left: -18, bottom: 0 }}><XAxis dataKey="day" tick={{ fontSize: 9, fill: "#73766F" }} tickLine={false} axisLine={false} interval={2} /><YAxis domain={[0, 6500]} ticks={[0, 3000, 6000]} tick={{ fontSize: 9, fill: "#73766F" }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} /><Tooltip content={<ScenarioTooltip />} cursor={{ stroke: "#C9633B", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.55 }} isAnimationActive={false} /><ReferenceLine x={scenarioUsesRecommendedDate ? "Aug 11" : "Today"} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: "Purchase", position: "insideTopLeft", fill: "#73766F", fontSize: 9 }} /><ReferenceLine y={500} stroke="#B7791F" strokeDasharray="5 4" label={{ value: "$500 buffer", position: "insideBottomLeft", fill: "#B7791F", fontSize: 9 }} /><Area type="monotone" dataKey="balance" stroke="#111827" strokeWidth={2.5} fill="#1118270A" dot={false} isAnimationActive={false} connectNulls={false} />{scenario > 0 && <Area type="monotone" dataKey="baseline" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={1.5} fill="transparent" dot={false} isAnimationActive={false} />}<Area type="monotone" dataKey="projected" stroke="#C9633B" strokeWidth={2.75} fill="#C9633B14" dot={false} animationDuration={SCENARIO_MOTION_MS} connectNulls={false} />{scenarioLowPoint && <ReferenceDot x={scenarioLowPoint.day} y={scenarioLowPoint.value} r={4} fill="#C9633B" stroke="#fff" strokeWidth={2} />}</AreaChart></ResponsiveContainer>
            {scenario === 3 && <div className={`mb-4 rounded-xl border p-3 ${scenarioUsesRecommendedDate ? "border-[hsl(var(--fs-green))]/25 bg-[hsl(var(--fs-green-bg))]/55" : "border-[hsl(var(--fs-amber))]/25 bg-[hsl(var(--fs-amber-bg))]/55"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium">{scenarioUsesRecommendedDate ? "August 11 keeps the forecast clear." : "Buying today creates a tight day on August 7."}</p><p className="mt-1 text-[10px] text-muted-foreground">{scenarioUsesRecommendedDate ? "Compared with your original date—nothing has been saved." : "August 11 is the earliest date that stays clear."}</p></div><button type="button" onClick={() => setScenarioUsesRecommendedDate((value) => !value)} className="rounded-lg border border-[#D7E0EC] bg-white px-3 py-2 text-[10px] font-medium text-primary hover:border-primary/30">{scenarioUsesRecommendedDate ? "Compare today" : "Compare Aug 11"}</button></div></div>}
            <div className="grid grid-cols-2 gap-4 border-t border-[#D7E0EC] pt-4"><div><p className="text-[10px] text-muted-foreground">Projected low</p><p className="mt-1 text-lg font-medium" style={mono}>${lowestProjectedBalance.toLocaleString()}</p><p className="mt-1 text-[10px] text-muted-foreground">{scenarioLowPoint?.day}</p></div><div><p className="text-[10px] text-muted-foreground">Safe to Spend</p><p className="mt-1 text-lg font-medium text-[hsl(var(--fs-green))]" style={mono}>${safeToSpend.toLocaleString()}</p><p className="mt-1 text-[10px] text-muted-foreground">after $500 buffer</p></div></div>
          </div>
        </div>
      </section>

      {/* CONTRAST */}
      <section
        data-reveal
        className="fs-warm-section-transition relative overflow-hidden py-24 px-5"
        onPointerMove={moveCursorGlow}
        onPointerLeave={hideCursorGlow}
      >
        <div data-cursor-glow className="pointer-events-none absolute left-0 top-0 z-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(201,99,59,0.12),rgba(201,99,59,0.035)_38%,transparent_70%)] opacity-0 blur-xl transition-[transform,opacity] duration-150 ease-out" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>From history to foresight</p>
            <h2 className="text-[42px] lg:text-[52px] font-medium tracking-tight leading-[1.08] mb-4" style={display}>
              Stop looking <span className="text-muted-foreground">backward.</span><br />Start planning <span className="text-accent">forward.</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="mx-auto mb-5 flex w-fit rounded-full border border-border bg-white p-1 shadow-sm" role="tablist" aria-label="Compare finance apps"><button role="tab" aria-selected={comparisonFocus === "past"} onClick={() => setComparisonFocus("past")} className={`rounded-full px-5 py-2 text-sm ${comparisonFocus === "past" ? "bg-[#0F1D3A] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>Looking back</button><button role="tab" aria-selected={comparisonFocus === "future"} onClick={() => setComparisonFocus("future")} className={`rounded-full px-5 py-2 text-sm ${comparisonFocus === "future" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>Looking ahead</button></div>
            <div key={comparisonFocus} className="relative overflow-hidden rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-[0_2px_8px_rgba(15,29,58,0.06)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
              <div className={`absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl ${comparisonFocus === "future" ? "bg-primary/10" : "bg-[var(--fs-tint)]"}`} />
              <div className="relative mb-6 flex items-center justify-between gap-5"><div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${comparisonFocus === "future" ? "bg-primary text-primary-foreground" : "bg-[var(--fs-tint)] text-muted-foreground"}`}>{comparisonFocus === "future" ? <Sparkles size={17} /> : <BarChart3 size={17} />}</div><div><p className="text-xs text-muted-foreground">{comparisonFocus === "future" ? "FlowSight" : "Traditional finance apps"}</p><h3 className="font-medium text-lg">{comparisonFocus === "future" ? "Looking ahead" : "Looking back"}</h3></div></div><svg viewBox="0 0 92 38" className="h-10 w-24" aria-hidden="true">{comparisonFocus === "past" ? [18, 27, 21, 31, 24].map((height, index) => <rect key={index} x={5 + index * 17} y={35 - height} width="10" height={height} rx="3" fill="#73766F" opacity={1 - index * .14} />) : <><path d="M5 29 C22 27, 31 22, 43 24 S65 12, 87 8" fill="none" stroke="#C9633B" strokeWidth="2.5" strokeLinecap="round" /><circle cx="87" cy="8" r="3.5" fill="#2D7A55" /></>}</svg></div>
              <p className="relative leading-relaxed mb-7 text-muted-foreground">{comparisonFocus === "future" ? "FlowSight shows what the next few weeks may hold—and what to do if money gets tight." : "Most tools organize what already happened. Useful for review, but they can't tell you if Friday will be tight."}</p>
              <div className="relative grid sm:grid-cols-3 gap-3">{(comparisonFocus === "future" ? ["Warns you before the tight day", "Labels confirmed and estimated events", '“$820 safe to spend until the 18th”'] : ["Reports money already spent", "Categories instead of timing", '“$200 spent on dining last month”']).map((item, index) => <div key={item} className={`relative overflow-hidden rounded-xl border p-3 text-sm ${comparisonFocus === "future" ? `border-primary/30 bg-primary/[0.08] font-medium motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 ${index === 2 ? "fs-contrast-payoff" : ""}` : "fs-contrast-old border-border bg-[var(--fs-tint)] text-muted-foreground"}`} style={{ animationDelay: `${index * 120}ms`, ["--contrast-delay" as string]: `${index * 120}ms` }}>{comparisonFocus === "future" && <svg viewBox="0 0 16 16" className="mr-1.5 inline-block h-4 w-4 align-[-3px] text-[hsl(var(--fs-green))]" aria-hidden="true"><path d="M3 8.5 6.4 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="fs-contrast-check" style={{ animationDelay: `${index * 120}ms` }} /></svg>}{item}</div>)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section data-reveal className="py-20 px-5 bg-white" id="security">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Security</p>
            <h2 className="text-[40px] font-medium tracking-tight mb-3" style={display}>Start <span className="text-primary">without handing over</span> your bank login.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Use a CSV or manual entry, review what enters the forecast, and see the details behind the result.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {trustItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/20 transition-colors duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon size={17} className="text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BETA PRICING */}
      <section id="pricing" data-reveal className="scroll-mt-16 border-y border-[#D7E0EC]/70 bg-white px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Pricing</p>
            <h2 className="text-[40px] font-medium leading-[1.08] tracking-tight lg:text-[48px]" style={display}>Free during the <span className="text-primary">private beta.</span></h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">Explore your forecast and help shape FlowSight at no cost. We&apos;ll share pricing clearly before any paid plan begins.</p>
          </div>
          <div className="grid overflow-hidden rounded-3xl border border-border bg-white md:grid-cols-3">
            {[
              { step: "Now", title: "Private beta", copy: "Use FlowSight free while we learn from early users.", emphasis: true },
              { step: "Before launch", title: "Clear notice", copy: "We&apos;ll publish plans and what each includes before anything changes." },
              { step: "Your choice", title: "No surprise charge", copy: "You decide whether a future paid plan is right for you." },
            ].map((item, index) => (
              <article key={item.title} className={`relative p-7 sm:p-8 ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""} ${item.emphasis ? "bg-primary/[0.05]" : "bg-white"}`}>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground" style={mono}>{item.step}</p>
                <h3 className="mt-4 text-xl font-medium" style={display}>{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
                {item.emphasis && <span className="mt-6 inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">$0 during beta</span>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-reveal className="bg-white px-5 py-24" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Common questions</p>
            <h2 className="text-[40px] font-medium tracking-tight" style={display}>A few things to <span className="text-primary">know.</span></h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((item, index) => (
              <div key={item.question} className="py-5">
                <button type="button" aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq((current) => current === index ? null : index)} className="flex w-full items-center justify-between gap-4 text-left font-semibold text-foreground"><span>{item.question}</span><ChevronDown size={18} className={`shrink-0 text-primary ${openFaq === index ? "fs-faq-chevron-open" : "transition-transform duration-300"}`} /></button>
                <div id={`faq-answer-${index}`} aria-hidden={openFaq !== index} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden"><p className="text-sm text-muted-foreground leading-relaxed pt-3 pr-10">{item.answer}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        data-reveal
        className="py-20 px-5 relative overflow-hidden"
        style={{ background: "radial-gradient(circle at 34% 28%, rgba(138,181,226,0.18), transparent 34%), radial-gradient(circle at 66% 52%, rgba(201,99,59,0.10), transparent 38%), #FFFFFF" }}
        onPointerMove={moveCursorGlow}
        onPointerLeave={hideCursorGlow}
      >
        <div data-cursor-glow className="pointer-events-none absolute left-0 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(201,99,59,0.18),rgba(201,99,59,0.05)_42%,transparent_72%)] opacity-0 blur-2xl transition-[transform,opacity] duration-150 ease-out" />
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative bg-card border border-border rounded-3xl px-8 py-14">
              <div className="mx-auto mb-8 max-w-sm rounded-2xl border border-dashed border-primary/25 bg-[#F2F6FC] p-4 text-left">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm"><BarChart3 size={16} /></span><div><p className="text-xs font-medium">Your first forecast starts here.</p><p className="mt-0.5 text-[10px] text-muted-foreground">Add a balance, income, and upcoming bills.</p></div></div>
                <div className="mt-4 flex h-12 items-end gap-1.5" aria-hidden="true">{[28, 35, 31, 42, 38, 50, 46, 58, 53].map((height, index) => <span key={height + index} className="flex-1 rounded-t-sm border border-dashed border-primary/25 bg-white" style={{ height: `${height}%` }} />)}</div>
              </div>
              <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-5" style={mono}>Early Access</p>
              <h2 className="text-[40px] font-medium tracking-tight leading-[1.1] mb-4" style={display}>Stop <span className="text-muted-foreground">guessing.</span><br />Start <span className="text-primary">knowing.</span></h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm">Join the beta and be among the first to see exactly where your money is going — before it gets there.</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1.5 text-xs text-muted-foreground mb-6"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Private beta · shaped with early-user feedback</div>
              {isSignedIn ? (
                <Magnetic><button type="button" onClick={() => navigate("/app/dashboard")} className="fs-brand-action px-6 py-3 rounded-xl text-sm font-medium">Open dashboard</button></Magnetic>
              ) : submitted ? (
                <div className="flex flex-col items-center gap-3 py-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500" aria-live="polite">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--fs-green-bg))] motion-safe:animate-[fs-transfer-linking_650ms_ease-out_both]"><CheckCircle size={22} className="text-[hsl(var(--fs-green))]" /></div>
                  <p className="text-foreground font-semibold">You&apos;re on the list!</p>
                  <p className="text-sm text-muted-foreground">We&apos;ll reach out when your spot opens up.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
                  <div className="relative flex-1"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required aria-invalid={email.length > 0 && !emailLooksValid}
                    className="w-full bg-muted border border-border rounded-xl py-3 pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />{emailLooksValid && <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--fs-green))] motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-200" aria-label="Email address looks valid" />}</div>
                  <Magnetic className="w-full sm:w-auto"><button type="submit" className="fs-brand-action w-full px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap">Join Beta</button></Magnetic>
                </form>
              )}
              <p className="text-xs text-muted-foreground mt-5">Early access. No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => navigate("/")}>
                <TrendingUp size={20} strokeWidth={2.2} className="text-[#111111]" />
                <span className="font-medium text-sm text-[#111111]" style={display}>FlowSight</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[170px]">Know what&apos;s next for your money.</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Product</p>
              <div className="space-y-2.5">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <Link href="/learn" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Learn</Link>
                <a href="#security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
                <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Company</p>
              <div className="space-y-2.5">
                {["About", "Contact"].map((t) => (
                  <a key={t} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Legal</p>
              <div className="space-y-2.5">
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FlowSight, Inc. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Designed for clarity. Built for trust.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
