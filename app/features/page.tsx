import Image from "next/image"
import Link from "next/link"
import { ArrowLeftRight, ArrowRight, BellRing, BriefcaseBusiness, FileSpreadsheet, Gauge, GitBranch, ListTree, Repeat2, ShieldCheck, ShoppingBasket, Tags, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { RunwayPreview } from "@/components/runway-preview"

function HeroGlancePreview({ showRunway = true }: { showRunway?: boolean }) {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="rounded-xl border border-[oklch(var(--fs-green))]/25 bg-[oklch(var(--fs-green-bg))] p-4 text-left"><p className="font-mono text-[10px] uppercase tracking-wider text-[oklch(var(--fs-green))]">CLEAR</p><p className="mt-2 text-sm font-semibold">You&apos;re on track for the next 30 days.</p><p className="mt-2 text-xs text-muted-foreground">Lowest projected balance: <span className="font-mono font-medium text-foreground">$1,840 · Aug 12</span></p><p className="mt-2 text-[10px] text-muted-foreground">Based on balances updated Jul 24</p></div>
    <div className="mt-4 grid gap-2 text-left sm:grid-cols-4"><div className="rounded-xl border border-border p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Today&apos;s opening balance</p><p className="mt-2 font-mono text-lg font-bold">$2,740</p><p className="mt-1 text-[9px] text-muted-foreground">Before today&apos;s scheduled activity.</p></div><div className="rounded-xl border border-border p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Safe to Spend</p><p className="mt-2 font-mono text-lg font-bold text-[oklch(var(--fs-green))]">$1,340</p><p className="mt-1 text-[9px] text-muted-foreground">Safe today through Aug 23.</p></div><div className="rounded-xl border border-border p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Safety buffer</p><p className="mt-2 text-sm font-semibold text-[oklch(var(--fs-green))]">Intact</p><p className="mt-1 text-[9px] text-muted-foreground">$500 protected</p><span className="mt-1 inline-flex text-[9px] text-primary">Adjust →</span></div><div className="rounded-xl border border-border p-3"><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Next important event</p><p className="mt-2 truncate text-sm font-semibold">Harbor View Rent</p><p className="mt-1 text-[9px] text-muted-foreground">Aug 4 · −$1,650</p></div></div>
    {showRunway && <div className="mt-5 rounded-xl border border-border p-4 text-left"><p className="font-mono text-[9px] uppercase tracking-wider text-primary">Cash-flow runway</p><p className="mt-1 text-xs font-semibold">The moments shaping your next 30 days</p><RunwayPreview compact /></div>}
  </div>
}

function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  return <header className="sticky top-0 z-50 border-b border-border bg-background/90 px-5 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5">
      <Link href="/" aria-label="Cusp home"><Image src="/cusp-logo.svg?v=2" alt="Cusp" width={125} height={29} loading="eager" className="h-7 w-auto" /></Link>
      <nav className="hidden items-center gap-8 text-sm md:flex">
        <Link href="/features" aria-current="page" className="border-b border-primary py-2 font-medium text-foreground">Features</Link>
        <Link href="/learn" className="py-2 text-muted-foreground transition-colors hover:text-foreground">Learn</Link>
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        {!signedIn && <Link href="/sign-in" className="hidden px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">Sign in</Link>}
        <Link href={signedIn ? "/app/dashboard" : "/sign-up"} className="fs-brand-action inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium">{signedIn ? "Open dashboard" : "Get early access"}<ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  </header>
}

function ForecastPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Cash Flow Forecast</p><p className="mt-0.5 text-xs text-muted-foreground">Projected through Aug 30</p></div><div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5 font-mono text-[10px]"><span className="rounded-md bg-card px-2 py-1 shadow-sm">30d</span><span className="px-2 py-1 text-muted-foreground">60d</span><span className="px-2 py-1 text-muted-foreground">90d</span></div></div>
    <div className="mt-5 flex rounded-xl border border-border bg-background p-1 text-xs"><span className="flex-1 rounded-lg bg-card px-2 py-2 text-center font-medium shadow-sm">Forecast</span><span className="flex-1 px-2 py-2 text-center text-muted-foreground">Step by Step</span><span className="flex-1 px-2 py-2 text-center text-muted-foreground">Low Point</span></div>
    <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5 text-primary"><span className="w-4 border-t border-dashed border-primary" />Projected</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[oklch(var(--fs-amber))]" />Today</span><span className="ml-auto flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-[oklch(var(--fs-amber))]" />Safety buffer</span></div>
    <svg className="mt-2 h-40 w-full" viewBox="0 0 600 180" role="img" aria-label="Projected balance area chart"><defs><linearGradient id="featureForecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D4754A" stopOpacity=".22"/><stop offset="1" stopColor="#D4754A" stopOpacity=".02"/></linearGradient></defs>{[35,85,135].map((y) => <line key={y} x1="34" x2="590" y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray="3 5" />)}<line x1="34" x2="590" y1="128" y2="128" stroke="#CA8A04" strokeDasharray="6 5"/><path d="M34 48 C85 48 108 54 138 76 S184 128 232 133 S310 141 362 145 S410 151 438 150 S466 142 486 90 S512 45 545 47 S570 54 590 58 L590 160 L34 160 Z" fill="url(#featureForecastFill)"/><path d="M34 48 C85 48 108 54 138 76 S184 128 232 133 S310 141 362 145 S410 151 438 150 S466 142 486 90 S512 45 545 47 S570 54 590 58" fill="none" stroke="#D4754A" strokeWidth="3" strokeDasharray="7 5"/><circle cx="438" cy="150" r="5" fill="#B44455" stroke="white" strokeWidth="3"/><text x="34" y="176" fontSize="10" fill="#6B7280">Today</text><text x="408" y="176" fontSize="10" fill="#6B7280">Aug 15</text><text x="552" y="176" fontSize="10" fill="#6B7280">Aug 30</text></svg>
    <div className="mt-2 flex items-center justify-between border-t border-border pt-3"><span className="text-xs text-muted-foreground">Projected low</span><span className="font-mono text-sm font-semibold">$1,530 · Aug 15</span></div>
  </div>
}

function EvidencePreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-center justify-between"><p className="text-sm font-semibold">Show your work</p><span className="text-primary">⌄</span></div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Safe to Spend uses the lowest balance in your 30-day forecast, then protects your safety buffer.</p><div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-3"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Lowest projected balance</span><span className="font-mono">$1,530</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Protected safety buffer</span><span className="font-mono">−$500</span></div><div className="flex justify-between border-t border-border pt-2 text-xs font-semibold"><span>Safe to Spend</span><span className="font-mono text-primary">$1,030</span></div></div><p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Included events</p><div className="grid grid-cols-2 gap-2"><div className="rounded-lg border border-border p-3"><p className="font-mono text-lg font-bold">7</p><p className="text-[10px] text-muted-foreground">Confirmed</p></div><div className="rounded-lg border border-border p-3"><p className="font-mono text-lg font-bold">1</p><p className="text-[10px] text-muted-foreground">Estimated</p><span className="mt-1 inline-flex text-[10px] text-primary">Learn why</span></div></div>
  </div>
}

function ImportPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Connection-free import</p><h3 className="mt-1 text-lg font-semibold">Review transactions</h3></div><FileSpreadsheet className="h-5 w-5 text-primary" /></div><p className="mt-4 text-sm font-medium">Here&apos;s what we found</p><p className="mt-1 text-xs text-muted-foreground">142 transactions · Jan 16 – Jul 22 · 89 spending · 53 income</p><div className="mt-4 overflow-hidden rounded-xl border border-border"><div className="grid grid-cols-[65px_1fr_78px] bg-muted/40 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"><span>Date</span><span>Description</span><span className="text-right">Amount</span></div>{[["Jul 22", "Northstar Payroll", "+$2,400"], ["Jul 21", "Harbor View Rent", "−$1,650"], ["Jul 20", "City Power", "−$118"]].map(([date, name, amount]) => <div key={name} className="grid grid-cols-[65px_1fr_78px] border-t border-border px-3 py-3 text-xs"><span className="text-muted-foreground">{date}</span><span className="truncate font-medium">{name}</span><span className="text-right font-mono">{amount}</span></div>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-3 text-[10px] text-muted-foreground"><span>Wrong file? Choose another</span><span>Fix mapping</span></div><span className="rounded-lg bg-primary px-3 py-2 text-[10px] font-medium text-white">Looks right — import</span></div>
  </div>
}

function CardFlowPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Credit card cash timing</p><div className="mt-3 rounded-lg border border-border p-4 text-xs"><div className="flex justify-between gap-3"><span className="font-medium">Amex payment</span><span className="font-mono">−$720</span></div><p className="mt-1 text-muted-foreground">Statement balance · due Aug 18 from Everyday checking.</p></div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Credit card purchases explain what you spent. The card payment is when cash actually leaves your account.</p><span className="mt-2 inline-flex text-[10px] text-primary">Learn why</span><div className="mt-5 border-t border-border pt-5"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Transfers between your accounts</p><div className="mt-3 rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium">Everyday checking → Amex</p><p className="mt-1 text-[10px] text-muted-foreground">Matching $720 entries · Aug 18</p></div><span className="rounded-full bg-[oklch(var(--fs-green-bg))] px-2 py-1 text-[9px] font-medium text-[oklch(var(--fs-green))]">LINKED</span></div></div></div>
  </div>
}

function ScenarioPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="space-y-4"><div className="rounded-2xl border border-border p-4"><p className="text-sm font-semibold">What are you considering?</p><div className="mt-4 grid gap-3 sm:grid-cols-[1.25fr_.75fr_.8fr]"><div><span className="block text-[10px] text-muted-foreground">Purchase</span><div className="mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-xs">New laptop</div></div><div><span className="block text-[10px] text-muted-foreground">Purchase amount</span><div className="mt-1 rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-xs">$1,250</div></div><div><span className="block text-[10px] text-muted-foreground">When?</span><div className="mt-1 rounded-lg border border-input bg-background px-3 py-2.5 text-xs">Aug 15</div></div></div><div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Your safety buffer</p><p className="font-mono text-xs font-semibold">$500 protected</p></div></div><div className="rounded-2xl border border-border p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Private what-if · Aug 15</p><p className="mt-1 text-sm font-semibold">New laptop · −$1,250</p></div><span className="rounded-full bg-[oklch(var(--fs-amber-bg))] px-2.5 py-1 text-[9px] font-medium text-[oklch(var(--fs-amber))]">WATCH</span></div><div className="mt-4 rounded-xl bg-muted/45 p-3.5"><p className="font-mono text-[9px] uppercase tracking-wider text-primary">Your answer</p><p className="mt-1.5 text-xs font-semibold">This purchase leaves little room above your buffer.</p></div><svg className="mt-4 h-28 w-full" viewBox="0 0 420 112"><path d="M6 26 C76 27 110 38 150 58 S230 70 268 78 S328 60 414 36" fill="none" stroke="#625852" strokeWidth="2" strokeDasharray="6 5"/><path d="M6 26 C76 27 110 44 150 70 S230 84 268 91 S328 70 414 44" fill="none" stroke="#D4754A" strokeWidth="3"/><line x1="0" x2="420" y1="82" y2="82" stroke="#CA8A04" strokeDasharray="5 4"/><circle cx="268" cy="91" r="5" fill="#D4754A" stroke="white" strokeWidth="2"/></svg><div className="grid grid-cols-3 gap-4 border-t border-border pt-3 text-[9px]"><span>Lowest after purchase<br/><b className="mt-1 inline-block font-mono text-xs text-foreground">$680</b></span><span>Purchase impact<br/><b className="mt-1 inline-block font-mono text-xs text-foreground">−$850</b></span><span>Room remaining<br/><b className="mt-1 inline-block font-mono text-xs text-[oklch(var(--fs-amber))]">$180</b></span></div></div></div>
  </div>
}

function RecurringPreview() {
  const items: [string, "bill" | "income", string, string, "confirmed" | "estimated"][] = [
    ["Harbor View Rent", "bill", "Monthly", "−$1,650", "confirmed"],
    ["Northstar Payroll", "income", "Biweekly", "+$2,400", "confirmed"],
    ["City Power", "bill", "Monthly", "≈ −$118", "estimated"],
  ]
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Recurring</p><p className="mt-2 text-sm font-semibold text-foreground">3 active · found from your CSV</p></div><span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">Next 30d: +$632 net</span></div>
    <div className="mt-5 space-y-2">
      {items.map(([name, type, frequency, amount, confidence]) => <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border px-3.5 py-3">
        <div><p className="text-sm font-medium text-foreground">{name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{frequency} · {type === "income" ? "Income" : "Bill"} · {confidence === "estimated" ? "Estimated" : "CSV pattern"}</p></div>
        <span className={`font-mono text-sm font-semibold ${type === "income" ? "text-accent" : "text-foreground"}`}>{amount}</span>
      </div>)}
    </div>
    <p className="mt-4 text-xs text-muted-foreground">Detected automatically. Pause anything that shouldn&apos;t count.</p>
  </div>
}

function AccountsPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Accounts</p><p className="mt-1 text-[10px] text-muted-foreground">Keep liquid balances current.</p></div><span className="rounded-lg bg-primary px-2.5 py-2 text-[9px] font-medium text-white">+ Add account</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-border p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10"><BriefcaseBusiness className="h-4 w-4 text-primary"/></div><p className="mt-3 text-sm font-semibold">Everyday checking</p><p className="mt-1 text-[10px] capitalize text-muted-foreground">Checking · CSV import</p><p className="mt-1 text-[9px] text-muted-foreground">142 transactions</p><p className="mt-3 font-mono text-xl font-bold text-foreground">$2,740.00</p><p className="mt-1 text-[10px] text-muted-foreground">Balance as of Jul 24, 2026</p></div>
      <div className="rounded-xl border border-border p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10"><ArrowLeftRight className="h-4 w-4 text-primary"/></div><p className="mt-3 text-sm font-semibold">Amex</p><p className="mt-1 text-[10px] capitalize text-muted-foreground">Credit card · CSV import</p><p className="mt-1 text-[9px] text-muted-foreground">38 transactions</p><p className="mt-3 font-mono text-xl font-bold text-foreground">$720.00 owed</p><p className="mt-1 text-[10px] text-muted-foreground">Balance as of Jul 24, 2026</p><p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-[9px] text-muted-foreground">Payment due day 18 · estimate improves with card activity</p></div>
    </div>
  </div>
}

function StateSystemPreview() {
  const states: [string, string, string][] = [
    ["CLEAR", "border-[oklch(var(--fs-green))]/30 bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]", "On track for the next 30 days."],
    ["WATCH", "border-[oklch(var(--fs-amber))]/30 bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]", "A low point on Aug 6 is worth a look."],
    ["TIGHT", "border-[oklch(var(--fs-red))]/30 bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]", "Your buffer breaks on Aug 12 unless something changes."],
    ["UPDATE NEEDED", "border-muted-foreground/25 bg-muted/60 text-muted-foreground", "Refresh an older balance before relying on the forecast."],
  ]
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">The state system</p>
    <div className="mt-5 space-y-2.5">
      {states.map(([label, tone, copy]) => <div key={label} className={`rounded-2xl border p-3.5 ${tone}`}><p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]">{label}</p><p className="mt-1 text-sm font-medium">{copy}</p></div>)}
    </div>
  </div>
}

function TransactionsPreview() {
  const rows = [
    { name: "Market Basket", category: "Groceries", amount: "−$60", icon: ShoppingBasket, tone: "bg-primary/[0.12] text-primary" },
    { name: "Corner Bakery invoice", category: "Variable / side income", amount: "+$850", icon: BriefcaseBusiness, tone: "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]" },
    { name: "Amex payment", category: "Transfer in", amount: "+$720", icon: ArrowLeftRight, tone: "bg-[oklch(var(--fs-transfer-bg))] text-[oklch(var(--fs-transfer))]" },
  ]
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div><p className="text-sm font-semibold">Recent activity</p><p className="mt-1 text-[10px] text-muted-foreground">Showing 3 transactions on this page.</p></div><div className="mt-4 overflow-hidden rounded-xl border border-border"><div className="grid grid-cols-[1fr_124px_68px_88px] bg-muted/45 px-3 py-2.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground"><span>Description</span><span>Category</span><span className="text-right">Amount</span><span className="text-right">Account</span></div>{rows.map(({ name, category, amount, icon: Icon, tone }) => <div key={name} className="grid grid-cols-[1fr_124px_68px_88px] items-center border-t border-border px-3 py-3 text-[10px]"><div className="flex min-w-0 items-center gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-medium">{name}</p><p className="mt-0.5 text-[8px] text-muted-foreground">Aug 10, 2026</p></div></div><span className="w-fit rounded-lg bg-muted px-2 py-1.5 text-[8px] text-muted-foreground">{category}</span><span className="text-right font-mono">{amount}</span><span className="text-right text-[8px] text-muted-foreground">Everyday checking</span></div>)}</div><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Categories organise activity and support spending context. They do not create a budget, spending limit, or envelope.</p></div>
}

function BringNumbersPreview() {
  const logic = ["Direction", "Description", "Safe fallback", "Your correction"]
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Connection-free import</p><h3 className="mt-1 text-base font-semibold">Here&apos;s what we found</h3><p className="mt-1 text-[10px] text-muted-foreground">142 transactions · Jan 16 – Jul 22 · 89 spending · 53 income</p></div><FileSpreadsheet className="h-5 w-5 text-primary" /></div><div className="mt-4 overflow-hidden rounded-xl border border-border"><div className="grid grid-cols-[1fr_126px_76px] bg-muted/40 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"><span>Description</span><span>Category</span><span className="text-right">Amount</span></div><div className="grid grid-cols-[1fr_126px_76px] items-center border-t border-border px-3 py-3 text-xs"><div className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/[0.12] text-primary"><ShoppingBasket className="h-3.5 w-3.5" /></span><span className="truncate font-medium">Market Basket</span></div><span className="w-fit rounded-full bg-primary/[0.08] px-2 py-1 text-[9px] text-primary">Groceries</span><span className="text-right font-mono">−$60</span></div><div className="grid grid-cols-[1fr_126px_76px] items-center border-t border-border px-3 py-3 text-xs"><div className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]"><BriefcaseBusiness className="h-3.5 w-3.5" /></span><span className="truncate font-medium">Corner Bakery invoice</span></div><span className="w-fit rounded-full bg-[oklch(var(--fs-green-bg))] px-2 py-1 text-[9px] text-[oklch(var(--fs-green))]">Side income</span><span className="text-right font-mono">+$850</span></div></div><div className="mt-4 flex flex-col items-stretch gap-1.5 text-center sm:flex-row sm:items-center">{logic.map((label, index) => <div key={label} className="contents"><span className={`flex-1 rounded-lg px-2 py-2 text-[9px] ${index === logic.length - 1 ? "bg-primary/[0.08] text-primary" : "bg-muted/60"}`}>{label}</span>{index < logic.length - 1 && <ArrowRight className="mx-auto h-3.5 w-3.5 rotate-90 text-primary/55 sm:rotate-0" aria-hidden="true" />}</div>)}</div><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Cusp suggests; you decide. Exact-description corrections are remembered for matching activity, while categories remain organisation—not budgets.</p></div>
}

function AttentionPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Needs your attention</p><div className="mt-4 space-y-2"><div className="rounded-xl border border-[oklch(var(--fs-amber))]/25 bg-[oklch(var(--fs-amber-bg))] p-4"><p className="text-xs font-semibold">Your balance may approach your safety buffer</p><p className="mt-1 text-[10px] text-muted-foreground">The forecast reaches $1,530 on August 15.</p></div><div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold">City Power is still estimated</p><p className="mt-1 text-[10px] text-muted-foreground">Review the $118 amount when you know more.</p></div><div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold">Your current balance needs an update</p><p className="mt-1 text-[10px] text-muted-foreground">Refresh the account balance before relying on Safe to Spend.</p></div></div><p className="mt-4 text-[10px] text-muted-foreground">Choose which alert types matter and how many days ahead Cusp should surface them.</p></div>
}

function ControlsPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Preferences and data</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold">Forecast preferences</p><div className="mt-3 space-y-2 text-[10px] text-muted-foreground"><div className="flex justify-between"><span>Safety buffer</span><b className="font-mono text-foreground">$500</b></div><div className="flex justify-between"><span>Dashboard emphasis</span><b className="text-foreground">Status first</b></div><div className="flex justify-between"><span>Information density</span><b className="text-foreground">Comfortable</b></div><div className="flex justify-between"><span>Spending history</span><b className="text-foreground">Off</b></div></div></div><div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold">Your data</p><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Download a copy of your information whenever you like, or permanently remove your financial data.</p><div className="mt-4 flex gap-2"><span className="rounded-lg border border-border px-2.5 py-2 text-[9px]">Download my data</span><span className="rounded-lg border border-destructive/25 px-2.5 py-2 text-[9px] text-destructive">Delete financial data</span></div></div></div></div>
}

function EnginePreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">What Cusp found</p><p className="mt-1 text-sm font-semibold">Activity, patterns, and cash movement</p></div>
      <span className="rounded-full border border-border bg-muted/55 px-2.5 py-1 text-[9px] text-muted-foreground">Review stays in your hands</span>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center gap-2"><Tags className="h-4 w-4 text-primary"/><p className="text-xs font-semibold">Categorises activity</p></div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-[10px]"><span className="truncate">Market Basket</span><span className="rounded-full bg-primary/[0.08] px-2 py-1 text-primary">Groceries</span></div>
          <div className="flex items-center justify-between gap-3 text-[10px]"><span className="truncate">Corner Bakery invoice</span><span className="rounded-full bg-[oklch(var(--fs-green-bg))] px-2 py-1 text-[oklch(var(--fs-green))]">Side income</span></div>
          <div className="flex items-center justify-between gap-3 text-[10px]"><span className="truncate">Unfamiliar deposit</span><span className="rounded-full bg-[oklch(var(--fs-amber-bg))] px-2 py-1 text-[oklch(var(--fs-amber))]">Needs review</span></div>
        </div>
      </div>
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center gap-2"><Repeat2 className="h-4 w-4 text-primary"/><p className="text-xs font-semibold">Recognises what repeats</p></div>
        <div className="mt-3 space-y-2 text-[10px]"><div className="flex justify-between"><span>Harbor View Rent</span><b className="font-mono">−$1,650</b></div><div className="flex justify-between text-muted-foreground"><span>Monthly · CSV pattern</span><span className="text-[oklch(var(--fs-green))]">Confirmed</span></div><div className="border-t border-border pt-2"><div className="flex justify-between"><span>City Power</span><b className="font-mono">≈ −$118</b></div><div className="mt-1 flex justify-between text-muted-foreground"><span>$82–$148 observed</span><span className="text-[oklch(var(--fs-amber))]">Estimated</span></div></div></div>
      </div>
      <div className="rounded-xl border border-border p-4 sm:col-span-2">
        <div className="flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-primary"/><p className="text-xs font-semibold">Separates spending from moving cash</p></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div className="rounded-lg bg-muted/45 p-3"><p className="text-[10px] font-medium">Amex purchases</p><p className="mt-1 text-[9px] text-muted-foreground">Explain what was spent</p></div><ArrowRight className="mx-auto h-4 w-4 rotate-90 text-primary/60 sm:rotate-0"/><div className="rounded-lg bg-muted/45 p-3"><div className="flex justify-between gap-2"><p className="text-[10px] font-medium">Payment due Aug 18</p><b className="font-mono text-[10px]">−$720</b></div><p className="mt-1 text-[9px] text-muted-foreground">One checking cash event · transfer reviewed</p></div></div>
      </div>
    </div>
    <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">Direction comes first, focused description rules suggest context, and unclear items stay visible for review. Your exact-description corrections take priority next time.</p>
  </div>
}

function StartingPointPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4"><Upload className="h-4 w-4 text-primary"/><p className="mt-3 text-xs font-semibold">Import a CSV</p><p className="mt-1 text-[10px] text-muted-foreground">Automatic detection with review before save.</p></div><div className="rounded-xl border border-border p-4"><ListTree className="h-4 w-4 text-primary"/><p className="mt-3 text-xs font-semibold">Enter it manually</p><p className="mt-1 text-[10px] text-muted-foreground">Start with balances, income, and known bills.</p></div><div className="rounded-xl border border-dashed border-border bg-muted/35 p-4"><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Future</span><p className="mt-3 text-xs font-semibold">Connect an account</p><p className="mt-1 text-[10px] text-muted-foreground">Not available in the current beta.</p></div></div></div>
}

function FoundPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-primary">What Cusp found</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-muted/45 p-3"><b className="font-mono text-lg">142</b><p className="text-[9px] text-muted-foreground">Transactions</p></div><div className="rounded-xl bg-muted/45 p-3"><b className="font-mono text-lg">89</b><p className="text-[9px] text-muted-foreground">Spending</p></div><div className="rounded-xl bg-muted/45 p-3"><b className="font-mono text-lg">53</b><p className="text-[9px] text-muted-foreground">Money in</p></div></div><p className="mt-3 text-[10px] text-muted-foreground">Jan 16 – Jul 22 · 1 row needs attention</p></div>
}

function ReviewCorrectionPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="rounded-xl border border-[oklch(var(--fs-amber))]/20 bg-[oklch(var(--fs-amber-bg))] px-3 py-2.5 text-[10px]"><b>1 money-in transaction needs review.</b> Use the highlighted category menu to tell Cusp what the payment represents.</div><div className="mt-4 grid grid-cols-[1fr_150px_74px] items-center gap-3 rounded-xl border border-border p-4"><div><p className="text-xs font-medium">Corner Bakery invoice</p><p className="mt-1 text-[9px] text-[oklch(var(--fs-amber))]">Aug 10, 2026 · needs review</p></div><div className="rounded-lg border border-primary/30 bg-background px-3 py-2 text-[9px] text-primary">Variable / side income ▾</div><b className="text-right font-mono text-xs text-[oklch(var(--fs-green))]">+$850</b></div><p className="mt-3 text-[9px] text-muted-foreground">Account: Everyday checking · Source: Manual</p></div>
}

function TransferPreview() {
  return <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border p-4"><div className="flex items-start gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10"><ArrowLeftRight className="h-4 w-4 text-primary"/></span><div><p className="text-xs font-semibold">Transfers between your accounts</p><p className="mt-1 text-[9px] text-muted-foreground">A transfer moves money but is not new income or new spending.</p></div></div></div><div className="p-4"><div className="flex justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-wider text-primary">Likely transfer · Aug 18</p><div className="mt-3 flex items-center gap-2 text-[10px] font-medium"><span className="rounded-lg border border-transparent px-2 py-1">Everyday checking</span><ArrowRight className="h-3.5 w-3.5 text-muted-foreground"/><span className="rounded-lg border border-transparent px-2 py-1">Amex</span><b className="font-mono">$720.00</b></div><p className="mt-2 text-[9px] text-muted-foreground">Card payment ↔ Payment received</p><p className="mt-2 text-[9px] text-muted-foreground">Same amount on adjacent days. Is this money moving between your own accounts?</p></div><div className="flex shrink-0 flex-col gap-2"><span className="rounded-lg bg-primary px-2.5 py-2 text-center text-[9px] font-medium text-white">✓ Yes, link</span><span className="rounded-lg border border-border px-2.5 py-2 text-center text-[9px]">Not a transfer</span></div></div></div></div>
}

function SafeToSpendPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Safe to Spend</p><p className="mt-3 font-mono text-3xl font-semibold text-[oklch(var(--fs-green))]">$1,030</p><p className="mt-2 text-xs text-muted-foreground">Available today while protecting your plan through Sep 8.</p><div className="mt-4 rounded-xl bg-muted/45 p-3 text-[10px]"><div className="flex justify-between"><span>Lowest projected balance</span><b className="font-mono">$1,530</b></div><div className="mt-2 flex justify-between"><span>Safety buffer</span><b className="font-mono">−$500</b></div></div></div>
}

function BufferPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Safety buffer</p><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold">$500 protected</p><p className="mt-1 text-[10px] text-muted-foreground">Your personal floor, not a budget.</p></div><span className="text-[10px] text-primary">Adjust →</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-[oklch(var(--fs-green))]"/></div><div className="mt-2 flex justify-between text-[9px] text-muted-foreground"><span>Projected low $1,530</span><span>Buffer intact</span></div></div>
}

function CardTimelinePreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Credit card cash timing</p><div className="mt-4 rounded-lg border border-border p-4 text-xs"><div className="flex justify-between gap-3"><span className="font-medium">Amex payment</span><span className="font-mono">−$720.00</span></div><p className="mt-1 text-muted-foreground">Full statement balance · due Aug 18 from Everyday checking.</p></div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Credit card purchases explain what you spent. The card payment is when cash actually leaves your account.</p><span className="mt-2 inline-flex text-[10px] text-primary">Learn why</span></div>
}

function ReconciliationPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><div><p className="text-sm font-semibold">Needs review</p><p className="mt-1 text-[10px] text-muted-foreground">This pattern may match something already in your forecast.</p></div><div className="mt-4 rounded-xl border border-border p-4"><div className="grid gap-3 sm:grid-cols-2"><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">From this CSV</p><p className="mt-1 text-xs">Harbor View Rent <span className="font-mono text-muted-foreground">−$1,650</span></p></div><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Already in Cusp</p><p className="mt-1 text-xs">Monthly rent <span className="font-mono text-muted-foreground">−$1,650</span></p></div></div><p className="mt-3 text-[10px] text-muted-foreground">The amount and monthly cadence closely match.</p><div className="mt-3 grid grid-cols-3 gap-2"><span className="rounded-lg border border-primary bg-primary/[0.06] px-2 py-2 text-center text-[9px] text-primary">Replace existing</span><span className="rounded-lg border border-border px-2 py-2 text-center text-[9px]">Keep existing</span><span className="rounded-lg border border-border px-2 py-2 text-center text-[9px]">Keep both</span></div></div></div>
}

function UndoPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5 text-center"><p className="text-sm font-semibold">Your transactions are ready</p><p className="mx-auto mt-2 max-w-sm text-[10px] leading-relaxed text-muted-foreground">The CSV pattern replaced your previous rent estimate. Other reviewed patterns were left unchanged.</p><div className="mt-5 flex justify-center gap-2"><span className="rounded-lg border border-border px-3 py-2 text-[10px] font-medium">↶ Undo replacements</span><span className="rounded-lg bg-primary px-3 py-2 text-[10px] font-medium text-white">Done</span></div><p className="mt-3 text-[9px] text-muted-foreground">Only the affected replacement is restored.</p></div>
}

function IncomePatternPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-primary">Income pattern</p><p className="mt-2 text-sm font-semibold">How does money usually come in?</p><p className="mt-1 text-[10px] text-muted-foreground">This changes how Cusp asks about upcoming income.</p><div className="mt-4 space-y-2">{["Regular paycheck", "Variable or irregular income", "A mix of both"].map((label, index) => <div key={label} className={`rounded-xl border px-4 py-3 text-xs font-medium ${index === 2 ? "border-primary bg-primary/[0.08]" : "border-border"}`}>{label}</div>)}</div></div>
}

function TrackRecordPreview() {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm font-semibold">Forecast track record</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Compares earlier forecasts with later actual balances. Days without enough refreshed account data are not scored.</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-muted/50 p-3"><p className="font-mono text-lg font-bold">12</p><p className="text-[10px] text-muted-foreground">Evaluated days</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="font-mono text-lg font-bold">$86</p><p className="text-[10px] text-muted-foreground">Typical absolute error</p></div></div><p className="mt-3 text-[10px] text-muted-foreground">Latest evaluation: projected $2,740 and observed $2,690 on Aug 10.</p></div>
}

function TroubleshootingPreview() {
  const checks = [["Start with the current balance", "Refresh an older anchor and date."], ["Look for missing activity", "Check paused patterns, cash spending, and unimported accounts."], ["Check transfers and card payments", "Review an unmatched pair before treating it as spending or income."], ["Review the assumptions", "Open confirmed, estimated, and freshness evidence."]]
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-primary">Why does my forecast look wrong?</p><div className="mt-4 space-y-2">{checks.map(([title, detail], index) => <div key={title} className="flex gap-3 rounded-xl border border-border p-3"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[9px] text-primary">{index + 1}</span><div><p className="text-[10px] font-semibold">{title}</p><p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">{detail}</p></div></div>)}</div><span className="mt-3 inline-flex text-[10px] text-primary">Open troubleshooting guide →</span></div>
}

const chapters = [
  {
    eyebrow: "01 · Bring in your numbers",
    icon: <Upload className="h-4 w-4" />,
    title: "Start manually or with a connection-free import.",
    copy: "Use the information you already have. Manual setup and CSV import are available now; connected accounts belong to a later phase and are clearly labelled as future.",
    details: ["Manual entry", "CSV import", "Bank connection · future"],
    preview: <StartingPointPreview />,
  },
  {
    eyebrow: "02 · What Cusp found",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    title: "Check the file before anything is saved.",
    copy: "Cusp summarizes the transaction count, date range, money in, spending, and rows that need attention so the user can quickly tell whether the import looks right.",
    details: ["Date-range check", "Direction counts", "Missing-row explanations"],
    preview: <FoundPreview />,
  },
  {
    eyebrow: "03 · CSV reconciliation",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    title: "Resolve overlap instead of silently duplicating it.",
    copy: "When an imported pattern resembles something already in the forecast, Cusp puts the two pieces of evidence side by side and asks whether to replace the existing item, keep it, or retain both.",
    details: ["From CSV versus already in Cusp", "Replace · Keep · Both", "No silent overwrite"],
    preview: <ReconciliationPreview />,
  },
  {
    eyebrow: "04 · Reconciliation undo",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    title: "Reverse an individual replacement without rolling back the import.",
    copy: "Cusp keeps the replacement relationship long enough to restore the previous recurring item and remove its replacement. The rest of the imported activity stays intact.",
    details: ["Granular replacement undo", "Previous item restored", "Other imports remain intact"],
    preview: <UndoPreview />,
  },
  {
    eyebrow: "05 · Income pattern",
    icon: <BriefcaseBusiness className="h-4 w-4" />,
    title: "Describe how income really arrives.",
    copy: "Regular paycheck, variable income, or a mix of both is a dedicated setup decision. It keeps Cusp useful for salaried, freelance, gig, and mixed-income households without pretending every deposit follows one cadence.",
    details: ["Regular paycheck", "Variable or irregular", "A mix of both"],
    preview: <IncomePatternPreview />,
  },
  {
    eyebrow: "06 · Accounts",
    icon: <BriefcaseBusiness className="h-4 w-4" />,
    title: "See what you own and what you owe.",
    copy: "Checking, savings, and credit-card accounts stay separate, each with its own balance and freshness date. That distinction is what lets Cusp model cash and liabilities honestly.",
    details: ["Cash accounts", "Credit-card balances", "Balance as-of dates"],
    preview: <AccountsPreview />,
  },
  {
    eyebrow: "07 · Categorisation",
    icon: <Tags className="h-4 w-4" />,
    title: "Give activity useful context without turning it into a budget.",
    copy: "Cusp reads direction first, then focused description signals. Unclear spending stays Other; unclear money in stays Income — needs review. Categories organize the record rather than imposing limits.",
    details: ["Separate money-in and money-out lists", "Focused keyword suggestions", "Honest fallbacks"],
    preview: <TransactionsPreview />,
  },
  {
    eyebrow: "08 · Inline correction",
    icon: <ListTree className="h-4 w-4" />,
    title: "Correct a transaction where the mistake appears.",
    copy: "Users can change the type or category without leaving Activity. The correction is scoped to the same normalized description and direction, avoiding unsafe merchant-wide rules.",
    details: ["Edit in place", "Direction-aware choices", "Scoped correction memory"],
    preview: <ReviewCorrectionPreview />,
  },
  {
    eyebrow: "09 · Transfer linking",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    title: "Move money without counting it twice.",
    copy: "Matching entries across accounts become a possible transfer, not automatic income and spending. Cusp shows the evidence and keeps confirmation, rejection, and undo available.",
    details: ["Cross-account matching", "Evidence before confirmation", "Reversible decisions"],
    preview: <TransferPreview />,
  },
  {
    eyebrow: "10 · Recurring patterns",
    icon: <Repeat2 className="h-4 w-4" />,
    title: "Turn history into the activity coming next.",
    copy: "Recurring income and bills stay editable. Stable reviewed patterns can be confirmed, while variable amounts retain their evidence and remain estimated.",
    details: ["Confirmed and estimated labels", "Calendar-aware cadence", "List and calendar management"],
    preview: <RecurringPreview />,
  },
  {
    eyebrow: "11 · Forecast briefing",
    icon: <Gauge className="h-4 w-4" />,
    title: "Start with the few moments that matter today.",
    copy: "The Dashboard gives a concise forward-looking briefing: where things stand, the next important event, the projected low, and the runway toward recovery.",
    details: ["Opening balance", "Next important event", "Cash-flow runway"],
    preview: <HeroGlancePreview />,
  },
  {
    eyebrow: "12 · Safe to Spend",
    icon: <ShoppingBasket className="h-4 w-4" />,
    title: "Know what is genuinely spare—not just what is in the account.",
    copy: "Safe to Spend starts from the lowest projected balance in the selected forecast window and subtracts the protected safety buffer.",
    details: ["Lowest-balance based", "Buffer protected", "Expandable calculation"],
    preview: <SafeToSpendPreview />,
  },
  {
    eyebrow: "13 · Safety buffer",
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Protect a personal floor without creating a budget.",
    copy: "The safety buffer is a cushion the user chooses. Cusp shows whether it remains intact, is partly consumed, or is breached—and handles an intentional $0 separately from an unfinished setup.",
    details: ["User-defined cushion", "Three buffer outcomes", "Explicit configured-at-$0 state"],
    preview: <BufferPreview />,
  },
  {
    eyebrow: "14 · State system",
    icon: <BellRing className="h-4 w-4" />,
    title: "Read the forecast condition before reading every number.",
    copy: "Clear, Watch, Tight, and Update Needed use the same meanings across the Dashboard, Forecast, and Scenario Planner.",
    details: ["Clear", "Watch", "Tight · Update Needed"],
    preview: <StateSystemPreview />,
  },
  {
    eyebrow: "15 · Forecast workspace",
    icon: <Gauge className="h-4 w-4" />,
    title: "Inspect 30, 60, or 90 days from three angles.",
    copy: "Use the projected chart for shape, Step by Step for daily movement, and Low Point for the event sequence behind the tightest moment. Show Your Work keeps the arithmetic visible.",
    details: ["30, 60, and 90 days", "Forecast · Step by Step · Low Point", "Show Your Work"],
    preview: <div className="space-y-3"><ForecastPreview /><EvidencePreview /></div>,
  },
  {
    eyebrow: "16 · Forecast track record",
    icon: <Gauge className="h-4 w-4" />,
    title: "Compare earlier projections with later actual balances.",
    copy: "Cusp measures only dates where a prior forecast exists and every active account has a refreshed balance observation. It reports the number of evaluated days and the typical absolute error rather than claiming accuracy without evidence.",
    details: ["Eligible days only", "Typical absolute error", "Latest projected versus observed"],
    preview: <TrackRecordPreview />,
  },
  {
    eyebrow: "17 · Forecast troubleshooting",
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Explain a surprising forecast before asking for trust.",
    copy: "The troubleshooting flow checks stale balances, missing activity, paused or unconfirmed patterns, estimates, transfers, and card-payment matching—the common reasons an otherwise-correct calculation can look wrong.",
    details: ["Freshness", "Missing activity", "Assumptions and matching"],
    preview: <TroubleshootingPreview />,
  },
  {
    eyebrow: "18 · Scenario Planner",
    icon: <GitBranch className="h-4 w-4" />,
    title: "Test a decision without changing the real forecast.",
    copy: "Choose a purchase, amount, and date; compare it with the baseline; and see the low point, remaining room, and a clearer date when one exists.",
    details: ["Private what-if", "Baseline comparison", "Clearer-date search"],
    preview: <ScenarioPreview />,
  },
  {
    eyebrow: "19 · Credit-card cash timing",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    title: "Separate when spending happens from when cash leaves.",
    copy: "Card purchases explain the spending. The statement cycle gathers those charges, and one estimated payment event shows when cash is expected to leave checking.",
    details: ["Purchases on the card", "Statement-cycle timing", "Estimated checking payment"],
    preview: <CardTimelinePreview />,
  },
]

export default async function FeaturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <main className="fs-landing min-h-screen overflow-hidden bg-background text-foreground">
    <MarketingHeader signedIn={Boolean(user)} />
    <section className="fs-features-hero relative overflow-hidden px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl text-center">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-primary">Inside Cusp</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-[32px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[46px]">One forecast. <em className="font-serif font-normal text-primary">Every answer in context.</em></h1>
        <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-8 text-muted-foreground">Cusp brings your balances, recurring activity, card timing, and decisions into one forward-looking system—then shows the work behind it.</p>
        <div className="mx-auto mt-12 max-w-4xl"><HeroGlancePreview showRunway={false} /></div>
      </div>
    </section>

    <div>
      {chapters.map((chapter, index) => {
        const field = index < 6 ? "fs-features-field-paper" : index < 10 ? "fs-features-field-clay" : index < 16 ? "fs-features-field-soft" : "fs-features-field-deep"
        const chapterStart = index === 0 || index === 6 || index === 10 || index === 16
        return <section key={chapter.eyebrow} className={`${field} px-5`}>
          <div className={`relative mx-auto grid max-w-6xl items-center gap-8 py-14 lg:grid-cols-2 lg:gap-16 ${!chapterStart ? "border-t border-border/70" : ""} ${index % 2 ? "" : "lg:[&>*:first-child]:order-2"}`}>
            <div>{chapter.preview}</div>
            <div className="max-w-xl"><div className="inline-flex items-center gap-2 text-primary"><span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/20 bg-card/80" aria-hidden="true">{chapter.icon}</span><p className="font-mono text-[11px] uppercase tracking-[0.16em]">{chapter.eyebrow}</p></div><h2 className="mt-4 text-2xl font-medium leading-tight tracking-tight sm:text-[30px]">{chapter.title}</h2><p className="mt-4 text-[15px] leading-7 text-muted-foreground">{chapter.copy}</p><ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{chapter.details.map((detail) => <li key={detail} className="flex items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"/><span>{detail}</span></li>)}</ul></div>
          </div>
        </section>
      })}
    </div>

    <section className="fs-clay-field px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl rounded-[30px] border border-border bg-card/90 p-10 shadow-[0_24px_80px_rgba(67,45,35,0.08)] sm:flex sm:items-center sm:justify-between sm:p-16">
        <div className="max-w-xl"><span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />No bank connection required</span><h2 className="mt-4 text-2xl font-medium leading-tight tracking-tight sm:text-[30px]">See what your money does next.</h2><p className="mt-3 leading-7 text-muted-foreground">Build a forecast manually or from a CSV, then review every event before it becomes part of your plan.</p></div>
        <Link href={user ? "/app/dashboard" : "/sign-up"} className="fs-brand-action mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium sm:mt-0">{user ? "Open dashboard" : "Get early access"}<ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  </main>
}
