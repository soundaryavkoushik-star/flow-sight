"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Shield, Eye, TrendingUp, Bell, ArrowRight, Check, Lock, Zap,
  Code, Briefcase, AtSign, AlertTriangle, Wallet, BarChart3,
  X, Menu, Sparkles, CheckCircle, RefreshCw,
} from "lucide-react";

const display: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const heroChartData = [
  { day: "Dec 1", balance: 4240, projected: null },
  { day: "Dec 3", balance: 3720, projected: null },
  { day: "Dec 5", balance: 6790, projected: null },
  { day: "Dec 8", balance: 6320, projected: null },
  { day: "Dec 11", balance: 5940, projected: null },
  { day: "Dec 13", balance: 5720, projected: null },
  { day: "Dec 15", balance: 5500, projected: 5500 },
  { day: "Dec 17", balance: null, projected: 5240 },
  { day: "Dec 19", balance: null, projected: 4980 },
  { day: "Dec 20", balance: null, projected: 8180 },
  { day: "Dec 23", balance: null, projected: 7800 },
  { day: "Dec 26", balance: null, projected: 7440 },
  { day: "Dec 29", balance: null, projected: 7100 },
  { day: "Dec 31", balance: null, projected: 6900 },
];

const scenarios = [
  { label: "No purchase", amount: 0 },
  { label: "Weekend trip ($480)", amount: 480 },
  { label: "New iPhone ($1,099)", amount: 1099 },
  { label: "MacBook Pro ($2,499)", amount: 2499 },
];

const generateScenarioData = (amount: number) => [
  { day: "Dec 1", balance: 4240, projected: null },
  { day: "Dec 3", balance: 3720, projected: null },
  { day: "Dec 5", balance: 6790, projected: null },
  { day: "Dec 8", balance: 6320, projected: null },
  { day: "Dec 11", balance: 5940, projected: null },
  { day: "Dec 15", balance: 5500, projected: 5500 },
  { day: "Dec 17", balance: null, projected: 5240 - amount },
  { day: "Dec 19", balance: null, projected: 4980 - amount },
  { day: "Dec 20", balance: null, projected: 8180 - amount },
  { day: "Dec 23", balance: null, projected: 7800 - amount },
  { day: "Dec 26", balance: null, projected: 7440 - amount },
  { day: "Dec 31", balance: null, projected: 6900 - amount },
];

const trustItems = [
  { icon: Lock, title: "No bank connection required", desc: "Start with a CSV or enter your essentials manually. Bank connectivity is a future Premium option." },
  { icon: Shield, title: "Secure sign-in", desc: "Your account is protected through secure email-and-password authentication." },
  { icon: Eye, title: "Transparent forecasting", desc: "Every prediction is explainable. See exactly how FlowSight built your forecast — no black boxes." },
  { icon: Zap, title: "Your data stays yours", desc: "Privacy controls, data export, and account deletion are part of the FlowSight experience." },
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

export default function Landing() {
  const router = useRouter();
  const navigate = router.push;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scenarioData = generateScenarioData(scenarios[scenario].amount);
  const endBalance = 6900 - scenarios[scenario].amount;
  const safeToSpend = Math.max(0, 2840 - scenarios[scenario].amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-2xl border-b border-border" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <TrendingUp size={13} className="text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm tracking-tight" style={display}>FlowSight</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {["Features", "How It Works", "Security"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/sign-in")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Sign in</button>
            <button onClick={() => navigate("/sign-up")} className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">Join Beta</button>
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
            <button onClick={() => navigate("/sign-up")} className="text-sm bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium">Join Beta</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-28 px-5 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-8">
              <Sparkles size={10} />Now in private beta
            </div>
            <h1 className="text-[52px] lg:text-[64px] font-extrabold leading-[1.05] tracking-tight text-foreground mb-6" style={display}>
              See what&apos;s next<br /><span className="text-accent">for your money.</span>
            </h1>
            <p className="text-[17px] text-muted-foreground leading-relaxed mb-10 max-w-[400px]">
              Import a CSV or add a few details yourself. FlowSight shows how the next 30 days could unfold—so bills, paydays, and tight spots don’t catch you by surprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <button onClick={() => navigate("/sign-up")} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/25">
                Join the Beta <ArrowRight size={15} />
              </button>
              <button className="flex items-center justify-center gap-2 text-muted-foreground border border-border px-6 py-3 rounded-xl font-medium text-sm hover:text-foreground hover:border-foreground/20 transition-all">
                Watch Demo
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {["No bank connection required", "Your numbers, clearly explained", "No budgets to maintain"].map((t) => (
                <div key={t} className="flex items-center gap-2.5">
                  <CheckCircle size={14} className="text-accent shrink-0" />
                  <span className="text-sm text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* App window mockup */}
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/8 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative bg-card border border-border rounded-[20px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="mx-auto text-[10px] text-muted-foreground" style={mono}>FlowSight — Chase Checking ••4821</span>
              </div>
              <div className="px-5 pt-4 pb-3.5 flex items-start justify-between border-b border-border/50">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1" style={mono}>Current Balance</p>
                  <p className="text-[28px] font-bold leading-none text-foreground" style={mono}>$5,500<span className="text-sm font-normal text-muted-foreground">.00</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground mb-2">What this forecast knows</p>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="h-1.5 w-[72px] bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: "82%" }} />
                    </div>
                    <span className="text-sm font-semibold text-accent">Looking good</span>
                  </div>
                </div>
              </div>
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-center justify-between px-2 mb-2">
                  <p className="text-[10px] text-muted-foreground" style={mono}>30-Day Cash Flow</p>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-muted-foreground"><span className="w-4 h-px bg-foreground/40 inline-block" />actual</span>
                    <span className="flex items-center gap-1 text-accent"><span className="w-4 border-t border-dashed border-accent inline-block" />projected</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={heroChartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lHeroActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5573ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5573ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lHeroProj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1dd8a0" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#1dd8a0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x="Dec 15" stroke="#5c6b8a" strokeDasharray="3 2" strokeWidth={1} label={{ value: "Today", fill: "#5c6b8a", fontSize: 9, position: "insideTopLeft", fontFamily: "DM Mono, monospace" }} />
                    <Area type="monotone" dataKey="balance" stroke="#5573ff" strokeWidth={2} fill="url(#lHeroActual)" dot={false} connectNulls={false} />
                    <Area type="monotone" dataKey="projected" stroke="#1dd8a0" strokeWidth={2} strokeDasharray="4 3" fill="url(#lHeroProj)" dot={false} connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="px-5 pb-4 pt-1 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 py-1.5 flex-1 min-w-0">
                  <Bell size={10} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">Rent due in <span className="text-foreground font-medium">15 days</span> — $1,650</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Safe to spend</p>
                  <p className="font-semibold text-accent" style={mono}>$2,840</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-2xl px-3 py-2.5 shadow-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <TrendingUp size={13} className="text-accent" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-none mb-1">Paycheck arriving</p>
                  <p className="text-xs font-semibold text-foreground leading-none" style={mono}>+$3,200 in 5 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 px-5" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[42px] lg:text-[52px] font-extrabold tracking-tight leading-[1.08] mb-4" style={display}>
              Stop looking backward.<br /><span className="text-accent">Start planning forward.</span>
            </h2>
            <p className="text-muted-foreground text-[17px] max-w-lg mx-auto">Traditional finance apps show you where your money went. FlowSight shows you where it&apos;s going.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1.5 mb-7">
                <X size={9} />Traditional Finance Apps
              </div>
              <div className="space-y-4">
                {["Shows last month's spending history", "Reacts to problems after they happen", "Manual category budgets to maintain", "No context on recurring financial patterns", "Overwhelming transaction lists"].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
                      <X size={9} className="text-destructive" />
                    </div>
                    <span className="text-sm text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-accent/20 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-56 h-56 bg-accent/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
              <div className="inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 rounded-full px-3 py-1.5 mb-7">
                <Sparkles size={9} />FlowSight
              </div>
              <div className="space-y-4">
                {["Shows the next 30 days from the details you provide", "Highlights known tight days before they arrive", "Works with CSV or manual entry", "Labels events as confirmed or estimated", "Explains what drives each low point"].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={9} className="text-accent" />
                    </div>
                    <span className="text-sm text-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-5" style={{ background: "rgba(15,20,33,0.5)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Features</p>
            <h2 className="text-[40px] font-extrabold tracking-tight mb-3" style={display}>Your financial sixth sense</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Three tools that give you clarity and confidence over your money.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors duration-200">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-5"><BarChart3 size={17} className="text-primary" /></div>
              <h3 className="font-semibold text-foreground mb-2">Cash Flow Forecasting</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">See your balance unfold day by day, based on the income, bills, and transactions you know are coming.</p>
              <div className="bg-muted/50 rounded-xl p-3 h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={heroChartData.filter((d) => d.balance !== null)} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lFeature" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5573ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5573ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="balance" stroke="#5573ff" strokeWidth={2} fill="url(#lFeature)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-accent/30 transition-colors duration-200">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-5"><Wallet size={17} className="text-accent" /></div>
              <h3 className="font-semibold text-foreground mb-2">Safe to Spend</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">One practical number for today—after upcoming bills and your safety buffer are taken into account.</p>
              <div className="bg-muted/50 rounded-xl px-4 py-3.5 space-y-2.5">
                {[{ label: "Current balance", value: "$5,500", color: "text-foreground" }, { label: "Committed outflows", value: "–$2,660", color: "text-red-400" }].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={`text-xs font-medium ${color}`} style={mono}>{value}</span>
                  </div>
                ))}
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Safe to spend</span>
                  <span className="text-sm font-bold text-accent" style={mono}>$2,840</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-yellow-500/30 transition-colors duration-200">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center mb-5"><Bell size={17} className="text-yellow-400" /></div>
              <h3 className="font-semibold text-foreground mb-2">A heads-up when it matters</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">FlowSight watches for known bills and income that could put pressure on your balance—and lets you know before the tight day arrives.</p>
              <div className="space-y-2">
                {[
                  { msg: "Balance may dip below $500 on Dec 19", color: "text-yellow-400", bg: "bg-yellow-500/10" },
                  { msg: "Rent arrives five days before your next paycheck", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { msg: "Insurance is estimated for Dec 21", color: "text-orange-400", bg: "bg-orange-500/10" },
                ].map(({ msg, color, bg }) => (
                  <div key={msg} className={`${bg} rounded-lg px-2.5 py-2 flex items-start gap-2`}>
                    <AlertTriangle size={10} className={`${color} shrink-0 mt-0.5`} />
                    <p className="text-xs text-muted-foreground">{msg}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCENARIO PLANNER */}
      <section className="py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Scenario Planner</p>
              <h2 className="text-[40px] font-extrabold tracking-tight mb-4 leading-[1.1]" style={display}>Before you buy, know.</h2>
              <p className="text-muted-foreground text-[17px] leading-relaxed mb-8">Thinking about a big purchase? See the exact impact on your 30-day forecast before you swipe the card.</p>
              <div className="space-y-2.5">
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
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${scenarios[scenario].amount === 0 ? "bg-accent/15 text-accent" : scenarios[scenario].amount > 1500 ? "bg-destructive/15 text-destructive" : "bg-yellow-500/15 text-yellow-400"}`} style={mono}>
                  {scenarios[scenario].amount === 0 ? "Baseline" : scenarios[scenario].amount > 1500 ? "High impact" : "Moderate impact"}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={scenarioData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lScenActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5573ff" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#5573ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lScenProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1dd8a0" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#1dd8a0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 9, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x="Dec 15" stroke="#5c6b8a" strokeDasharray="3 2" strokeWidth={1} />
                  <Area type="monotone" dataKey="balance" stroke="#5573ff" strokeWidth={2} fill="url(#lScenActual)" dot={false} connectNulls={false} />
                  <Area type="monotone" dataKey="projected" stroke="#1dd8a0" strokeWidth={2} strokeDasharray="4 3" fill="url(#lScenProj)" dot={false} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Today", value: "$5,500", color: "text-foreground" },
                  { label: "End of month", value: endBalance < 0 ? `-$${Math.abs(endBalance).toLocaleString()}` : `$${endBalance.toLocaleString()}`, color: endBalance < 2000 ? "text-destructive" : "text-accent" },
                  { label: "Safe to spend", value: `$${safeToSpend.toLocaleString()}`, color: safeToSpend < 500 ? "text-destructive" : safeToSpend < 1000 ? "text-yellow-400" : "text-accent" },
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
      <section className="py-24 px-5" id="how-it-works" style={{ background: "rgba(15,20,33,0.5)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Process</p>
            <h2 className="text-[40px] font-extrabold tracking-tight mb-3" style={display}>How it works</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Bring in your numbers, check what we found, and see what’s ahead.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-14">
            {[
              { n: "01", title: "Bring in your numbers", desc: "Import a CSV from your bank, or enter the essentials yourself. No bank connection required.", icon: Lock, color: "text-primary", bg: "bg-primary/15" },
              { n: "02", title: "Check what we found", desc: "Review your transactions and confirm the paychecks, bills, and subscriptions that happen regularly.", icon: RefreshCw, color: "text-accent", bg: "bg-accent/15" },
              { n: "03", title: "See what’s ahead", desc: "Get a clear 30-day view of your balance, your safest spending amount, and the days that may need attention.", icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-500/15" },
            ].map(({ n, title, desc, icon: Icon, color, bg }) => (
              <div key={n}>
                <p className="text-[84px] font-bold text-border/30 mb-4 select-none leading-none" style={mono}>{n}</p>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}><Icon size={17} className={color} /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2" style={display}>{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-24 px-5" id="security">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-3" style={mono}>Security</p>
            <h2 className="text-[40px] font-extrabold tracking-tight mb-3" style={display}>Built for trust.</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Financial data is serious. We treat it that way.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* CTA */}
      <section className="py-24 px-5">
        <div className="max-w-xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative bg-card border border-border rounded-3xl px-8 py-14">
              <p className="text-accent text-xs font-medium uppercase tracking-[0.15em] mb-5" style={mono}>Early Access</p>
              <h2 className="text-[40px] font-extrabold tracking-tight leading-[1.1] mb-4" style={display}>Stop guessing.<br />Start knowing.</h2>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm">Join the beta and be among the first to see exactly where your money is going — before it gets there.</p>
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
                  <button type="submit" className="bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-primary/20">Join Beta</button>
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
                <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center"><TrendingUp size={11} className="text-primary-foreground" /></div>
                <span className="font-semibold text-sm" style={display}>FlowSight</span>
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
