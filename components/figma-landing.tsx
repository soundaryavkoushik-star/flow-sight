"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { calculateForecast, type ForecastInput } from "@/lib/forecast";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Shield, TrendingUp, Bell, ArrowRight, Lock,
  Code, Briefcase, AtSign, BarChart3,
  X, Menu, Sparkles, CheckCircle,
} from "lucide-react";

const display: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    const duration = reducedMotion ? 0 : 900;
    let frame = 0;
    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="tabular-nums" aria-label={`${prefix}${value.toLocaleString()}${suffix}`}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

function IncomePattern({ kind }: { kind: "salary" | "freelance" | "mixed" }) {
  const regularBars = [28, 88, 148, 208];
  const variableBars = [{ x: 20, y: 57, h: 29, rangeY: 45 }, { x: 75, y: 30, h: 56, rangeY: 17 }, { x: 150, y: 49, h: 37, rangeY: 36 }, { x: 218, y: 22, h: 64, rangeY: 10 }];
  return <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/45 to-background p-3 mb-5 overflow-hidden" aria-hidden="true"><svg viewBox="0 0 260 112" className="w-full h-[112px]">
    <line x1="12" y1="88" x2="248" y2="88" stroke="hsl(var(--border))" strokeWidth="1.5" />
    {[28, 88, 148, 208].map((x) => <line key={x} x1={x + 8} y1="88" x2={x + 8} y2="94" stroke="hsl(var(--muted-foreground))" opacity=".35" />)}
    {kind === "salary" && regularBars.map((x, index) => <g key={x} className="transition-all duration-300"><rect x={x} y="42" width="17" height="46" rx="5" fill="#2D8B5A" opacity={index === 3 ? 1 : .78} /><circle cx={x + 8.5} cy="35" r="2.5" fill="#2D8B5A" opacity=".45" /></g>)}
    {kind === "freelance" && variableBars.map((bar, index) => <g key={bar.x}><rect x={bar.x} y={bar.rangeY} width="18" height={88 - bar.rangeY} rx="5" fill="none" stroke="#D4754A" strokeWidth="1.5" strokeDasharray="4 3" opacity=".65" /><rect x={bar.x + 3} y={bar.y} width="12" height={bar.h} rx="4" fill="#D4754A" opacity={index === 3 ? 1 : .76} /></g>)}
    {kind === "mixed" && <>{[24, 88, 152, 216].map((x) => <rect key={`salary-${x}`} x={x} y="43" width="13" height="45" rx="4" fill="#2D8B5A" opacity=".82" />)}{[{ x: 51, y: 61, h: 27 }, { x: 121, y: 29, h: 59 }, { x: 187, y: 52, h: 36 }].map((bar, index) => <g key={`variable-${bar.x}`}>{index === 1 && <rect x={bar.x - 3} y="17" width="19" height="71" rx="5" fill="none" stroke="#D4754A" strokeWidth="1.5" strokeDasharray="4 3" opacity=".65" />}<rect x={bar.x} y={bar.y} width="13" height={bar.h} rx="4" fill="#D4754A" /></g>)}</>}
    <text x="12" y="107" fill="hsl(var(--muted-foreground))" fontSize="8">TODAY</text><text x="225" y="107" fill="hsl(var(--muted-foreground))" fontSize="8">30 DAYS</text>
  </svg></div>;
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
  backgroundImage: "linear-gradient(145deg, #ffffff 0%, #ffffff 52%, #f8f5ee 100%)",
  backgroundAttachment: "fixed",
} as React.CSSProperties;

const demoForecastInput: ForecastInput = {
  startingBalanceCents: 550_000,
  settings: { startDate: "2026-07-21", days: 30, safetyBufferCents: 50_000 },
  events: [
    ["groceries", "2026-07-23", -26_000, "Groceries"], ["utilities", "2026-07-25", -26_000, "Utilities"],
    ["loan", "2026-07-27", -22_000, "Loan payment"], ["weekly", "2026-07-29", -35_000, "Weekly spending"],
    ["rent", "2026-08-01", -165_000, "Rent"], ["card", "2026-08-01", -69_000, "Credit card"],
    ["insurance", "2026-08-03", -18_000, "Insurance"], ["car", "2026-08-03", -41_000, "Car payment"],
    ["annual", "2026-08-03", -106_000, "Annual bills"], ["paycheck", "2026-08-05", 240_000, "Paycheck"],
    ["spend-1", "2026-08-08", -28_000, "Everyday spending"], ["spend-2", "2026-08-11", -35_000, "Everyday spending"],
    ["spend-3", "2026-08-14", -31_000, "Everyday spending"], ["spend-4", "2026-08-17", -23_000, "Everyday spending"],
    ["spend-5", "2026-08-19", -17_000, "Everyday spending"],
  ].map(([id, date, amountCents, name]) => ({ id: String(id), date: String(date), amountCents: Number(amountCents), name: String(name), type: Number(amountCents) >= 0 ? "income" as const : "expense" as const, source: "manual" as const, confidence: "confirmed" as const })),
};

const demoForecast = calculateForecast(demoForecastInput);
const shortDate = (date: string) => {
  const [, month, day] = date.split("-");
  return `${month === "07" ? "Jul" : "Aug"} ${Number(day)}`;
};

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

const heroMoments = [
  { label: "Safe to spend", value: 680, prefix: "$", suffix: "", note: "after upcoming bills and your buffer", tone: "text-primary" },
  { label: "Lowest projected balance", value: 420, prefix: "$", suffix: "", note: "on August 3", tone: "text-[#CA8A04]" },
  { label: "Advance warning", value: 5, prefix: "", suffix: " days", note: "before your next paycheck", tone: "text-[#2D8B5A]" },
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

function ForecastStoryChart() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 600;
  const height = 230;
  const top = 18;
  const bottom = 26;
  const points = demoForecast.days.map((day, index) => ({
    x: (index / (demoForecast.days.length - 1)) * width,
    y: top + (1 - day.endingBalanceCents / 600_000) * (height - top - bottom),
    date: shortDate(day.date),
    balance: day.endingBalanceCents / 100,
  }));
  const lowIndex = demoForecast.days.findIndex((day) => day.date === demoForecast.lowestBalanceDate);
  const lowPoint = points[lowIndex];
  const beforeLowPath = points.slice(0, lowIndex + 1).map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const recoveryPath = points.slice(lowIndex).map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const areaPath = `${points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ")} L${width},${height - bottom} L0,${height - bottom} Z`;
  const bufferY = top + (1 - 500 / 6000) * (height - top - bottom);
  const hovered = hoveredIndex === null ? null : points[hoveredIndex];
  const events = [{ label: "Rent", date: "Aug 1", amount: "−$1,650" }, { label: "Insurance", date: "Aug 3", amount: "−$180" }, { label: "Car payment", date: "Aug 3", amount: "−$410" }];

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

  return <div ref={rootRef}>
    <div className="relative flex items-center justify-between mb-5"><div><p className="text-xs text-muted-foreground">Projected balance</p><p className="font-medium">Today → August 20</p></div><span className={`rounded-full bg-[#CA8A04]/10 px-3 py-1.5 text-xs font-medium text-[#CA8A04] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: visible ? "1300ms" : "0ms" }}>Watch · Aug 3</span></div>
    <div className="relative h-[250px]" aria-label="Projected balance from July 21 to August 20, with a low of $420 on August 3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" role="img">
        <defs><linearGradient id="storyArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D4754A" stopOpacity=".20" /><stop offset="100%" stopColor="#D4754A" stopOpacity=".01" /></linearGradient></defs>
        <path d={areaPath} fill="url(#storyArea)" className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: visible ? "1500ms" : "0ms" }} />
        <line x1="0" y1={top} x2="0" y2={height - bottom} stroke="#6B7280" strokeDasharray="4 4" opacity=".55" /><text x="7" y="14" fill="#6B7280" fontSize="10">Today</text>
        <line x1="0" y1={bufferY} x2={width} y2={bufferY} stroke="#CA8A04" strokeDasharray="6 5" opacity=".8" /><text x="6" y={bufferY - 7} fill="#CA8A04" fontSize="10">$500 safety buffer</text>
        <path d={beforeLowPath} fill="none" stroke="#D4754A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={visible ? 0 : 1} className="transition-[stroke-dashoffset] ease-out" style={{ transitionDuration: "1400ms" }} />
        <path d={recoveryPath} fill="none" stroke="#D4754A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={visible ? 0 : 1} className="transition-[stroke-dashoffset] ease-out" style={{ transitionDuration: "600ms", transitionDelay: visible ? "1800ms" : "0ms" }} />
        <circle cx={lowPoint.x} cy={lowPoint.y} r="6" fill="#CA8A04" stroke="white" strokeWidth="3" className={visible ? "fs-low-pulse" : "opacity-0"} />
        {points.map((point, index) => <circle key={point.date} cx={point.x} cy={point.y} r="10" fill="transparent" className="cursor-crosshair" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} tabIndex={0} onFocus={() => setHoveredIndex(index)} onBlur={() => setHoveredIndex(null)} aria-label={`${point.date}: $${point.balance.toLocaleString()} projected balance`} />)}
      </svg>
      {hovered && <div className="pointer-events-none absolute z-10 rounded-xl border border-[#E2E5EB] bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `${Math.min(88, Math.max(4, hovered.x / width * 100))}%`, top: `${Math.max(2, hovered.y / height * 100 - 18)}%`, transform: "translateX(-50%)" }}><p className="text-[#6B7280]">{hovered.date}</p><p className="font-medium text-[#0F1D3A] mt-0.5" style={mono}>${hovered.balance.toLocaleString()}</p>{hoveredIndex === lowIndex && <p className="mt-1 text-[#CA8A04]">Rent, insurance, car payment and other known bills</p>}</div>}
    </div>
    <div className="relative grid sm:grid-cols-3 gap-2 mt-3">{events.map((event, index) => <div key={event.label} className={`rounded-xl border border-[#E2E5EB] border-l-[3px] border-l-primary bg-white p-3 transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`} style={{ transitionDelay: `${2400 + index * 150}ms` }}><div className="flex justify-between gap-2 text-xs"><span className="font-medium">{event.label}</span><span style={mono}>{event.amount}</span></div><p className="text-[10px] text-muted-foreground mt-1">{event.date} · confirmed</p></div>)}</div>
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
  return <div className="min-h-[286px] rounded-2xl border border-[#E2E5EB] bg-white p-5"><div className="grid grid-cols-3 gap-2 mb-5"><div className="rounded-xl bg-[#F8F5EE] p-3"><p className="text-[10px] text-[#6B7280]">Safe to spend</p><p className="text-lg font-medium text-[#0F1D3A] mt-1" style={mono}>$680</p></div><div className="rounded-xl bg-[#F8F5EE] p-3"><p className="text-[10px] text-[#6B7280]">Projected low</p><p className="text-lg font-medium text-[#CA8A04] mt-1" style={mono}>$420</p></div><div className="rounded-xl bg-[#CA8A04]/10 p-3"><p className="text-[10px] text-[#6B7280]">Condition</p><p className="text-xs font-medium text-[#CA8A04] mt-2">Watch · Aug 3</p></div></div><div className="rounded-xl border border-[#E2E5EB] p-4"><div className="flex justify-between text-[10px] text-[#6B7280] mb-4"><span>30-day forecast</span><span>Jul 21 → Aug 20</span></div><div className="h-24 flex items-end gap-1.5">{[72, 67, 62, 56, 50, 35, 16, 43, 39, 34, 30, 27].map((height, index) => <span key={index} className={`flex-1 rounded-t ${index === 6 ? "bg-[#CA8A04]" : "bg-primary/70"}`} style={{ height: `${height}%` }} />)}</div><div className="border-t border-dashed border-[#CA8A04] mt-1 pt-2 text-[10px] text-[#CA8A04]">$500 safety buffer</div></div></div>;
}

export default function Landing() {
  const router = useRouter();
  const navigate = router.push;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [incomeType, setIncomeType] = useState<"salary" | "freelance" | "mixed">("mixed");
  const [showWork, setShowWork] = useState(false);
  const [comparisonFocus, setComparisonFocus] = useState<"past" | "future">("past");
  const [activeStep, setActiveStep] = useState(0);
  const [heroMoment, setHeroMoment] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stepsTimer = window.setInterval(() => setActiveStep((current) => (current + 1) % processSteps.length), 3200);
    return () => window.clearInterval(stepsTimer);
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
            {["Features", "How It Works", "Security"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/sign-in")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Sign in</button>
            <button onClick={() => navigate("/sign-up")} className="fs-brand-action text-sm px-4 py-2 rounded-xl font-medium">Join Beta</button>
          </div>
          <button className="md:hidden text-muted-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border px-5 py-5 flex flex-col gap-4">
            {["Features", "How It Works", "Security"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>{l}</a>
            ))}
            <button onClick={() => navigate("/sign-up")} className="fs-brand-action text-sm px-4 py-2.5 rounded-xl font-medium">Join Beta</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-20 px-5 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-8">
              <Sparkles size={10} />Now in private beta
            </div>
            <h1 className="text-[52px] lg:text-[64px] font-medium leading-[1.05] tracking-tight text-foreground mb-6" style={display}>
              See what&apos;s next<br /><span className="bg-gradient-to-r from-foreground via-slate-700 to-primary bg-clip-text text-transparent">for your money.</span>
            </h1>
            <p className="text-[17px] text-muted-foreground leading-relaxed mb-10 max-w-[440px]">
              Most finance apps tell you where your money went. FlowSight shows where it&apos;s going. Import a CSV or add a few details—and see how the next 30 days could unfold.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <button onClick={() => navigate("/sign-up")} className="fs-brand-action flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm">
                Join the Beta <ArrowRight size={15} />
              </button>
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
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/8 rounded-3xl blur-3xl pointer-events-none" />
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
                  <div key={heroMoment} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-300"><p className="text-[10px] uppercase tracking-widest text-muted-foreground" style={mono}>{heroMoments[heroMoment].label}</p><p className={`text-[38px] font-medium leading-none mt-3 ${heroMoments[heroMoment].tone}`} style={mono}><CountUp value={heroMoments[heroMoment].value} prefix={heroMoments[heroMoment].prefix} suffix={heroMoments[heroMoment].suffix} /></p></div>
                  <div><p key={`note-${heroMoment}`} className="text-[11px] text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">{heroMoments[heroMoment].note}</p><div className="flex gap-1.5 mt-3" role="tablist" aria-label="Forecast highlights">{heroMoments.map((moment, index) => <button key={moment.label} type="button" role="tab" aria-selected={heroMoment === index} aria-label={`Show ${moment.label}`} onClick={() => setHeroMoment(index)} className={`h-1.5 rounded-full ${heroMoment === index ? "w-7 bg-primary" : "w-3 bg-[#D0D4DC] hover:bg-[#6B7280]"}`} />)}</div></div>
                </div>
                <div className="space-y-2">
                  {[{ label: "Rent", timing: "in 11 days", amount: "−$1,650", tone: "bg-primary" }, { label: "Paycheck", timing: "in 16 days", amount: "+$2,400", tone: "bg-[#2D8B5A]" }, { label: "Tight day", timing: "Aug 3", amount: "$420", tone: "bg-[#CA8A04]" }].map((item, index) => <div key={item.label} className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 bg-background transition-all duration-500 ${heroMoment === index ? "translate-x-1 border-primary/35 shadow-md opacity-100" : "border-border opacity-55"}`}><span className={`h-2 w-2 rounded-full ${item.tone}`} /><div className="min-w-0 flex-1"><p className="text-xs font-medium">{item.label}</p><p className="text-[10px] text-muted-foreground">{item.timing}</p></div><span className="text-xs font-medium" style={mono}>{item.amount}</span></div>)}
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
      </section>

      {/* AHA FORECAST */}
      <section data-reveal className="py-20 px-5 border-y border-border/60 bg-white" id="features">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.78fr_1.22fr] gap-14 items-center">
          <div>
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Five days of warning</p>
            <h2 className="text-[40px] lg:text-[48px] font-medium tracking-tight leading-[1.06] mb-5" style={display}>$420 on August 3.<br /><span className="text-[#CA8A04]">Payday is five days away.</span></h2>
            <p className="text-[18px] text-foreground leading-relaxed mb-3">Rent, insurance, and your car payment all land in the same week.</p>
            <p className="text-muted-foreground leading-relaxed">FlowSight shows you the squeeze while there is still time to respond.</p>
          </div>
          <div className="relative rounded-[28px] border border-border bg-card p-5 sm:p-7 shadow-[0_28px_80px_rgba(28,28,34,0.10)] overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative"><ForecastStoryChart /></div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section data-reveal className="py-20 px-5 bg-[#F8F5EE] border-y border-[#E2E5EB]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[42px] lg:text-[52px] font-medium tracking-tight leading-[1.08] mb-4" style={display}>
              Stop looking backward.<br /><span className="text-accent">Start planning forward.</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="mx-auto mb-5 flex w-fit rounded-full border border-[#E2E5EB] bg-white p-1 shadow-sm" role="tablist" aria-label="Compare finance apps"><button role="tab" aria-selected={comparisonFocus === "past"} onClick={() => setComparisonFocus("past")} className={`rounded-full px-5 py-2 text-sm ${comparisonFocus === "past" ? "bg-[#0F1D3A] text-white shadow" : "text-[#6B7280] hover:text-[#0F1D3A]"}`}>Looking back</button><button role="tab" aria-selected={comparisonFocus === "future"} onClick={() => setComparisonFocus("future")} className={`rounded-full px-5 py-2 text-sm ${comparisonFocus === "future" ? "bg-primary text-primary-foreground shadow" : "text-[#6B7280] hover:text-[#0F1D3A]"}`}>Looking ahead</button></div>
            <div key={comparisonFocus} className="relative overflow-hidden rounded-3xl border border-[#E2E5EB] bg-white p-8 sm:p-10 shadow-[0_2px_8px_rgba(15,29,58,0.06)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
              <div className={`absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl ${comparisonFocus === "future" ? "bg-primary/10" : "bg-[#F8F5EE]"}`} />
              <div className="relative flex items-center gap-3 mb-6"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${comparisonFocus === "future" ? "bg-primary text-primary-foreground" : "bg-[#F8F5EE] text-[#6B7280]"}`}>{comparisonFocus === "future" ? <Sparkles size={17} /> : <BarChart3 size={17} />}</div><div><p className="text-xs text-[#6B7280]">{comparisonFocus === "future" ? "FlowSight" : "Traditional finance apps"}</p><h3 className="font-medium text-lg text-[#0F1D3A]">{comparisonFocus === "future" ? "Looking ahead" : "Looking back"}</h3></div></div>
              <p className="relative text-[#374151] leading-relaxed mb-7">{comparisonFocus === "future" ? "FlowSight shows what the next few weeks may hold—and what to do if money gets tight." : "Most tools organize what already happened. Useful for review, but they can't tell you if Friday will be tight."}</p>
              <div className="relative grid sm:grid-cols-3 gap-3">{(comparisonFocus === "future" ? ["Warns you before the tight day", "Labels confirmed and estimated events", '“$820 safe to spend until the 18th”'] : ["Reports money already spent", "Categories instead of timing", '“$200 spent on dining last month”']).map((item) => <div key={item} className={`rounded-xl border p-3 text-sm ${comparisonFocus === "future" ? "border-primary/30 bg-primary/[0.08] text-[#0F1D3A] font-medium" : "border-[#E2E5EB] bg-[#F8F5EE] text-[#6B7280] line-through decoration-[#6B7280]/40"}`}>{item}</div>)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section data-reveal className="px-5 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Made for real income</p>
            <h2 className="text-[40px] lg:text-[48px] font-medium tracking-tight" style={display}>Built for every way income arrives.</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">Regular paychecks, freelance invoices, gig work, commissions—or a mix. FlowSight keeps confirmed income separate from estimates.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4" role="tablist" aria-label="Income examples">
            {([
              { id: "salary" as const, title: "Regular paycheck", note: "Known timing", example: "Your salary covers rent and known bills. Your projected low is $780 on August 3." },
              { id: "freelance" as const, title: "Variable income", note: "Estimated timing", example: "Without the Acme invoice, your projected low is $220. Add its expected date to see the difference." },
              { id: "mixed" as const, title: "A mix of both", note: "Confirmed + estimated", example: "Your salary covers known bills. The Acme invoice would keep you above your $500 buffer." },
            ]).map(({ id, title, note, example }) => {
              const selected = incomeType === id;
              return <button key={id} role="tab" aria-selected={selected} onClick={() => setIncomeType(id)} className={`text-left rounded-2xl border p-6 transition-all duration-300 ${selected ? "border-primary/40 bg-card -translate-y-1 shadow-[0_20px_55px_rgba(28,28,34,0.10)]" : "border-border bg-card/55 hover:border-primary/20"}`}><div className="flex items-start justify-between gap-3 mb-4"><div><h3 className="font-semibold text-lg mb-1">{title}</h3><p className="text-xs text-muted-foreground">{note}</p></div>{selected && <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">See example</span>}</div><IncomePattern kind={id} /><div className={`grid transition-all duration-300 ${selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><p className="overflow-hidden text-sm leading-relaxed text-foreground border-t border-border pt-4">{example}</p></div></button>;
            })}
          </div>
        </div>
      </section>

      {/* SCENARIO PLANNER */}
      <section data-reveal className="py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Scenario Planner</p>
              <h2 className="text-[40px] font-medium tracking-tight mb-4 leading-[1.1]" style={display}>Test a decision before you make it.</h2>
              <p className="text-muted-foreground text-[17px] leading-relaxed mb-3">See exactly how a purchase changes your next 30 days before you commit.</p>
              <div className="space-y-2.5 mt-8">
                {scenarios.map((s, i) => (
                  <button key={i} onClick={() => setScenario(i)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 text-sm flex items-center justify-between ${scenario === i ? "border-primary/40 bg-primary/8 text-foreground" : "border-border text-muted-foreground hover:text-foreground/80"}`}>
                    <span>{s.label}</span>
                    {scenario === i && <CheckCircle size={14} className="text-primary" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-foreground">30-Day Forecast</p>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${scenarios[scenario].amount === 0 ? "bg-emerald-100 text-emerald-700" : scenarios[scenario].amount > 1500 ? "bg-destructive/15 text-destructive" : "bg-yellow-500/15 text-amber-700"}`} style={mono}>
                  {scenarios[scenario].amount === 0 ? "Baseline" : scenarios[scenario].amount > 1500 ? "High impact" : "Moderate impact"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-2"><span className="flex items-center gap-1.5"><span className="w-5 border-t border-dashed border-slate-400" />Without purchase</span><span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-primary" />With purchase</span></div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={scenarioData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lScenActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171714" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#171714" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lScenProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4754A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#D4754A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 9, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x="Jul 31" stroke="#5c6b8a" strokeDasharray="3 2" strokeWidth={1} />
                  <Area type="monotone" dataKey="balance" stroke="#171714" strokeWidth={2} fill="url(#lScenActual)" dot={false} connectNulls={false} />
                  <Area type="monotone" dataKey="baseline" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" fill="transparent" dot={false} connectNulls={false} animationDuration={350} animationEasing="ease-out" />
                  <Area type="monotone" dataKey="projected" stroke="#D4754A" strokeWidth={3} fill="url(#lScenProj)" dot={false} connectNulls={false} animationDuration={350} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Today", value: "$5,500", color: "text-foreground" },
                  { label: "End of month", value: endBalance < 0 ? `-$${Math.abs(endBalance).toLocaleString()}` : `$${endBalance.toLocaleString()}`, color: endBalance < 2000 ? "text-destructive" : "text-emerald-700" },
                  { label: "Safe to spend", value: `$${safeToSpend.toLocaleString()}`, color: safeToSpend < 500 ? "text-destructive" : safeToSpend < 1000 ? "text-amber-700" : "text-emerald-700" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                    <p className={`text-sm font-semibold ${color} transition-colors duration-300`} style={mono}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section data-reveal className="py-20 px-5 mx-3 sm:mx-5 rounded-[32px] border border-border/60 bg-[#F8F5EE]" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Process</p>
            <h2 className="text-[40px] font-medium tracking-tight mb-3" style={display}>How it works</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Bring in your numbers, check what we found, and see what’s ahead.</p>
          </div>
          <div className="grid md:grid-cols-[0.82fr_1.18fr] gap-8 items-center">
            <div className="space-y-2" role="tablist" aria-label="How FlowSight works">{processSteps.map((step, index) => <button key={step.n} role="tab" aria-selected={activeStep === index} onClick={() => setActiveStep(index)} className={`w-full rounded-2xl p-4 text-left transition-all duration-500 ${activeStep === index ? "bg-primary/[0.08] text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}><div className="flex items-start gap-3"><span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${activeStep === index ? "bg-primary text-primary-foreground" : "bg-muted"}`} style={mono}>{index + 1}</span><div><h3 className="font-semibold text-lg">{step.title}</h3><div className={`grid transition-all duration-500 ${activeStep === index ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}><p className="overflow-hidden text-sm leading-relaxed text-muted-foreground">{step.desc}</p></div></div></div></button>)}</div>
            <div key={activeStep} className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-[0_28px_70px_rgba(28,28,34,0.11)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 motion-safe:duration-500"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/12 blur-3xl" /><div className="relative"><StepIllustration step={activeStep} /></div></div>
            <div className="md:col-start-1 flex gap-2 px-4">{processSteps.map((step, index) => <button key={step.n} aria-label={`Show step ${index + 1}`} onClick={() => setActiveStep(index)} className="h-1 flex-1 rounded-full bg-muted overflow-hidden"><span className={`block h-full bg-primary transition-[width] ease-linear ${activeStep === index ? "w-full" : "w-0"}`} style={{ transitionDuration: "3000ms" }} /></button>)}</div>
          </div>
        </div>
      </section>

      {/* SHOW YOUR WORK */}
      <section data-reveal className="py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Show Your Work</p>
            <h2 className="text-[40px] lg:text-[48px] font-medium tracking-tight leading-[1.06] mb-5" style={display}>Every number shows its work.</h2>
            <p className="text-muted-foreground text-[17px] leading-relaxed">Open any important amount to see how FlowSight calculated it—which events are confirmed, which are estimated, and what assumptions went in. No black boxes or unexplained numbers.</p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-[#0C1628] text-white shadow-[0_28px_80px_rgba(12,22,40,0.22)] overflow-hidden">
            <div className="px-6 pt-5 flex items-center justify-between text-[10px] text-white/40" style={mono}><span>FLOWSIGHT · EVERYDAY</span><span>UPDATED 2 DAYS AGO</span></div>
            <button onClick={() => setShowWork((open) => !open)} aria-expanded={showWork} className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.04]"><div><p className="text-xs text-white/50 mb-1">Safe to spend</p><p className="text-3xl font-medium text-[#65B98A]" style={mono}>$680</p></div><span className="inline-flex items-center gap-2 text-sm font-medium text-white">{showWork ? "Hide calculation" : "Show calculation"}<span className={`text-xl text-primary transition-transform duration-300 ${showWork ? "rotate-45" : ""}`}>+</span></span></button>
            <div className={`grid transition-all duration-500 ease-out ${showWork ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden"><div className="border-t border-white/10 px-6 py-5 space-y-3 bg-white/[0.03]">
                {[{ label: "Balance as of Jul 15", value: "$3,840" }, { label: "Net activity since Jul 15", value: "+$420" }, { label: "Opening balance today", value: "$4,260" }, { label: "Lowest projected balance", value: "$1,180" }, { label: "Protected safety buffer", value: "−$500" }].map((row, index) => <div key={row.label} className={`flex justify-between gap-4 text-sm ${index === 2 || index === 4 ? "border-t border-white/10 pt-3 font-semibold" : ""}`}><span className="text-white/50">{row.label}</span><span style={mono}>{row.value}</span></div>)}
                <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3 mt-4"><p className="text-xs font-medium">Based on 7 confirmed events and 2 estimates.</p><p className="text-[11px] text-white/45 mt-1">Balance updated 2 days ago · 1 skipped event excluded</p></div>
              </div></div>
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
      <section data-reveal className="py-20 px-5 border-y border-border/60 bg-[#F8F5EE]" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Common questions</p>
            <h2 className="text-[40px] font-medium tracking-tight" style={display}>A few things to know.</h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-foreground"><span>{item.question}</span><span className="text-primary text-xl font-normal transition-transform group-open:rotate-45">+</span></summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3 pr-10">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-reveal className="py-20 px-5 relative overflow-hidden" style={{ background: "radial-gradient(circle at 50% 48%, rgba(212,117,74,0.10), transparent 38%)" }}>
        <div className="max-w-xl mx-auto text-center">
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
                  <button type="submit" className="fs-brand-action px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap">Join Beta</button>
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
                {["Features", "How It Works", "Pricing", "Changelog"].map((t) => (
                  <a key={t} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Company</p>
              <div className="space-y-2.5">
                {["About", "Security", "Privacy", "Terms", "Contact"].map((t) => (
                  <a key={t} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{t}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-4" style={mono}>Connect</p>
              <div className="flex gap-2.5">
                {[{ Icon: Code, label: "GitHub" }, { Icon: Briefcase, label: "LinkedIn" }, { Icon: AtSign, label: "X" }].map(({ Icon, label }) => (
                  <a key={label} href="#" aria-label={label} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
                    <Icon size={14} />
                  </a>
                ))}
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
