"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import {
  Shield, TrendingUp, Bell, ArrowRight, Lock,
  Code, Briefcase, AtSign, BarChart3,
  X, Menu, Sparkles, CheckCircle,
} from "lucide-react";

const display: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };
const SCENARIO_MOTION_MS = 600;
const SCENARIO_MARKER_MS = 140;
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
    className={`inline-flex rounded-xl transition-[transform,filter] duration-200 ease-out hover:drop-shadow-[0_8px_14px_rgba(212,117,74,0.20)] ${className}`}
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

function IncomePattern({ kind, active }: { kind: "salary" | "freelance" | "mixed"; active: boolean }) {
  const regularBars = [28, 88, 148, 208];
  const variableBars = [{ x: 20, y: 57, h: 29, rangeY: 45 }, { x: 75, y: 30, h: 56, rangeY: 17 }, { x: 150, y: 49, h: 37, rangeY: 36 }, { x: 218, y: 22, h: 64, rangeY: 10 }];
  return <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/45 to-background p-3 mb-5 overflow-hidden" aria-hidden="true"><svg viewBox="0 0 260 112" className="w-full h-[112px]">
    <line x1="12" y1="88" x2="248" y2="88" stroke="hsl(var(--border))" strokeWidth="1.5" />
    {[28, 88, 148, 208].map((x) => <line key={x} x1={x + 8} y1="88" x2={x + 8} y2="94" stroke="hsl(var(--muted-foreground))" opacity=".35" />)}
    {kind === "salary" && regularBars.map((x, index) => <g key={`${x}-${active}`} className={active ? "fs-income-arrival" : ""} style={{ animationDelay: `${index * 90}ms` }}><rect x={x} y="42" width="17" height="46" rx="5" fill="#2D8B5A" opacity={index === 3 ? 1 : .78} /><circle cx={x + 8.5} cy="35" r="2.5" fill="#2D8B5A" opacity=".45" /></g>)}
    {kind === "freelance" && variableBars.map((bar, index) => <g key={`${bar.x}-${active}`}><rect x={bar.x} y={bar.rangeY} width="18" height={88 - bar.rangeY} rx="5" fill="none" stroke="#D4754A" strokeWidth="1.5" strokeDasharray="4 3" opacity=".65" className={active ? "fs-income-range" : ""} style={{ animationDelay: `${index * 110}ms` }} /><rect x={bar.x + 3} y={bar.y} width="12" height={bar.h} rx="4" fill="#D4754A" opacity={index === 3 ? 1 : .76} className={active ? "fs-income-arrival" : ""} style={{ animationDelay: `${120 + index * 110}ms` }} /></g>)}
    {kind === "mixed" && <>{[24, 88, 152, 216].map((x, index) => <rect key={`salary-${x}-${active}`} x={x} y="43" width="13" height="45" rx="4" fill="#2D8B5A" opacity=".82" className={active ? "fs-income-arrival" : ""} style={{ animationDelay: `${index * 100}ms` }} />)}{[{ x: 51, y: 61, h: 27 }, { x: 121, y: 29, h: 59 }, { x: 187, y: 52, h: 36 }].map((bar, index) => <g key={`variable-${bar.x}-${active}`}>{index === 1 && <rect x={bar.x - 3} y="17" width="19" height="71" rx="5" fill="none" stroke="#D4754A" strokeWidth="1.5" strokeDasharray="4 3" opacity=".65" className={active ? "fs-income-range" : ""} style={{ animationDelay: "180ms" }} />}<rect x={bar.x} y={bar.y} width="13" height={bar.h} rx="4" fill="#D4754A" className={active ? "fs-income-arrival" : ""} style={{ animationDelay: `${50 + index * 145}ms` }} /></g>)}</>}
    <text x="12" y="107" fill="hsl(var(--muted-foreground))" fontSize="8">TODAY</text><text x="225" y="107" fill="hsl(var(--muted-foreground))" fontSize="8">30 DAYS</text>
  </svg></div>;
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
      setPhase(4);
      return;
    }
    setPhase(0);
    const timers = [700, 1450, 2200, 3000].map((delay, index) => window.setTimeout(() => setPhase(index + 1), delay));
    return () => timers.forEach(window.clearTimeout);
  }, [entered, run]);

  const eventPhase = Math.min(phase, 3);
  const balance = ahaBuildSteps[eventPhase].amount;
  const fullPath = ahaBuildSteps.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const areaPath = `${fullPath} L548,138 L28,138 Z`;

  return (
    <div ref={rootRef} className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="relative overflow-hidden rounded-[30px] border border-[#E7DDD1] bg-[#FFFDFC] p-5 shadow-[0_28px_80px_rgba(28,28,34,0.10)] sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs text-muted-foreground">Example forecast</p><p className="font-medium">Today → August 3</p></div>
          <span className="rounded-full bg-[hsl(var(--fs-amber-bg))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--fs-amber))]">{phase === 4 ? "Watch · Aug 3" : "Building forecast"}</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-[150px_1fr] sm:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground" style={mono}>Projected balance</p>
            <p className="mt-2 text-[38px] font-medium leading-none text-foreground" style={mono}><CountUp value={balance} prefix="$" duration={600} /></p>
            <p className="mt-2 min-h-5 text-xs text-muted-foreground">{eventPhase === 0 ? "Before upcoming bills" : `After ${ahaBuildSteps[eventPhase].label.toLowerCase()}`}</p>
          </div>
          <svg viewBox="0 0 576 154" className="h-[190px] w-full" role="img" aria-label="Projected balance falling as rent, insurance, and the car payment arrive">
            {[38, 76, 114].map((y) => <line key={y} x1="20" y1={y} x2="558" y2={y} stroke="#E7DDD1" strokeWidth="1" opacity=".7" />)}
            <line x1="20" y1="116" x2="558" y2="116" stroke="#B7791F" strokeDasharray="6 5" opacity=".75" />
            <text x="22" y="108" fill="#B7791F" fontSize="10">$500 safety buffer</text>
            <path d={areaPath} fill="#C96B43" className={`transition-opacity duration-500 ${eventPhase === 3 ? "opacity-[0.08]" : "opacity-0"}`} />
            <path d={fullPath} fill="none" stroke="#C96B43" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - eventPhase / 3} className="transition-[stroke-dashoffset] duration-700 ease-out" />
            {ahaBuildSteps.map((step, index) => <g key={step.label} className={`transition-[opacity,transform] duration-300 ${index <= eventPhase ? "opacity-100" : "translate-y-1 opacity-0"}`}><line x1={step.x} y1={step.y + 7} x2={step.x} y2="138" stroke="#C96B43" strokeDasharray="3 3" opacity=".42" /><circle cx={step.x} cy={step.y} r={index === eventPhase ? 7 : 5} fill={index === 0 ? "#111827" : "#C96B43"} stroke="#FFFDFC" strokeWidth="2" /></g>)}
          </svg>
        </div>
        <div className="mt-2 grid min-h-[80px] gap-2 sm:grid-cols-3">
          {ahaBuildSteps.slice(1).map((step, index) => <div key={step.label} className={`rounded-xl border p-3 transition-all duration-300 ${index + 1 <= eventPhase ? "translate-y-0 border-[#E7DDD1] bg-white opacity-100" : "translate-y-2 border-transparent bg-transparent opacity-0"}`}><div className="flex justify-between gap-2 text-xs"><span className="font-medium">{step.label}</span><span style={mono}>{step.delta}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{step.date} · confirmed</p></div>)}
        </div>
      </div>
      <div className="flex min-h-[330px] flex-col justify-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Five days of warning</p>
        <h2 className="text-[40px] font-medium leading-[1.06] tracking-tight lg:text-[48px]" style={display}>
          See the tight day<br />before it arrives.
        </h2>
        <p className={`mt-5 text-[22px] leading-snug transition-all duration-500 ${phase === 4 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-35"}`}><strong style={mono}>$420 on August 3.</strong><br /><span className="text-[hsl(var(--fs-amber))]">Five days before payday.</span></p>
        <p className="mt-5 text-muted-foreground leading-relaxed">FlowSight combines the timing of your balance, income, and upcoming commitments—then shows exactly what creates the low point.</p>
        <button type="button" onClick={() => setRun((current) => current + 1)} className="mt-6 w-fit text-sm font-medium text-primary hover:text-[hsl(var(--fs-primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25">↻ Replay forecast</button>
        <span className="sr-only" aria-live="polite">{phase === 4 ? "Projected balance is 420 dollars on August 3, five days before payday." : ""}</span>
      </div>
    </div>
  );
}

const flowsightLandingTheme = {
  "--background": "0 0% 100%",
  "--foreground": "220 59% 14%",
  "--card": "0 0% 100%",
  "--card-foreground": "220 59% 14%",
  "--primary": "18 61% 56%",
  "--primary-foreground": "220 59% 14%",
  "--secondary": "42 42% 95%",
  "--secondary-foreground": "220 59% 14%",
  "--muted": "42 42% 95%",
  "--muted-foreground": "220 9% 46%",
  "--accent": "18 61% 56%",
  "--accent-foreground": "220 59% 14%",
  "--destructive": "350 45% 49%",
  "--border": "220 18% 90%",
  "--input": "220 18% 90%",
  "--ring": "18 61% 56%",
  "--fs-tint": "#FBF7F1",
  "--fs-tint-soft": "#FDFBF8",
  backgroundImage: "radial-gradient(circle at 86% 8%, rgba(212,117,74,0.07), transparent 26%), linear-gradient(145deg, #ffffff 0%, #ffffff 55%, #fdfbf8 100%)",
  backgroundAttachment: "fixed",
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

const generateScenarioData = (amount: number) => [
  { day: "Jul 21", balance: 4240, projected: null },
  { day: "Jul 23", balance: 3720, projected: null },
  { day: "Jul 25", balance: 6790, projected: null },
  { day: "Jul 27", balance: 6320, projected: null },
  { day: "Jul 29", balance: 5940, projected: null },
  { day: "Jul 31", balance: 5500, baseline: 5500, projected: 5500 },
  { day: "Aug 2", balance: null, baseline: 5240, projected: 5240 - amount },
  { day: "Aug 4", balance: null, baseline: 4980, projected: 4980 - amount },
  { day: "Aug 7", balance: null, baseline: 3340, projected: 3340 - amount },
  { day: "Aug 11", balance: null, baseline: 8180, projected: 8180 - amount },
  { day: "Aug 15", balance: null, baseline: 7440, projected: 7440 - amount },
  { day: "Aug 20", balance: null, baseline: 6900, projected: 6900 - amount },
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
  const [paused, setPaused] = useState(false);
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
    if (!visible || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => onStoryChange((activeStory + 1) % ahaStories.length), AHA_MOTION.cycleMs);
    return () => window.clearInterval(timer);
  }, [activeStory, onStoryChange, paused, visible]);

  useEffect(() => {
    const target = story.balances;
    const from = animatedBalancesRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animatedBalancesRef.current = target;
      setAnimatedBalances(target);
      return;
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

  return <div ref={rootRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    <div className="relative flex flex-wrap items-center justify-between gap-3 mb-4"><div><p className="text-xs text-muted-foreground">Example forecast</p><p className="font-medium">Today → next 30 days</p></div><AhaConditionBadge activeStory={activeStory} /></div>
    <div className="relative h-[190px]" aria-label={`${story.label} example forecast`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" role="img">
        <defs><linearGradient id="storyArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C96B43" stopOpacity=".18" /><stop offset="100%" stopColor="#C96B43" stopOpacity=".01" /></linearGradient></defs>
        {[.25, .5, .75].map((position) => <line key={position} x1="0" y1={top + (height - top - bottom) * position} x2={width} y2={top + (height - top - bottom) * position} stroke="#E7DDD1" strokeWidth="1" opacity=".55" />)}
        <path d={areaPath} fill="url(#storyArea)" className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`} />
        <line x1="0" y1={top} x2="0" y2={height - bottom} stroke="#6B7280" strokeDasharray="4 4" opacity=".55" /><text x="7" y="14" fill="#6B7280" fontSize="10">Today</text>
        <line x1="0" y1={bufferY} x2={width} y2={bufferY} stroke="#CA8A04" strokeDasharray="6 5" opacity=".8" /><text x="6" y={bufferY - 7} fill="#CA8A04" fontSize="10">$500 safety buffer</text>
        <path d={linePath} fill="none" stroke="#C96B43" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={visible ? 0 : 1} className="transition-[stroke-dashoffset] duration-1000 ease-out" />
        {eventPoints.map((event, index) => <g key={event.label}><line x1={event.x} y1={event.y + 7} x2={event.x} y2={height - bottom} stroke={event.amount.startsWith("+") ? "#2D7A55" : "#C96B43"} strokeWidth="1.25" strokeDasharray="3 3" opacity=".48" /><circle cx={event.x} cy={event.y} r="7" fill={event.amount.startsWith("+") ? "#2D7A55" : "#C96B43"} stroke="#FFFDFC" strokeWidth="2" /><text x={event.x} y={event.y + 2.7} fill="white" fontSize="7.5" fontWeight="600" textAnchor="middle">{index + 1}</text></g>)}
        <circle cx={lowPoint.x} cy={lowPoint.y} r="5" fill="#B7791F" stroke="white" strokeWidth="2.5" className={visible ? "fs-low-pulse" : "opacity-0"} />
        {points.map((point, index) => <circle key={point.date} cx={point.x} cy={point.y} r="10" fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} tabIndex={0} onFocus={() => setHoveredIndex(index)} onBlur={() => setHoveredIndex(null)} aria-label={`${point.date}: $${point.balance.toLocaleString()} projected balance`} />)}
      </svg>
      {hovered && <div className="pointer-events-none absolute z-10 rounded-xl border border-[#E7DDD1] bg-[#FFFDFC] px-3 py-2 text-xs shadow-lg" style={{ left: `${Math.min(88, Math.max(4, hovered.x / width * 100))}%`, top: `${Math.max(2, hovered.y / height * 100 - 14)}%`, transform: "translateX(-50%)" }}><p className="text-[#73766F]">{hovered.date}</p><p className="font-medium text-[#111827] mt-0.5" style={mono}>${hovered.balance.toLocaleString()}</p>{hoveredIndex === lowIndex && <p className="mt-1 text-[hsl(var(--fs-amber))]">Lowest projected point</p>}</div>}
    </div>
    <div key={`events-${activeStory}`} className="relative grid min-h-[76px] sm:grid-cols-3 gap-2 mt-3">{story.events.map((event, index) => <button type="button" key={event.label} onClick={() => setHoveredIndex(event.point)} className={`rounded-xl border bg-white p-3 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 ${story.kind === "irregular" && index > 0 ? "border-dashed border-[hsl(var(--fs-amber))]/35" : "border-[#E7DDD1]"}`} style={{ animationDelay: `${index * AHA_MOTION.chipStaggerMs}ms`, animationDuration: `${AHA_MOTION.copyMs}ms`, animationFillMode: "both" }}><div className="flex items-center gap-2 text-xs"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ${event.amount.startsWith("+") ? "bg-[hsl(var(--fs-green))]" : "bg-primary"}`}>{index + 1}</span><span className="min-w-0 flex-1 truncate font-medium">{event.label}</span><span style={mono}>{event.amount}</span></div><p className="pl-7 text-[10px] text-muted-foreground mt-1">{event.date} · {story.kind === "irregular" && index > 0 ? "estimated" : "confirmed"}</p></button>)}</div>
    <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Example forecast stories">{ahaStories.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={activeStory === index} onClick={() => onStoryChange(index)} className={`h-2 rounded-full transition-[width,background-color] duration-300 ${activeStory === index ? "w-8 bg-primary" : "w-3 bg-border hover:bg-muted-foreground/50"}`} aria-label={`Show ${item.label}`} />)}<span className="ml-1 text-[10px] text-muted-foreground">{paused ? "Paused" : story.label}</span></div>
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

export default function Landing() {
  const router = useRouter();
  const navigate = router.push;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [showWork, setShowWork] = useState(false);
  const [comparisonFocus, setComparisonFocus] = useState<"past" | "future">("past");
  const [productTab, setProductTab] = useState<"forecast" | "scenario" | "recurring" | "transfers">("forecast");
  const [heroReady, setHeroReady] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sectionVisibility = useRef(new Map<string, number>());
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const heroMockupRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHeroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const updateHeroDepth = () => {
      frame = 0;
      const section = heroSectionRef.current;
      if (!section) return;
      const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / Math.min(520, section.offsetHeight * 0.72)));
      if (heroCopyRef.current) {
        heroCopyRef.current.style.transform = `translate3d(0, ${-18 * progress}px, 0) scale(${1 - 0.018 * progress})`;
        heroCopyRef.current.style.opacity = String(1 - 0.16 * progress);
      }
      if (heroMockupRef.current) heroMockupRef.current.style.transform = `translate3d(0, ${-28 * progress}px, 0) scale(${1 + 0.028 * progress})`;
      if (heroGlowRef.current) heroGlowRef.current.style.opacity = String(0.22 + 0.58 * progress);
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHeroDepth);
    };
    updateHeroDepth();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
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

  const scenarioData = generateScenarioData(scenarios[scenario].amount);
  const projectedBalances = scenarioData.flatMap((point) => typeof point.projected === "number" ? [point.projected] : []);
  const endBalance = projectedBalances.at(-1) ?? 0;
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

      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-2xl border-b border-border" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <TrendingUp size={22} strokeWidth={2.2} className="text-[#111111]" />
            <span className="font-medium text-[#111111] text-sm tracking-tight" style={display}>FlowSight</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {["Features", "Security", "FAQ"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} aria-current={activeSection === l.toLowerCase().replace(/\s+/g, "-") ? "location" : undefined} className={`relative py-2 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-primary after:transition-transform after:duration-300 ${activeSection === l.toLowerCase().replace(/\s+/g, "-") ? "font-medium text-foreground after:scale-x-100" : "text-muted-foreground hover:text-foreground after:scale-x-0"}`}>{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/sign-in")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Sign in</button>
            <Magnetic><button onClick={() => navigate("/sign-up")} className="fs-brand-action text-sm px-4 py-2 rounded-xl font-medium">Join Beta</button></Magnetic>
          </div>
          <button className="md:hidden text-muted-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border px-5 py-5 flex flex-col gap-4">
            {["Features", "Security", "FAQ"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>{l}</a>
            ))}
            <button onClick={() => navigate("/sign-up")} className="fs-brand-action text-sm px-4 py-2.5 rounded-xl font-medium">Join Beta</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroSectionRef} className="relative overflow-hidden pt-28 pb-20 px-5">
        <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-14 items-center">
          <div ref={heroCopyRef} className="will-change-transform">
            <div className={`inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-8 transition-all duration-500 motion-reduce:transition-none ${heroReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
              <Sparkles size={10} />Now in private beta
            </div>
            <h1 className={`text-[52px] lg:text-[64px] font-medium leading-[1.05] tracking-tight text-foreground mb-6 transition-all duration-500 delay-75 motion-reduce:transition-none ${heroReady ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={display}>
              See what&apos;s next<br /><span className="bg-gradient-to-r from-foreground via-slate-700 to-primary bg-clip-text text-transparent">for your money.</span>
            </h1>
            <p className={`text-[17px] text-muted-foreground leading-relaxed mb-10 max-w-[440px] transition-all duration-500 delay-150 motion-reduce:transition-none ${heroReady ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              Most finance apps tell you where your money went. FlowSight shows where it&apos;s going. Import a CSV or add a few details—and see how the next 30 days could unfold.
            </p>
            <div className={`flex flex-col sm:flex-row gap-3 mb-12 transition-all duration-500 motion-reduce:transition-none ${heroReady ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={{ transitionDelay: "225ms" }}>
              <Magnetic className="w-full sm:w-auto"><button onClick={() => navigate("/sign-up")} className="fs-brand-action flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm">
                Join the Beta <ArrowRight size={15} />
              </button></Magnetic>
              <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="fs-interactive flex items-center justify-center gap-2 text-muted-foreground border border-border px-6 py-3 rounded-xl font-medium text-sm hover:text-foreground">
                Watch Demo
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {["No bank connection required", "Your numbers, clearly explained", "No budgets to maintain"].map((t, index) => (
                <div key={t} className="flex items-center gap-2.5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500" style={{ animationDelay: `${250 + index * 180}ms`, animationFillMode: "both" }}>
                  <CheckCircle size={14} className="text-accent shrink-0" />
                  <span className="text-sm text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* App window mockup */}
          <div ref={heroMockupRef} className="relative will-change-transform">
          <div className={`relative transition-all duration-700 delay-300 motion-reduce:transition-none ${heroReady ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
            <div ref={heroGlowRef} className="absolute -inset-8 bg-primary/12 rounded-3xl blur-3xl pointer-events-none will-change-[opacity]" />
            <div className="relative bg-card border border-border rounded-[20px] overflow-hidden shadow-[0_32px_80px_rgba(28,28,34,0.12)]">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="mx-auto text-[10px] text-muted-foreground" style={mono}>FlowSight — Chase Checking ••4821</span>
              </div>
              <div className="px-5 pt-4 pb-3.5 flex items-start justify-between border-b border-border/50">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1" style={mono}>Current Balance</p>
                  <p className="text-[28px] font-medium leading-none text-foreground" style={mono}><CountUp value={5500} prefix="$" /><span className="text-sm font-normal text-muted-foreground">.00</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground mb-2">What this forecast knows</p>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="h-1.5 w-[72px] bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#2D8B5A]" style={{ width: "82%" }} />
                    </div>
                    <span className="text-sm font-semibold text-[#2D8B5A]">Looking good</span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-5 grid sm:grid-cols-[0.92fr_1.08fr] gap-4">
                <div className="rounded-2xl bg-primary/[0.06] border border-primary/10 p-4 flex flex-col justify-between min-h-[145px] overflow-hidden">
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground" style={mono}>Safe to spend</p><p className="text-[38px] font-medium leading-none mt-3 text-foreground" style={mono}>$680</p></div>
                  <p className="text-[11px] text-muted-foreground">after upcoming bills and your buffer</p>
                </div>
                <div className="space-y-2">
                  {[{ label: "Rent", timing: "in 11 days", amount: "−$1,650", tone: "bg-primary" }, { label: "Paycheck", timing: "in 16 days", amount: "+$2,400", tone: "bg-[#2D8B5A]" }, { label: "Electricity", timing: "Aug 18 · estimated", amount: "~−$117", tone: "bg-[#CA8A04]" }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"><span className={`h-2 w-2 rounded-full ${item.tone}`} /><div className="min-w-0 flex-1"><p className="text-xs font-medium">{item.label}</p><p className="text-[10px] text-muted-foreground">{item.timing}</p></div><span className="text-xs font-medium" style={mono}>{item.amount}</span></div>)}
                </div>
              </div>
              <div className="px-5 pb-4 pt-1 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 py-1.5 flex-1 min-w-0">
                  <Bell size={10} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">Rent due in <span className="text-foreground font-medium">15 days</span> — $1,650</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Outlook</p>
                  <p className="font-semibold text-[#2D8B5A]">Clear through Aug 1</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        </div>
      </section>

      {/* AHA FORECAST */}
      <section data-reveal className="relative overflow-hidden border-y border-[#E7DDD1]/70 bg-[#FFFDFC] px-5 py-24">
        <div className="relative z-10 max-w-6xl mx-auto"><CausalAhaForecast /></div>
      </section>

      {/* PRODUCT DESTINATIONS */}
      <section data-reveal className="bg-white px-5 py-24" id="features">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Inside FlowSight</p>
            <h2 className="text-[40px] font-medium leading-[1.08] tracking-tight lg:text-[48px]" style={display}>Here&apos;s what FlowSight actually sees.</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">Four connected views turn your activity into a forecast you can understand and act on.</p>
          </div>
          <div className="-mx-1 mb-5 overflow-x-auto px-1">
            <div className="flex min-w-max gap-2 rounded-2xl border border-border bg-[var(--fs-tint-soft)] p-1.5" role="tablist" aria-label="FlowSight product views">
              {(["forecast", "scenario", "recurring", "transfers"] as const).map((tab) => <button key={tab} role="tab" aria-selected={productTab === tab} onClick={() => setProductTab(tab)} className={`rounded-xl px-5 py-2.5 text-sm font-medium capitalize transition-all ${productTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab === "scenario" ? "Scenario Planner" : tab}</button>)}
            </div>
          </div>
          <div className="min-h-[520px] overflow-hidden rounded-[28px] border border-border bg-[var(--fs-tint-soft)] p-4 sm:p-7">
            <div key={productTab} className="grid min-h-[464px] gap-8 rounded-3xl border border-border bg-white p-5 shadow-[0_20px_60px_rgba(28,28,34,0.08)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 sm:p-7 lg:grid-cols-[0.36fr_0.64fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-primary" style={mono}>{productTab === "scenario" ? "Scenario Planner" : productTab}</p>
                <h3 className="mt-3 text-[30px] font-medium leading-tight" style={display}>{productTab === "forecast" ? "Know where the month is headed." : productTab === "scenario" ? "Test a decision before making it." : productTab === "recurring" ? "Review what happens again." : "Move money without counting it twice."}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{productTab === "forecast" ? "Whether income is a steady paycheck, a variable invoice, or both, FlowSight tells confirmed activity apart from estimates." : productTab === "scenario" ? "Compare the next 30 days with and without a purchase. Nothing changes permanently until you choose to save it." : productTab === "recurring" ? "FlowSight detects patterns, preserves the evidence behind estimates, and waits for your confirmation before adding them." : "Purchases explain what you spent. The card payment is when cash actually leaves your account."}</p>
              </div>
              <div>
                {productTab === "forecast" && <StepIllustration step={2} />}
                {productTab === "recurring" && <StepIllustration step={1} />}
                {productTab === "transfers" && <div className="rounded-2xl border border-border bg-white p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.15em] text-primary">Likely transfer</p><h4 className="mt-1 font-medium">Between your accounts</h4></div><span className="rounded-full bg-[hsl(var(--fs-green-bg))] px-2.5 py-1 text-[10px] text-[hsl(var(--fs-green))]">Strong match</span></div><div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Everyday checking · Jul 12</p><p className="mt-2 text-sm font-medium">Payment to Card ••4821</p><p className="mt-3 text-lg" style={mono}>−$1,200</p></div><div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">↔</div><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Card ••4821 · Jul 13</p><p className="mt-2 text-sm font-medium">Payment received</p><p className="mt-3 text-lg text-muted-foreground" style={mono}>+$1,200</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button className="fs-brand-action rounded-lg px-3 py-2 text-xs font-medium">Yes, link</button><button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">Not a transfer</button></div></div>}
                {productTab === "scenario" && <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{scenarios.map((item, index) => <button key={item.label} onClick={() => setScenario(index)} className={`rounded-lg border px-2.5 py-2 text-left text-[11px] transition-colors ${scenario === index ? "border-primary/40 bg-primary/[0.08] text-foreground" : "border-border text-muted-foreground"}`}>{item.label.replace(/\s*\([^)]*\)$/, "")}</button>)}</div><div className="flex items-center justify-between"><p className="text-sm font-medium">30-day forecast</p><span className={`rounded-full px-2.5 py-1 text-[10px] ${scenarioCondition.className}`}>{scenarioCondition.label}</span></div><ResponsiveContainer width="100%" height={210}><AreaChart data={scenarioData} margin={{ top: 14, right: 8, left: -18, bottom: 0 }}><XAxis dataKey="day" tick={{ fontSize: 9, fill: "#73766F" }} tickLine={false} axisLine={false} interval={2} /><YAxis tick={{ fontSize: 9, fill: "#73766F" }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} /><ReferenceLine y={500} stroke="#B7791F" strokeDasharray="5 4" /><Area type="monotone" dataKey="baseline" stroke="#9CA3AF" strokeDasharray="5 5" fill="transparent" dot={false} /><Area type="monotone" dataKey="projected" stroke="#C96B43" strokeWidth={3} fill="#C96B4314" dot={false} animationDuration={SCENARIO_MOTION_MS} /></AreaChart></ResponsiveContainer><div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">{[{ label: "Today", value: 5500 }, { label: "End", value: endBalance }, { label: "Safe", value: safeToSpend }].map((item) => <div key={item.label}><p className="text-[10px] text-muted-foreground">{item.label}</p><p className="mt-1 text-sm font-medium" style={mono}>${item.value.toLocaleString()}</p></div>)}</div></div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENGINE QUALITIES */}
      <section data-reveal className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center"><p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary" style={mono}>Quietly working underneath</p><h2 className="text-[40px] font-medium tracking-tight lg:text-[48px]" style={display}>Know what&apos;s coming, automatically.</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div tabIndex={0} className="group rounded-3xl border border-border bg-white p-6 transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:bg-[#FFFDFC] hover:shadow-[0_20px_55px_rgba(28,28,34,0.09)] focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"><h3 className="text-xl font-medium transition-colors group-hover:text-primary group-focus-visible:text-primary" style={display}>Confirmed vs. estimated, always labeled.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Known activity stays distinct from what FlowSight is still estimating.</p><div className="mt-8 flex flex-wrap gap-3 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1"><span className="rounded-full bg-[hsl(var(--fs-green-bg))] px-3 py-2 text-xs font-medium text-[hsl(var(--fs-green))] transition-shadow group-hover:shadow-sm">Confirmed · Payroll +$1,950</span><span className="rounded-full border border-dashed border-[hsl(var(--fs-amber))]/50 bg-[hsl(var(--fs-amber-bg))] px-3 py-2 text-xs font-medium text-[hsl(var(--fs-amber))] transition-shadow group-hover:shadow-sm">Estimated · Electricity ~−$117</span></div></div>
            <div tabIndex={0} className="group rounded-3xl border border-border bg-white p-6 transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:bg-[#FFFDFC] hover:shadow-[0_20px_55px_rgba(28,28,34,0.09)] focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"><h3 className="text-xl font-medium transition-colors group-hover:text-primary group-focus-visible:text-primary" style={display}>Built for how income actually arrives.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Regular paychecks and variable invoices can coexist without pretending they are equally certain.</p><div className="mt-5 transition-[transform,filter] duration-300 ease-out group-hover:-translate-y-1 group-hover:drop-shadow-[0_10px_18px_rgba(45,122,85,0.10)] group-focus-visible:-translate-y-1"><IncomePattern kind="mixed" active /></div></div>
            <div tabIndex={0} className="group rounded-3xl border border-border bg-white p-6 transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:bg-[#FFFDFC] hover:shadow-[0_20px_55px_rgba(28,28,34,0.09)] focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"><h3 className="text-xl font-medium transition-colors group-hover:text-primary group-focus-visible:text-primary" style={display}>Recurring, detected automatically.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Stable patterns can be confirmed; variable bills keep their evidence.</p><div className="mt-6 rounded-2xl border border-dashed border-[hsl(var(--fs-amber))]/40 bg-[hsl(var(--fs-amber-bg))]/50 p-4 transition-[transform,border-color,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:border-[hsl(var(--fs-amber))]/65 group-hover:shadow-sm group-focus-visible:-translate-y-1"><div className="flex justify-between gap-4"><div><p className="text-sm font-medium">National Grid Electric</p><p className="mt-1 text-xs text-muted-foreground">Estimated from 7 occurrences · $82.15–$142.30</p></div><span className="text-sm" style={mono}>~−$116.82</span></div></div></div>
            <div tabIndex={0} className="group overflow-hidden rounded-3xl border border-[#0C1628] bg-[#0C1628] p-6 text-white transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_22px_60px_rgba(12,22,40,0.24)] focus-visible:-translate-y-1 focus-visible:border-primary/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"><h3 className="text-xl font-medium transition-colors group-hover:text-[#F1B498] group-focus-visible:text-[#F1B498]" style={display}>Safe to Spend, explained.</h3><p className="mt-2 text-sm leading-relaxed text-white/55">The headline number stays connected to the balance, commitments, and buffer beneath it.</p><button onClick={() => setShowWork((open) => !open)} aria-expanded={showWork} className="mt-6 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition-[transform,background-color,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-white/20 group-hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"><div><p className="text-xs text-white/50">Safe to spend</p><p className="mt-1 text-2xl text-[#65B98A]" style={mono}>$680</p></div><span className="text-xs font-medium">{showWork ? "Hide work" : "Show your work"} {showWork ? "−" : "+"}</span></button><div className={`grid transition-all duration-300 ${showWork ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="space-y-2 px-2 pt-4 text-xs">{[["Opening balance", "$4,260"], ["Lowest projected balance", "$1,180"], ["Safety buffer", "−$500"]].map(([label, value]) => <div key={label} className="flex justify-between"><span className="text-white/50">{label}</span><span style={mono}>{value}</span></div>)}</div></div></div></div>
          </div>
          <button type="button" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="mx-auto mt-8 block text-sm font-medium text-primary hover:text-[hsl(var(--fs-primary-hover))]">Explore product views ↑</button>
        </div>
      </section>

      {/* CONTRAST */}
      <section
        data-reveal
        className="fs-warm-section-transition relative overflow-hidden py-24 px-5"
        onPointerMove={moveCursorGlow}
        onPointerLeave={hideCursorGlow}
      >
        <div data-cursor-glow className="pointer-events-none absolute left-0 top-0 z-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(201,107,67,0.12),rgba(201,107,67,0.035)_38%,transparent_70%)] opacity-0 blur-xl transition-[transform,opacity] duration-150 ease-out" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[42px] lg:text-[52px] font-medium tracking-tight leading-[1.08] mb-4" style={display}>
              Stop looking backward.<br /><span className="text-accent">Start planning forward.</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="mx-auto mb-5 flex w-fit rounded-full border border-border bg-white p-1 shadow-sm" role="tablist" aria-label="Compare finance apps"><button role="tab" aria-selected={comparisonFocus === "past"} onClick={() => setComparisonFocus("past")} className={`rounded-full px-5 py-2 text-sm ${comparisonFocus === "past" ? "bg-[#0F1D3A] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>Looking back</button><button role="tab" aria-selected={comparisonFocus === "future"} onClick={() => setComparisonFocus("future")} className={`rounded-full px-5 py-2 text-sm ${comparisonFocus === "future" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>Looking ahead</button></div>
            <div key={comparisonFocus} className="relative overflow-hidden rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-[0_2px_8px_rgba(15,29,58,0.06)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
              <div className={`absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl ${comparisonFocus === "future" ? "bg-primary/10" : "bg-[var(--fs-tint)]"}`} />
              <div className="relative flex items-center gap-3 mb-6"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${comparisonFocus === "future" ? "bg-primary text-primary-foreground" : "bg-[var(--fs-tint)] text-muted-foreground"}`}>{comparisonFocus === "future" ? <Sparkles size={17} /> : <BarChart3 size={17} />}</div><div><p className="text-xs text-muted-foreground">{comparisonFocus === "future" ? "FlowSight" : "Traditional finance apps"}</p><h3 className="font-medium text-lg">{comparisonFocus === "future" ? "Looking ahead" : "Looking back"}</h3></div></div>
              <p className="relative leading-relaxed mb-7 text-muted-foreground">{comparisonFocus === "future" ? "FlowSight shows what the next few weeks may hold—and what to do if money gets tight." : "Most tools organize what already happened. Useful for review, but they can't tell you if Friday will be tight."}</p>
              <div className="relative grid sm:grid-cols-3 gap-3">{(comparisonFocus === "future" ? ["Warns you before the tight day", "Labels confirmed and estimated events", '“$820 safe to spend until the 18th”'] : ["Reports money already spent", "Categories instead of timing", '“$200 spent on dining last month”']).map((item) => <div key={item} className={`rounded-xl border p-3 text-sm ${comparisonFocus === "future" ? "border-primary/30 bg-primary/[0.08] font-medium" : "border-border bg-[var(--fs-tint)] text-muted-foreground line-through decoration-muted-foreground/40"}`}>{item}</div>)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section data-reveal className="py-20 px-5 bg-white" id="security">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Security</p>
            <h2 className="text-[40px] font-medium tracking-tight mb-3" style={display}>Start without handing over your bank login.</h2>
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

      {/* FAQ */}
      <section data-reveal className="fs-warm-section-transition px-5 py-24" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Common questions</p>
            <h2 className="text-[40px] font-medium tracking-tight" style={display}>A few things to know.</h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((item, index) => (
              <div key={item.question} className="py-5">
                <button type="button" aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq((current) => current === index ? null : index)} className="flex w-full items-center justify-between gap-4 text-left font-semibold text-foreground"><span>{item.question}</span><span className={`text-primary text-xl font-normal transition-transform duration-300 ${openFaq === index ? "rotate-45" : ""}`}>+</span></button>
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
        style={{ background: "radial-gradient(circle at 50% 48%, rgba(212,117,74,0.10), transparent 38%)" }}
        onPointerMove={moveCursorGlow}
        onPointerLeave={hideCursorGlow}
      >
        <div data-cursor-glow className="pointer-events-none absolute left-0 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(212,117,74,0.18),rgba(212,117,74,0.05)_42%,transparent_72%)] opacity-0 blur-2xl transition-[transform,opacity] duration-150 ease-out" />
        <div className="relative z-10 max-w-xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative bg-card border border-border rounded-3xl px-8 py-14">
              <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-5" style={mono}>Early Access</p>
              <h2 className="text-[40px] font-medium tracking-tight leading-[1.1] mb-4" style={display}>Stop guessing.<br />Start knowing.</h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm">Join the beta and be among the first to see exactly where your money is going — before it gets there.</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1.5 text-xs text-muted-foreground mb-6"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Private beta · shaped with early-user feedback</div>
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center"><CheckCircle size={22} className="text-accent" /></div>
                  <p className="text-foreground font-semibold">You&apos;re on the list!</p>
                  <p className="text-sm text-muted-foreground">We&apos;ll reach out when your spot opens up.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
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
                {["Privacy", "Terms"].map((t) => <a key={t} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t}</a>)}
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
