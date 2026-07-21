"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Bell, Settings, LogOut, BarChart3,
  CreditCard, Home, RefreshCw, AlertTriangle,
  ChevronRight, ArrowUpRight, ArrowDownRight, X, Menu,
  Sparkles, Building2, ShoppingCart, Utensils, Car, Wifi,
  MoreHorizontal, Search,
} from "lucide-react";

const display: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

// ── DATA ─────────────────────────────────────────────────────────────────────

const forecastData = [
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

const spendingData = [
  { week: "Nov W1", amount: 640 },
  { week: "Nov W2", amount: 820 },
  { week: "Nov W3", amount: 560 },
  { week: "Nov W4", amount: 980 },
  { week: "Dec W1", amount: 710 },
  { week: "Dec W2", amount: 490 },
];

const transactions = [
  { id: 1, name: "Whole Foods Market", category: "Groceries", amount: -84.32, date: "Today, 9:14 AM", icon: ShoppingCart, color: "bg-green-500/15 text-green-400" },
  { id: 2, name: "Spotify Premium", category: "Entertainment", amount: -11.00, date: "Today, 12:00 AM", icon: Wifi, color: "bg-green-500/15 text-green-400" },
  { id: 3, name: "Chipotle", category: "Dining", amount: -14.75, date: "Yesterday, 7:32 PM", icon: Utensils, color: "bg-orange-500/15 text-orange-400" },
  { id: 4, name: "Stripe Inc.", category: "Income", amount: 5400.00, date: "Dec 13, 9:00 AM", icon: ArrowUpRight, color: "bg-accent/15 text-accent" },
  { id: 5, name: "Shell Gas Station", category: "Transport", amount: -58.40, date: "Dec 12, 6:45 PM", icon: Car, color: "bg-blue-500/15 text-blue-400" },
  { id: 6, name: "Amazon", category: "Shopping", amount: -127.99, date: "Dec 12, 2:10 PM", icon: ShoppingCart, color: "bg-yellow-500/15 text-yellow-400" },
  { id: 7, name: "Rent — 1420 Oak St", category: "Housing", amount: -1650.00, date: "Dec 1, 12:00 AM", icon: Home, color: "bg-red-500/15 text-red-400" },
];

const upcoming = [
  { name: "Paycheck", amount: "+$5,400", days: "In 5 days", color: "text-accent", dot: "bg-accent", icon: ArrowUpRight },
  { name: "Rent", amount: "–$1,650", days: "In 15 days", color: "text-red-400", dot: "bg-red-400", icon: Home },
  { name: "Electric bill", amount: "~–$95", days: "In 18 days", color: "text-muted-foreground", dot: "bg-yellow-400", icon: Wifi },
  { name: "Netflix", amount: "–$17", days: "In 22 days", color: "text-muted-foreground", dot: "bg-muted-foreground", icon: Wifi },
];

const alerts = [
  { msg: "Balance may dip to $4,980 on Dec 19 — 4 days before next paycheck", type: "warn" },
  { msg: "Dining spend up 34% vs. last month ($218 so far)", type: "info" },
  { msg: "Paycheck of $5,400 arrives Dec 20 — your largest inflow this month", type: "ok" },
];

const navItems = [
  { label: "Overview", icon: BarChart3 },
  { label: "Cash Flow", icon: TrendingUp },
  { label: "Accounts", icon: Building2 },
  { label: "Transactions", icon: CreditCard },
  { label: "Alerts", icon: Bell, badge: 2 },
  { label: "Settings", icon: Settings },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const val = payload.find((p) => p.value != null);
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground" style={mono}>${val?.value?.toLocaleString()}</p>
    </div>
  );
};

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [forecastRange, setForecastRange] = useState<"30d" | "60d">("30d");
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  const visibleAlerts = alerts.filter((_, i) => !dismissedAlerts.includes(i));

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-60 flex flex-col
        bg-card border-r border-border transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp size={13} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm" style={display}>FlowSight</span>
          <button className="lg:hidden ml-auto text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Account pill */}
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">AJ</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Alex Johnson</p>
              <p className="text-[10px] text-muted-foreground truncate" style={mono}>Chase ••4821</p>
            </div>
            <ChevronRight size={12} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, badge }) => (
            <button
              key={label}
              onClick={() => { setActiveNav(label); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                activeNav === label
                  ? "bg-primary/12 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={15} className={activeNav === label ? "text-primary" : ""} />
              <span className="font-medium">{label}</span>
              {badge && (
                <span className="ml-auto bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={mono}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Forecast coverage */}
        <div className="px-3 pb-3">
          <div className="bg-muted/50 rounded-xl px-3.5 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground">What this forecast knows</p>
              <span className="text-[10px] font-semibold text-accent">Looking good</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: "82%" }} />
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">Updated 4 min ago</p>
          </div>
        </div>

        {/* Sign out */}
        <div className="px-3 pb-4 border-t border-border pt-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 px-5 lg:px-7 h-[60px] flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu size={19} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-foreground" style={display}>{activeNav}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
              <Search size={14} />
            </button>
            <button className="relative w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
              <Bell size={14} />
              {visibleAlerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center" style={mono}>
                  {visibleAlerts.length}
                </span>
              )}
            </button>
            <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 lg:px-7 py-6 max-w-[1200px] mx-auto space-y-5">

            {/* Greeting */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[26px] font-extrabold tracking-tight leading-tight" style={display}>
                  Good morning, Alex.
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">Thursday, December 15 · Here&apos;s your financial picture.</p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs px-3 py-1.5 rounded-full">
                <Sparkles size={10} />
                <span>Forecast updated</span>
              </div>
            </div>

            {/* Alerts */}
            {visibleAlerts.length > 0 && (
              <div className="space-y-2">
                {visibleAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                      alert.type === "warn"
                        ? "bg-yellow-500/8 border-yellow-500/20"
                        : alert.type === "ok"
                        ? "bg-accent/8 border-accent/20"
                        : "bg-primary/8 border-primary/20"
                    }`}
                  >
                    <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${alert.type === "warn" ? "text-yellow-400" : alert.type === "ok" ? "text-accent" : "text-primary"}`} />
                    <p className="text-muted-foreground flex-1 leading-relaxed">{alert.msg}</p>
                    <button
                      onClick={() => setDismissedAlerts((p) => [...p, alerts.indexOf(alert)])}
                      className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Current Balance", value: "$5,500", sub: "Chase ••4821", color: "text-foreground", trend: null },
                { label: "Safe to Spend", value: "$2,840", sub: "After all commitments", color: "text-accent", trend: null },
                { label: "Income (Dec)", value: "$5,400", sub: "+$0 vs last month", color: "text-foreground", trend: "up" },
                { label: "Spending (Dec)", value: "$1,286", sub: "+$214 vs last month", color: "text-foreground", trend: "up-bad" },
              ].map(({ label, value, sub, color, trend }) => (
                <div key={label} className="bg-card border border-border rounded-2xl px-4 py-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2" style={mono}>{label}</p>
                  <div className="flex items-end justify-between gap-2">
                    <p className={`text-xl font-bold ${color} leading-none`} style={mono}>{value}</p>
                    {trend && (
                      <div className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-accent" : "text-destructive"}`}>
                        {trend === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{sub}</p>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-5">

              {/* Left column */}
              <div className="space-y-5">

                {/* Forecast chart */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Cash Flow Forecast</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Projected through Dec 31</p>
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      {(["30d", "60d"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setForecastRange(r)}
                          className={`text-xs px-2.5 py-1 rounded-md transition-all ${forecastRange === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          style={mono}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-5 h-px bg-primary/70 inline-block" />Actual
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-accent">
                      <span className="w-5 border-t border-dashed border-accent inline-block" />Projected
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />Today
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dForecastActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5573ff" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#5573ff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="dForecastProj" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1dd8a0" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#1dd8a0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x="Dec 15" stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="balance" stroke="#5573ff" strokeWidth={2} fill="url(#dForecastActual)" dot={false} connectNulls={false} />
                      <Area type="monotone" dataKey="projected" stroke="#1dd8a0" strokeWidth={2} strokeDasharray="5 3" fill="url(#dForecastProj)" dot={false} connectNulls={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Weekly spending bar chart */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Weekly Spending</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Last 6 weeks</p>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      View all <ChevronRight size={11} />
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={spendingData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#5c6b8a", fontFamily: "DM Mono, monospace" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#5573ff" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Transactions */}
                <div className="bg-card border border-border rounded-2xl">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-border">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      See all <ChevronRight size={11} />
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {transactions.map(({ id, name, category, amount, date, icon: Icon, color }) => (
                      <div key={id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors group">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">{category} · {date}</p>
                        </div>
                        <p className={`text-sm font-semibold shrink-0 ${amount > 0 ? "text-accent" : "text-foreground"}`} style={mono}>
                          {amount > 0 ? "+" : ""}${Math.abs(amount).toFixed(2)}
                        </p>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-5">

                {/* Safe to spend */}
                <div className="bg-card border border-accent/20 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2" style={mono}>Safe to Spend</p>
                  <p className="text-[36px] font-extrabold text-accent leading-none mb-1" style={{ ...mono, ...display }}>$2,840</p>
                  <p className="text-xs text-muted-foreground mb-5">After committed outflows</p>
                  <div className="space-y-2">
                    {[
                      { label: "Balance", value: "$5,500", color: "text-foreground" },
                      { label: "Rent (Dec 30)", value: "–$1,650", color: "text-red-400" },
                      { label: "Subscriptions", value: "–$89", color: "text-muted-foreground" },
                      { label: "Utilities (est.)", value: "–$95", color: "text-muted-foreground" },
                      { label: "Groceries (est.)", value: "–$320", color: "text-muted-foreground" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className={`text-xs font-medium ${color}`} style={mono}>{value}</span>
                      </div>
                    ))}
                    <div className="h-px bg-border my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-foreground">Safe to spend</span>
                      <span className="text-sm font-bold text-accent" style={mono}>$2,840</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming events */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Upcoming Events</h3>
                  <div className="space-y-3">
                  {upcoming.map(({ name, amount, days, color, dot }) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">{days}</p>
                        </div>
                        <span className={`text-sm font-semibold shrink-0 ${color}`} style={mono}>{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spending breakdown */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Spending This Month</h3>
                  <div className="space-y-3">
                    {[
                      { cat: "Housing", pct: 0, amount: "$0", color: "bg-red-400" },
                      { cat: "Groceries", pct: 25, amount: "$320", color: "bg-green-400" },
                      { cat: "Dining", pct: 17, amount: "$218", color: "bg-orange-400" },
                      { cat: "Transport", pct: 11, amount: "$141", color: "bg-blue-400" },
                      { cat: "Shopping", pct: 18, amount: "$231", color: "bg-yellow-400" },
                      { cat: "Other", pct: 29, amount: "$376", color: "bg-primary/60" },
                    ].map(({ cat, pct, amount, color }) => (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">{cat}</span>
                          <span className="text-foreground font-medium" style={mono}>{amount}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forecast coverage */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">What this forecast knows</h3>
                    <span className="text-accent font-semibold text-sm">Looking good</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-accent" style={{ width: "82%", transition: "width 1s ease" }} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Based on 6 recurring patterns found across 90 days of transactions.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { label: "Transactions analyzed", value: "847" },
                      { label: "Patterns found", value: "6" },
                      { label: "Days of history", value: "90" },
                      { label: "Last updated", value: "4m ago" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                        <p className="text-xs font-semibold text-foreground" style={mono}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
