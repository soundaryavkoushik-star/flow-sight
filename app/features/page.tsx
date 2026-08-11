import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, FileSpreadsheet, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const forecastSteps = [
  ["Opening balance", "$3,840"],
  ["Rent · confirmed", "−$1,650"],
  ["Insurance · confirmed", "−$180"],
  ["Projected low · Aug 6", "$2,010"],
]

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
  return <div className="fs-layered-card rounded-[26px] p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">30-day forecast</p><p className="mt-2 text-lg font-medium">Watch · low point ahead</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-800">WATCH</span></div>
    <div className="mt-7 flex h-28 items-end gap-1.5" aria-label="Illustrative projected balance">
      {[86,82,77,62,45,34,30,28,56,80,76,72].map((height, index) => <span key={index} className={`flex-1 rounded-t-md ${index === 7 ? "bg-rose-500" : index > 7 ? "bg-emerald-500/70" : "bg-primary/70"}`} style={{ height: `${height}%` }} />)}
    </div>
    <div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground"><span>Today</span><span>Low · Aug 6</span><span>Payday</span></div>
  </div>
}

function EvidencePreview() {
  return <div className="fs-layered-card rounded-[26px] p-5 sm:p-6">
    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">Show your work</p>
    <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card px-4">
      {forecastSteps.map(([label, value], index) => <div key={label} className="flex items-center justify-between gap-4 py-3.5 text-sm"><span className="flex items-center gap-2 text-muted-foreground">{index === 0 ? <span className="h-2 w-2 rounded-full bg-foreground" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}{label}</span><span className="font-mono font-medium text-foreground">{value}</span></div>)}
    </div>
    <p className="mt-4 text-xs text-muted-foreground">Built from 7 confirmed events and 2 estimates.</p>
  </div>
}

function ImportPreview() {
  return <div className="fs-layered-card rounded-[26px] p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileSpreadsheet className="h-5 w-5" /></span><div><p className="font-medium">Here&apos;s what we found</p><p className="text-xs text-muted-foreground">142 transactions · Jan 16–Jul 22</p></div></div>
    <div className="mt-5 space-y-2">
      {[["Northstar Payroll", "+$2,400", "Income"], ["Harbor View Rent", "−$1,650", "Bill"], ["City Power", "~−$118", "Estimated"]].map(([name, amount, tag]) => <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3"><div><p className="text-sm font-medium">{name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{tag}</p></div><span className="font-mono text-sm font-medium">{amount}</span></div>)}
    </div>
  </div>
}

function CardFlowPreview() {
  return <div className="fs-layered-card rounded-[26px] p-5 sm:p-6">
    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">Credit card timing</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Purchases on card</p><p className="mt-2 font-mono text-xl font-medium">$720</p><p className="mt-2 text-[10px] text-muted-foreground">Counts as spending now</p></div>
      <ArrowRight className="mx-auto hidden h-4 w-4 text-primary sm:block" />
      <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4"><p className="text-xs text-muted-foreground">Estimated payment</p><p className="mt-2 font-mono text-xl font-medium">−$720</p><p className="mt-2 text-[10px] text-muted-foreground">Cash leaves on Aug 18</p></div>
    </div>
    <p className="mt-4 text-xs text-muted-foreground">The purchase explains what you spent. The payment shows when cash moves.</p>
  </div>
}

function ScenarioPreview() {
  return <div className="fs-layered-card rounded-[26px] p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">Private what-if</p><p className="mt-2 font-medium">Weekend trip · −$480</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-800">WATCH</span></div>
    <div className="relative mt-8 h-24"><div className="absolute inset-x-0 top-12 h-px bg-border" /><div className="absolute left-0 top-8 h-8 w-8 rounded-full border-4 border-card bg-foreground" /><div className="absolute left-[48%] top-9 h-6 w-6 rounded-full border-4 border-card bg-amber-500" /><div className="absolute right-0 top-7 h-10 w-10 rounded-full border-4 border-card bg-emerald-500" /></div>
    <div className="grid grid-cols-3 text-center text-[10px] text-muted-foreground"><span className="text-left">Today<br /><b className="text-foreground">$2,740</b></span><span>After purchase<br /><b className="text-amber-700">$620</b></span><span className="text-right">Payday<br /><b className="text-foreground">$3,020</b></span></div>
  </div>
}

const chapters = [
  { eyebrow: "Forecast", title: "See the pressure before it arrives.", copy: "Cusp simulates your balance day by day across 30, 60, or 90 days. It surfaces the projected low point, the events creating it, and what happens after—so the chart is an answer, not decoration.", preview: <ForecastPreview /> },
  { eyebrow: "Evidence", title: "Every number can explain itself.", copy: "Open Safe to Spend, a projected low, or an estimated event to see the arithmetic and assumptions underneath. Confirmed items stay distinct from estimates, including the evidence behind a variable amount.", preview: <EvidencePreview /> },
  { eyebrow: "Setup", title: "Bring your numbers. Keep control.", copy: "Start manually or import a CSV without connecting a bank. Cusp maps familiar files automatically, shows the date range and transaction direction, and asks for help only when something is genuinely ambiguous.", preview: <ImportPreview /> },
  { eyebrow: "Cards and transfers", title: "Spending and cash movement stay separate.", copy: "Card purchases explain what you spent; the card payment is when cash leaves checking. Matching transfer pairs prevents the same movement from being counted as both income and expense.", preview: <CardFlowPreview /> },
  { eyebrow: "Scenario Planner", title: "Ask the forecast a practical question.", copy: "Test a purchase on the date you choose, compare it with your existing plan, and see the resulting low point. If another date is safer, Cusp explains why—without changing your real forecast.", preview: <ScenarioPreview /> },
]

export default async function FeaturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <main className="fs-landing min-h-screen overflow-hidden bg-background text-foreground">
    <MarketingHeader signedIn={Boolean(user)} />
    <section className="fs-clay-field relative px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl text-center">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-primary">Inside Cusp</p>
        <h1 className="mx-auto mt-5 max-w-4xl text-[44px] font-medium leading-[1.04] tracking-[-0.025em] sm:text-[62px]">One forecast. <em className="font-serif font-normal text-primary">Every answer in context.</em></h1>
        <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-8 text-muted-foreground">Cusp brings your balances, recurring activity, card timing, and decisions into one forward-looking system—then shows the work behind it.</p>
        <div className="mx-auto mt-12 max-w-4xl"><ForecastPreview /></div>
      </div>
    </section>

    <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
      {chapters.map((chapter, index) => <section key={chapter.eyebrow} className={`grid items-center gap-10 border-b border-border py-16 last:border-0 lg:grid-cols-2 lg:gap-20 ${index % 2 ? "" : "lg:[&>*:first-child]:order-2"}`}>
        <div>{chapter.preview}</div>
        <div className="max-w-xl"><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">{chapter.eyebrow}</p><h2 className="mt-4 text-3xl font-medium leading-tight tracking-tight sm:text-[42px]">{chapter.title}</h2><p className="mt-5 text-[16px] leading-8 text-muted-foreground">{chapter.copy}</p></div>
      </section>)}
    </div>

    <section className="fs-clay-field px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl rounded-[30px] border border-border bg-card/90 p-8 shadow-[0_24px_80px_rgba(67,45,35,0.08)] sm:flex sm:items-center sm:justify-between sm:p-12">
        <div className="max-w-xl"><span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />No bank connection required</span><h2 className="mt-4 text-3xl font-medium tracking-tight">See what your money does next.</h2><p className="mt-3 leading-7 text-muted-foreground">Build a forecast manually or from a CSV, then review every event before it becomes part of your plan.</p></div>
        <Link href={user ? "/app/dashboard" : "/sign-up"} className="fs-brand-action mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium sm:mt-0">{user ? "Open dashboard" : "Get early access"}<ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  </main>
}
