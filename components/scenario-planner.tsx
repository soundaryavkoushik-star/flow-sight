"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Area, AreaChart, LabelList, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowRight, CalendarDays, GitBranch, RotateCcw } from "lucide-react"
import { runScenario } from "@/lib/forecast/scenarios"
import { determineForecastCondition } from "@/lib/forecast/condition"
import type { DashboardForecast } from "@/lib/data/forecast"
import { ActionToast } from "@/components/ui/toast"
import { AmountReveal } from "@/components/financial-display"

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(cents) / 100)
}

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function longDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  const value = payload?.find((entry) => typeof entry.value === "number")?.value
  if (!active || value == null) return null
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-mono font-semibold">{money(value)}</p></div>
}

export default function ScenarioPlanner({ data }: { data: DashboardForecast | null }) {
  const horizonDays = data?.forecast.days.length ?? 30
  const forecastStart = data?.input.settings.startDate ?? new Date().toISOString().slice(0, 10)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [name, setName] = useState("Purchase")
  const [userInteracted, setUserInteracted] = useState(false)
  const effectiveDate = date || forecastStart
  const purchaseCents = Math.round((Number(amount) || 0) * 100)

  const comparison = useMemo(() => {
    if (!data) return null
    return runScenario(data.input, purchaseCents > 0 ? [{
      id: "scenario:preview",
      name: name.trim() || "Purchase",
      date: effectiveDate,
      amountCents: -purchaseCents,
      type: "expense",
      source: "scenario",
      confidence: "confirmed",
    }] : [])
  }, [data, effectiveDate, name, purchaseCents])

  const firstSafeDate = useMemo(() => {
    if (!data || purchaseCents <= 0) return null
    return data.forecast.days
      .filter((day) => day.date >= effectiveDate)
      .map((day) => ({ date: day.date, forecast: runScenario(data.input, [{
        id: "scenario:safe-date",
        name: name.trim() || "Purchase",
        date: day.date,
        amountCents: -purchaseCents,
        type: "expense" as const,
        source: "scenario" as const,
        confidence: "confirmed" as const,
      }]).scenario }))
      .find((candidate) => candidate.forecast.lowestBalanceCents >= data.safetyBufferCents)?.date ?? null
  }, [data, effectiveDate, name, purchaseCents])

  if (!data || !comparison) return <div className="mx-auto max-w-3xl px-5 py-16"><ActionToast message="Add an account and balance before testing a decision." tone="info" /></div>

  const chartData = comparison.scenario.days.map((day, index, days) => ({
    date: day.date,
    label: shortDate(day.date),
    currentPlan: comparison.baseline.days[index]?.endingBalanceCents ?? 0,
    withPurchase: day.endingBalanceCents,
    currentPlanLabel: index === days.length - 1 ? "Current plan" : "",
    withPurchaseLabel: purchaseCents > 0 && index === days.length - 1 ? "With purchase" : "",
  }))
  const values = chartData.flatMap((point) => [point.currentPlan, point.withPurchase, data.safetyBufferCents])
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const padding = Math.max(10_000, Math.round((maximum - minimum) * 0.18))
  const domain: [number, number] = [Math.max(0, minimum - padding), maximum + padding]
  const lowPoint = comparison.scenario.days.find((day) => day.date === comparison.scenario.lowestBalanceDate)
  const bufferMargin = comparison.scenario.lowestBalanceCents - data.safetyBufferCents
  const condition = determineForecastCondition(comparison.scenario, data.safetyBufferCents, data.freshness.status)
  const atRisk = purchaseCents > 0 && bufferMargin < 0
  const confirmedCount = comparison.scenario.days.flatMap((day) => day.events).filter((event) => event.confidence === "confirmed").length
  const estimatedCount = comparison.scenario.days.flatMap((day) => day.events).filter((event) => event.confidence === "estimated").length
  const eventsBeforeLowPoint = comparison.scenario.days
    .filter((day) => day.date >= effectiveDate && day.date <= comparison.scenario.lowestBalanceDate)
    .flatMap((day) => day.events.map((event) => ({ ...event, day: day.date })))
    .filter((event) => event.id !== "scenario:preview" && event.amountCents < 0)
    .slice(0, 3)
  const nextIncome = comparison.scenario.days
    .filter((day) => day.date > comparison.scenario.lowestBalanceDate)
    .flatMap((day) => day.events.map((event) => ({ ...event, day: day.date })))
    .find((event) => event.amountCents > 0)
  const timingExplanation = eventsBeforeLowPoint.length > 0
    ? `${eventsBeforeLowPoint.map((event) => event.name).join(" and ")} land before ${nextIncome ? `${nextIncome.name} on ${shortDate(nextIncome.day)}` : "your balance has time to recover"}.`
    : `Your projected low point is ${longDate(comparison.scenario.lowestBalanceDate)}.`
  const result = purchaseCents <= 0
    ? { title: "Enter a purchase to see if it fits.", detail: `FlowSight will test it against the next ${horizonDays} days without changing your transactions.` }
    : !atRisk
      ? { title: `This purchase fits on ${longDate(effectiveDate)}.`, detail: `You would still keep ${money(bufferMargin)} above your buffer through ${longDate(comparison.scenario.days.at(-1)?.date ?? effectiveDate)}.` }
      : firstSafeDate
        ? { title: `Wait until ${longDate(firstSafeDate)}.`, detail: `Buying on ${longDate(effectiveDate)} creates a tight day on ${longDate(comparison.scenario.lowestBalanceDate)}. Waiting until then keeps this ${money(purchaseCents)} purchase inside your buffer.` }
        : { title: `No safe date found in the next ${horizonDays} days.`, detail: `This ${money(purchaseCents)} purchase would leave your balance ${money(Math.abs(bufferMargin))} short of your buffer. Up to ${money(data.forecast.safeToSpendCents)} is currently safe to spend today.` }

  const setDecisionDate = (nextDate: string) => {
    setDate(nextDate)
    setUserInteracted(true)
  }

  return <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-9">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><Link href={`/app/forecast?range=${horizonDays}`} className="text-xs text-muted-foreground hover:text-foreground">← Back to Forecast</Link><h1 className="mt-3 text-2xl font-semibold tracking-tight">Scenario planner</h1><p className="mt-1 text-sm text-muted-foreground">Can I make this decision without putting the next {horizonDays} days at risk?</p></div><div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5" aria-label="Scenario horizon">{[30, 60, 90].map((range) => <Link key={range} href={`/app/scenarios?range=${range}`} className={`rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors ${horizonDays === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{range}d</Link>)}</div></header>

    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /><h2 className="font-semibold">What are you considering?</h2></div>
        <div className="space-y-4"><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-name">Purchase</label><input id="scenario-name" value={name} onChange={(event) => { setName(event.target.value); setUserInteracted(true) }} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" placeholder="Laptop, trip, or other purchase" /></div><div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-amount">Purchase amount</label><input id="scenario-amount" type="number" min="1" value={amount} onChange={(event) => { setAmount(event.target.value); setUserInteracted(true) }} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono" placeholder="0" /></div><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-date">When?</label><input id="scenario-date" type="date" min={forecastStart} value={effectiveDate} onChange={(event) => setDecisionDate(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></div></div></div>
        <p className="mt-5 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground"><RotateCcw className="mr-1 inline h-3.5 w-3.5 text-primary" />This is a private what-if. It never changes your transactions, accounts, or real forecast.</p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-muted-foreground">Your answer</p><h2 className="mt-1 text-xl font-semibold tracking-tight">{result.title}</h2></div>{purchaseCents > 0 && <span className={`rounded-full px-3 py-1 text-xs font-medium ${atRisk ? "bg-[hsl(var(--fs-red-bg))] text-[hsl(var(--fs-red))]" : condition === "watch" ? "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]" : "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]"}`}>{atRisk ? "Tight" : "Fits"}</span>}</div>
        <p className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5 text-sm leading-relaxed text-foreground">{result.detail}</p>
        {purchaseCents > 0 && firstSafeDate && firstSafeDate !== effectiveDate && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">Compare:</span><button type="button" onClick={() => setDecisionDate(forecastStart)} className={`rounded-full border px-3 py-1.5 transition-colors ${effectiveDate === forecastStart ? "border-primary/35 bg-primary/[0.06] text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>Buy {shortDate(forecastStart)}</button><button type="button" onClick={() => setDecisionDate(firstSafeDate)} className={`rounded-full border px-3 py-1.5 transition-colors ${effectiveDate === firstSafeDate ? "border-primary/35 bg-primary/[0.06] text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>Wait until {shortDate(firstSafeDate)}</button></div>}
        <div className="mt-4 h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 16, right: 82, left: -4, bottom: 0 }}><XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(horizonDays / 8))} /><YAxis domain={domain} allowDataOverflow tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 100_000 ? `$${(value / 100_000).toFixed(1)}k` : `$${Math.round(value / 100)}`} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "4 4" }} /><ReferenceLine x={shortDate(effectiveDate)} stroke="hsl(var(--primary))" strokeDasharray="3 4" label={{ value: "Purchase", position: "insideTopLeft", fontSize: 10 }} /><ReferenceLine y={data.safetyBufferCents} stroke="hsl(var(--fs-amber))" strokeDasharray="5 4" label={{ value: "Buffer", position: "insideBottomLeft", fontSize: 10 }} /><Area type="monotone" dataKey="withPurchase" stroke="hsl(var(--primary))" strokeWidth={2.75} fill="hsl(var(--primary) / 0.10)" name="With purchase" animationDuration={550}><LabelList dataKey="withPurchaseLabel" position="right" fill="hsl(var(--primary))" fontSize={10} /></Area><Line type="monotone" dataKey="currentPlan" stroke="#64748B" strokeDasharray="6 4" strokeWidth={2} dot={false} name="Current plan" isAnimationActive={false}><LabelList dataKey="currentPlanLabel" position="right" fill="#64748B" fontSize={10} /></Line>{purchaseCents > 0 && lowPoint && <ReferenceDot x={shortDate(lowPoint.date)} y={lowPoint.endingBalanceCents} r={5} fill="hsl(var(--primary))" stroke="#fff" strokeWidth={2} />}</AreaChart></ResponsiveContainer></div>
        {purchaseCents > 0 && <><div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4"><div><p className="text-[10px] text-muted-foreground">Decision room</p><p className="mt-1 font-mono font-semibold"><AmountReveal cents={comparison.scenario.safeToSpendCents} /></p><p className="mt-1 text-[10px] text-muted-foreground">Safe today through {shortDate(comparison.scenario.days.at(-1)?.date ?? effectiveDate)}</p></div><div><p className="text-[10px] text-muted-foreground">Projected low</p><p className="mt-1 font-mono font-semibold"><AmountReveal cents={comparison.scenario.lowestBalanceCents} /></p></div><div className="rounded-lg bg-primary/[0.04] px-2 py-1"><p className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="inline-block h-2 w-2 rounded-full bg-primary" />Low point on chart</p><p className="mt-1 text-sm font-medium">{shortDate(comparison.scenario.lowestBalanceDate)}</p></div><div><p className="text-[10px] text-muted-foreground">Coverage</p><p className="mt-1 text-sm font-medium">{confirmedCount} confirmed</p><p className="mt-1 text-[10px] text-muted-foreground">{estimatedCount} {estimatedCount === 1 ? "estimate" : "estimates"}</p></div></div>
          <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium">What leads to this low point</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{timingExplanation}</p></div><Link href={`/app/forecast?range=${horizonDays}&date=${encodeURIComponent(comparison.scenario.lowestBalanceDate)}&detail=1`} className="shrink-0 text-xs font-medium text-primary hover:underline">Review day <ArrowRight className="inline h-3.5 w-3.5" /></Link></div>{eventsBeforeLowPoint.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{eventsBeforeLowPoint.map((event) => <span key={`${event.id}:${event.day}`} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">{event.name}</span> · −{money(Math.abs(event.amountCents))}</span>)}</div>}</div></>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Nothing is saved from this page.</p>{userInteracted && <button type="button" onClick={() => { setAmount(""); setDate(""); setName("Purchase"); setUserInteracted(false) }} className="text-xs font-medium text-muted-foreground hover:text-foreground">Start another decision</button>}</div>
      </section>
    </div>
  </main>
}
