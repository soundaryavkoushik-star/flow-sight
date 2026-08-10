"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Area, AreaChart, LabelList, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowRight, CalendarDays, GitBranch, RotateCcw } from "lucide-react"
import { runScenario } from "@/lib/forecast/scenarios"
import { determineForecastCondition, type ForecastCondition } from "@/lib/forecast/condition"
import { safeDateComparisonLabel, scenarioChartScale } from "@/lib/forecast/scenario-presentation"
import type { DashboardForecast } from "@/lib/data/forecast"
import { ActionToast } from "@/components/ui/toast"
import { safeToSpendTone } from "@/components/condition-banner"
import { dismissSafetyBufferPrompt, updateSafetyBuffer } from "@/app/app/forecast/actions"

const scenarioPresets = [
  { name: "Weekend trip", amount: "480" },
  { name: "New iPhone", amount: "1099" },
  { name: "MacBook Pro", amount: "2499" },
] as const

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(cents) / 100)
}

function signedMoney(cents: number) {
  const value = money(cents)
  return cents < 0 ? `−${value}` : value
}

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function longDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
}

function chartMoney(cents: number) {
  const dollars = Math.round(Math.abs(cents) / 100)
  const compact = dollars >= 1_000 ? `${(dollars / 1_000).toFixed(dollars % 1_000 === 0 ? 0 : 1)}k` : dollars.toLocaleString("en-US")
  return cents < 0 ? `−$${compact}` : `$${compact}`
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  const value = payload?.find((entry) => typeof entry.value === "number")?.value
  if (!active || value == null) return null
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-mono font-semibold">{chartMoney(value)}</p></div>
}

export default function ScenarioPlanner({ data }: { data: DashboardForecast | null }) {
  const router = useRouter()
  const horizonDays = data?.forecast.days.length ?? 30
  const forecastStart = data?.input.settings.startDate ?? new Date().toISOString().slice(0, 10)
  const forecastEnd = data?.forecast.days.at(-1)?.date ?? forecastStart
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [comparisonDate, setComparisonDate] = useState<string | null>(null)
  const [name, setName] = useState("Purchase")
  const [userInteracted, setUserInteracted] = useState(false)
  const [scenarioHistory, setScenarioHistory] = useState<Array<{ name: string; amount: string; date: string; condition: string }>>([])
  const [bufferPromptHidden, setBufferPromptHidden] = useState(false)
  const [bufferPromptBusy, setBufferPromptBusy] = useState(false)
  const [bufferPromptError, setBufferPromptError] = useState<string | null>(null)
  const requestedDate = date || forecastStart
  const effectiveDate = comparisonDate ?? requestedDate
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

  const requestedComparison = useMemo(() => {
    if (!data) return null
    return runScenario(data.input, purchaseCents > 0 ? [{
      id: "scenario:requested",
      name: name.trim() || "Purchase",
      date: requestedDate,
      amountCents: -purchaseCents,
      type: "expense",
      source: "scenario",
      confidence: "confirmed",
    }] : [])
  }, [data, name, purchaseCents, requestedDate])

  const firstSafeDate = useMemo(() => {
    if (!data || purchaseCents <= 0) return null
    return data.forecast.days
      .filter((day) => day.date >= requestedDate)
      .map((day) => ({ date: day.date, comparison: runScenario(data.input, [{
        id: "scenario:safe-date",
        name: name.trim() || "Purchase",
        date: day.date,
        amountCents: -purchaseCents,
        type: "expense" as const,
        source: "scenario" as const,
        confidence: "confirmed" as const,
      }]) }))
      .find((candidate) => {
        const comparison = candidate.comparison
        const margin = comparison.scenarioComparisonLowCents - data.safetyBufferCents
        const watchMargin = Math.max(20_000, Math.round(data.safetyBufferCents * 0.25))
        return data.safetyBufferConfigured ? margin > watchMargin : comparison.scenarioComparisonLowCents >= 0
      })?.date ?? null
  }, [data, name, purchaseCents, requestedDate])

  if (!data || !comparison || !requestedComparison) return <div className="mx-auto max-w-3xl px-5 py-16"><ActionToast message="Add an account and balance before testing a decision." tone="info" /></div>

  const chartData = comparison.scenario.days.map((day, index, days) => ({
    date: day.date,
    label: shortDate(day.date),
    currentPlan: comparison.baseline.days[index]?.endingBalanceCents ?? 0,
    withPurchase: day.endingBalanceCents,
    currentPlanLabel: index === days.length - 1 ? "Current plan" : "",
    withPurchaseLabel: purchaseCents > 0 && index === days.length - 1 ? "With purchase" : "",
  }))
  const balanceValues = chartData.flatMap((point) => [point.currentPlan, point.withPurchase])
  const { domain, showThreshold: showThresholdOnChart } = scenarioChartScale(balanceValues, data.safetyBufferCents)
  const decisionLowCents = comparison.scenarioComparisonLowCents
  const decisionLowDate = comparison.scenarioComparisonLowDate
  const decisionRoomCents = comparison.scenarioComparisonSafeToSpendCents
  const lowPoint = comparison.scenario.days.find((day) => day.date === decisionLowDate)
  const bufferMargin = decisionLowCents - data.safetyBufferCents
  const decisionForecast = {
    ...comparison.scenario,
    lowestBalanceCents: decisionLowCents,
    lowestBalanceDate: decisionLowDate,
    safeToSpendCents: decisionRoomCents,
    risks: comparison.scenario.risks.filter((risk) => risk.date >= effectiveDate),
  }
  const condition = determineForecastCondition(decisionForecast, data.safetyBufferCents, data.freshness.status)
  const atRisk = purchaseCents > 0 && bufferMargin < 0
  const baselineFutureMargin = comparison.baselineComparisonLowCents - data.safetyBufferCents
  const baselineFutureAtRisk = baselineFutureMargin < 0
  const prePurchaseRisks = comparison.baseline.risks.filter((risk) => risk.date < effectiveDate)
  const requestedBufferMargin = requestedComparison.scenarioComparisonLowCents - data.safetyBufferCents
  const requestedForecast = { ...requestedComparison.scenario, lowestBalanceCents: requestedComparison.scenarioComparisonLowCents, lowestBalanceDate: requestedComparison.scenarioComparisonLowDate, safeToSpendCents: requestedComparison.scenarioComparisonSafeToSpendCents, risks: requestedComparison.scenario.risks.filter((risk) => risk.date >= requestedDate) }
  const requestedCondition = determineForecastCondition(requestedForecast, data.safetyBufferCents, data.freshness.status)
  const requestedAtRisk = purchaseCents > 0 && requestedBufferMargin < 0
  const bannerCondition: ForecastCondition = purchaseCents <= 0 ? "update_needed" : atRisk ? "tight" : condition === "watch" ? "watch" : "clear"
  const hasPositiveBuffer = data.safetyBufferConfigured && data.safetyBufferCents > 0
  const confirmedCount = comparison.scenario.days.flatMap((day) => day.events).filter((event) => event.confidence === "confirmed").length
  const estimatedCount = comparison.scenario.days.flatMap((day) => day.events).filter((event) => event.confidence === "estimated").length
  const eventsBeforeLowPoint = comparison.scenario.days
    .filter((day) => day.date >= effectiveDate && day.date <= decisionLowDate)
    .flatMap((day) => day.events.map((event) => ({ ...event, day: day.date })))
    .filter((event) => event.id !== "scenario:preview" && event.amountCents < 0)
    .slice(0, 3)
  const nextIncome = comparison.scenario.days
    .filter((day) => day.date > decisionLowDate)
    .flatMap((day) => day.events.map((event) => ({ ...event, day: day.date })))
    .find((event) => event.amountCents > 0)
  const timingExplanation = eventsBeforeLowPoint.length > 0
    ? `${eventsBeforeLowPoint.map((event) => event.name).join(" and ")} ${eventsBeforeLowPoint.length === 1 ? "lands" : "land"} before ${nextIncome ? `${nextIncome.name} on ${shortDate(nextIncome.day)}` : "your balance has time to recover"}.`
    : `Your lowest point after this purchase is ${longDate(decisionLowDate)}.`
  const result = purchaseCents <= 0
    ? { title: "Enter a purchase to see if it fits.", detail: `Cusp will test it against the next ${horizonDays} days without changing your transactions.` }
    : !data.safetyBufferConfigured
      ? decisionLowCents >= 0
        ? { title: "Fits above $0 — no safety buffer set.", detail: `After the purchase, your projected balance reaches ${signedMoney(decisionLowCents)} on ${longDate(decisionLowDate)}.` }
        : { title: "Doesn’t fit above $0.", detail: `After the purchase, your projected balance reaches ${signedMoney(decisionLowCents)} on ${longDate(decisionLowDate)}.${firstSafeDate ? ` Moving the purchase to ${longDate(firstSafeDate)} keeps the projection above $0.` : ""}` }
    : baselineFutureAtRisk
      ? { title: "The forecast is already Tight without this purchase.", detail: `In the same future window, the existing low is ${signedMoney(comparison.baselineComparisonLowCents)} on ${longDate(comparison.baselineComparisonLowDate)}. Adding the purchase lowers it to ${signedMoney(decisionLowCents)} on ${longDate(decisionLowDate)}.` }
    : comparisonDate && !atRisk
      ? { title: `This purchase fits on ${longDate(effectiveDate)}.`, detail: requestedAtRisk ? `Your original date, ${longDate(requestedDate)}, creates a tight day. This is the earliest date that returns the forecast to Clear.` : `Compared with your original date of ${longDate(requestedDate)}.` }
    : !atRisk
      ? condition === "watch" && hasPositiveBuffer
        ? { title: `${longDate(requestedDate)} is Watch.`, detail: `The purchase fits, but leaves only ${money(bufferMargin)} above your buffer.${firstSafeDate && firstSafeDate !== requestedDate ? ` ${longDate(firstSafeDate)} is the earliest date that returns the forecast to Clear.` : ""}` }
        : { title: `This purchase fits on ${longDate(effectiveDate)}.`, detail: hasPositiveBuffer ? `You would still keep ${money(bufferMargin)} above your buffer through ${longDate(comparison.scenario.days.at(-1)?.date ?? effectiveDate)}.` : `Your projected balance stays above $0 through ${longDate(comparison.scenario.days.at(-1)?.date ?? effectiveDate)}.` }
      : firstSafeDate
        ? { title: hasPositiveBuffer ? `${longDate(requestedDate)} is ${requestedCondition === "watch" ? "Watch" : "Tight"}.` : `${longDate(requestedDate)} falls below $0.`, detail: hasPositiveBuffer ? `${longDate(firstSafeDate)} is the earliest date that returns the forecast to Clear.` : `${longDate(firstSafeDate)} is the earliest date the projected balance stays above $0.` }
        : { title: `No safe date found in the next ${horizonDays} days.`, detail: hasPositiveBuffer ? `This ${money(purchaseCents)} purchase would leave your balance ${money(Math.abs(bufferMargin))} short of your buffer. Before this purchase, the same future window has ${money(Math.max(0, comparison.baselineComparisonLowCents - data.safetyBufferCents))} of room; after it, this scenario has ${money(decisionRoomCents)}.` : `This ${money(purchaseCents)} purchase would put your projected balance ${money(Math.abs(decisionLowCents))} below $0. Before this purchase, the same future window has ${money(Math.max(0, comparison.baselineComparisonLowCents))} available; after it, this scenario has ${money(decisionRoomCents)}.` }

  const setRequestedDecisionDate = (nextDate: string) => {
    setDate(nextDate)
    setComparisonDate(null)
    setUserInteracted(true)
  }

  const resolveBufferPrompt = async (action: Promise<{ ok: boolean; message?: string }>) => {
    setBufferPromptBusy(true)
    setBufferPromptError(null)
    const response = await action
    setBufferPromptBusy(false)
    if (!response.ok) {
      setBufferPromptError(response.message ?? "We couldn’t update your safety-buffer preference.")
      return
    }
    setBufferPromptHidden(true)
    router.refresh()
  }

  const startAnotherDecision = () => {
    if (purchaseCents > 0) {
      const conditionLabel = !data.safetyBufferConfigured
        ? atRisk ? "Below $0" : "Fits above $0"
        : bannerCondition === "tight" ? "Tight" : bannerCondition === "watch" ? "Watch" : "Clear"
      setScenarioHistory((current) => [{ name: name.trim() || "Purchase", amount, date: requestedDate, condition: conditionLabel }, ...current].slice(0, 3))
    }
    setAmount("")
    setDate("")
    setComparisonDate(null)
    setName("Purchase")
    setUserInteracted(false)
  }

  return <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-9">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><Link href={`/app/forecast?range=${horizonDays}`} className="text-xs text-muted-foreground hover:text-foreground">← Back to Forecast</Link><h1 className="mt-3 text-2xl font-semibold tracking-tight">Scenario planner</h1><p className="mt-1 text-sm text-muted-foreground">Can I make this decision without putting the next {horizonDays} days at risk?</p></div><div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5" aria-label="Scenario horizon">{[30, 60, 90].map((range) => <Link key={range} href={`/app/scenarios?range=${range}`} className={`rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors ${horizonDays === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{range}d</Link>)}</div></header>

    {!data.safetyBufferConfigured && !data.safetyBufferPromptDismissed && !bufferPromptHidden && <section className="mb-6 rounded-2xl border border-[oklch(var(--fs-amber))]/25 bg-[oklch(var(--fs-amber-bg))]/55 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-semibold">No safety buffer is set</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">“Fits” currently means your projected balance stays at or above $0. Set a buffer if you want Cusp to protect an additional cushion.</p><Link href="/learn/safe-to-spend#no-buffer" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">Learn why</Link>{bufferPromptError && <p className="mt-2 text-xs text-destructive">{bufferPromptError}</p>}</div>
        <div className="flex shrink-0 flex-wrap gap-2"><Link href="/app/settings" className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted">Set a buffer</Link><button type="button" disabled={bufferPromptBusy} onClick={() => void resolveBufferPrompt(updateSafetyBuffer(0))} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">Keep using $0</button><button type="button" disabled={bufferPromptBusy} onClick={() => void resolveBufferPrompt(dismissSafetyBufferPrompt())} className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Dismiss</button></div>
      </div>
    </section>}

    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
      <section className="flex rounded-3xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-6 lg:min-h-[620px] lg:flex-col">
        <div className="mb-4 flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /><h2 className="font-semibold">What are you considering?</h2></div>
        <div className="space-y-4"><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-name">Purchase</label><input id="scenario-name" value={name} onChange={(event) => { setName(event.target.value); setComparisonDate(null); setUserInteracted(true) }} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" placeholder="Laptop, trip, or other purchase" /></div><div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-amount">Purchase amount</label><input id="scenario-amount" type="number" min="1" value={amount} onChange={(event) => { setAmount(event.target.value); setComparisonDate(null); setUserInteracted(true) }} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono" placeholder="0" /></div><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-date">When?</label><input id="scenario-date" type="date" min={forecastStart} max={forecastEnd} value={requestedDate} onChange={(event) => setRequestedDecisionDate(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></div></div></div>
        <div className="mt-4"><p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Quick examples</p><div className="flex flex-wrap gap-2">{scenarioPresets.map((preset) => <button key={preset.name} type="button" onClick={() => { setName(preset.name); setAmount(preset.amount); setDate(forecastStart); setComparisonDate(null); setUserInteracted(true) }} className="rounded-full border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">{preset.name} · ${Number(preset.amount).toLocaleString()}</button>)}</div></div>
        <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your safety buffer</p><div className="mt-1 flex items-baseline justify-between gap-3"><p className="font-mono text-sm font-semibold">{money(data.safetyBufferCents)}</p><p className="text-[10px] text-muted-foreground">{data.safetyBufferConfigured ? "protected in every scenario" : "not configured"}</p></div></div>
        <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground"><RotateCcw className="mr-1 inline h-3.5 w-3.5 text-primary" />This is a private what-if. It never changes your transactions, accounts, or real forecast.</p>
        <div className="mt-auto pt-6"><div className="flex items-center justify-between"><p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">This session</p>{scenarioHistory.length > 0 && <span className="text-[10px] text-muted-foreground">Recent what-ifs</span>}</div>{scenarioHistory.length === 0 ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Test a decision, then choose “Start another decision” to compare more ideas here.</p> : <div className="mt-2 space-y-2">{scenarioHistory.map((item, index) => <button key={`${item.name}:${item.date}:${index}`} type="button" onClick={() => { setName(item.name); setAmount(item.amount); setDate(item.date); setComparisonDate(null); setUserInteracted(true) }} className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30"><span className="min-w-0"><span className="block truncate text-xs font-medium">{item.name} · −${Number(item.amount).toLocaleString()}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{shortDate(item.date)}</span></span><span className="shrink-0 text-[10px] font-medium text-muted-foreground">{item.condition}</span></button>)}</div>}</div>
      </section>

      <div>
      <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_24px_70px_rgba(0,0,0,0.06)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{purchaseCents > 0 ? `Private what-if · ${shortDate(effectiveDate)}` : "Your current plan"}</p><h2 className="mt-1 text-base font-semibold">{purchaseCents > 0 ? `${name.trim() || "Purchase"} · −${money(purchaseCents)}` : "No extra purchase"}</h2></div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${bannerCondition === "tight" ? "bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]" : bannerCondition === "watch" ? "bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]" : bannerCondition === "clear" ? "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]" : "bg-muted text-muted-foreground"}`}>{purchaseCents <= 0 ? "Baseline" : !data.safetyBufferConfigured ? atRisk ? "Below $0" : "Fits above $0" : atRisk ? "Tight" : bannerCondition === "watch" ? "Watch" : "Clear"}</span>
        </div>
        <div className="mt-4 rounded-2xl bg-muted/45 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Your answer</p><h3 className="mt-1.5 text-base font-semibold tracking-tight">{result.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.detail}</p>{prePurchaseRisks.length > 0 && <p className="mt-2 border-t border-border/70 pt-2 text-[11px] leading-relaxed text-muted-foreground">Your current forecast also has {prePurchaseRisks.length === 1 ? "a tight day" : "tight days"} before {longDate(effectiveDate)}. {purchaseCents > 0 ? "This purchase did not cause that earlier risk." : ""}</p>}{!hasPositiveBuffer && <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{data.safetyBufferConfigured ? "Your safety buffer is $0." : "No safety buffer is set."} This answer checks whether the purchase keeps your projected balance above $0.</p>}</div>
        <div className="mt-4 flex items-center justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Forecast</p><h3 className="mt-1 text-sm font-semibold">Baseline vs. this purchase</h3></div>{purchaseCents > 0 && <p className="text-[11px] text-muted-foreground">{confirmedCount} confirmed · {estimatedCount} {estimatedCount === 1 ? "estimate" : "estimates"}</p>}</div>
        {purchaseCents > 0 && firstSafeDate && firstSafeDate !== requestedDate && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">Compare dates:</span><button type="button" onClick={() => setComparisonDate(null)} className={`rounded-full border px-3 py-1.5 transition-colors ${comparisonDate === null ? "border-primary/35 bg-primary/[0.06] text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{shortDate(requestedDate)} · your date</button><button type="button" onClick={() => setComparisonDate(firstSafeDate)} className={`rounded-full border px-3 py-1.5 transition-colors ${comparisonDate === firstSafeDate ? "border-primary/35 bg-primary/[0.06] text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{shortDate(firstSafeDate)} · {safeDateComparisonLabel(hasPositiveBuffer)}</button></div>}
        <div className="mt-4 h-[240px] sm:h-[280px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 16, right: 82, left: -4, bottom: 0 }}><XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(horizonDays / 8))} /><YAxis domain={domain} allowDataOverflow tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={chartMoney} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: "oklch(var(--primary))", strokeDasharray: "4 4" }} /><ReferenceLine x={shortDate(effectiveDate)} stroke="oklch(var(--primary))" strokeDasharray="3 4" label={{ value: "Purchase", position: "insideTopLeft", fontSize: 10 }} />{showThresholdOnChart && <ReferenceLine y={data.safetyBufferCents} stroke="oklch(var(--fs-amber))" strokeWidth={1.5} strokeDasharray="5 4" label={{ value: hasPositiveBuffer ? `${money(data.safetyBufferCents)} buffer` : "$0 floor", position: "insideBottomLeft", fontSize: 10 }} />}<Area type="monotone" dataKey="withPurchase" stroke="oklch(var(--primary))" strokeWidth={2.75} fill="oklch(var(--primary) / 0.10)" name="With purchase" animationDuration={550}><LabelList dataKey="withPurchaseLabel" position="right" fill="oklch(var(--primary))" fontSize={10} /></Area><Line type="monotone" dataKey="currentPlan" stroke="#625852" strokeDasharray="6 4" strokeWidth={2} dot={false} name="Current plan" isAnimationActive={false}><LabelList dataKey="currentPlanLabel" position="right" fill="#625852" fontSize={10} /></Line>{purchaseCents > 0 && lowPoint && <ReferenceDot x={shortDate(lowPoint.date)} y={lowPoint.endingBalanceCents} r={5} fill="oklch(var(--primary))" stroke="#fff" strokeWidth={2} />}</AreaChart></ResponsiveContainer></div>
        {!showThresholdOnChart && <p className="mt-1 text-[10px] text-muted-foreground">Chart focused on the projected balance range. {hasPositiveBuffer ? "Your safety buffer" : "The $0 floor"} is below this view.</p>}
        {purchaseCents > 0 && <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lowest after purchase</p><p className="mt-1 font-mono text-base font-semibold">{signedMoney(decisionLowCents)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{shortDate(decisionLowDate)}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Purchase impact</p><p className="mt-1 font-mono text-base font-semibold">{signedMoney(comparison.lowestBalanceDeltaCents)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">future low moves {signedMoney(comparison.baselineComparisonLowCents)} → {signedMoney(decisionLowCents)}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Room remaining</p><p className={`mt-1 font-mono text-base font-semibold ${safeToSpendTone(bannerCondition, decisionRoomCents)}`}>{money(decisionRoomCents)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">after this purchase through {shortDate(comparison.scenario.days.at(-1)?.date ?? effectiveDate)}</p></div>
        </div>}
      {purchaseCents > 0 && <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-start justify-between gap-3">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Why this happens</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{timingExplanation}</p></div>
          <Link href={`/app/forecast?range=${horizonDays}&date=${encodeURIComponent(decisionLowDate)}&detail=1`} className="shrink-0 text-xs font-medium text-primary hover:underline">Review day <ArrowRight className="inline h-3.5 w-3.5" /></Link>
        </div>
        {eventsBeforeLowPoint.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{eventsBeforeLowPoint.map((event) => <span key={`${event.id}:${event.day}`} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">{event.name}</span> · −{money(Math.abs(event.amountCents))}</span>)}</div>}
      </div>}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1"><p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Nothing is saved from this page.</p>{userInteracted && <button type="button" onClick={startAnotherDecision} className="text-xs font-medium text-muted-foreground hover:text-foreground">Start another decision</button>}</div>
      </div>
    </div>
  </main>
}
