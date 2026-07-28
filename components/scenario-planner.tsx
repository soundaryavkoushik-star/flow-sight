"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Area, AreaChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowRight, CheckCircle, GitBranch, RotateCcw } from "lucide-react"
import { runScenario } from "@/lib/forecast/scenarios"
import { determineForecastCondition } from "@/lib/forecast/condition"
import type { DashboardForecast } from "@/lib/data/forecast"
import { createManualTransaction } from "@/app/app/transactions/actions"
import { ActionToast } from "@/components/ui/toast"

type ScenarioKind = "purchase" | "income" | "card"

const presets: Array<{ id: ScenarioKind; label: string; description: string }> = [
  { id: "purchase", label: "Add a purchase", description: "See whether a one-time expense fits." },
  { id: "income", label: "Add one-time income", description: "Preview an invoice, bonus, or deposit." },
  { id: "card", label: "Test a lower card payment", description: "See what a smaller cash payment changes." },
]

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(cents) / 100)
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  const value = payload?.find((entry) => typeof entry.value === "number")?.value
  if (!active || value == null) return null
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-mono font-semibold">{money(value)}</p></div>
}

export default function ScenarioPlanner({ data }: { data: DashboardForecast | null }) {
  const [kind, setKind] = useState<ScenarioKind>("purchase")
  const [amount, setAmount] = useState("480")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [name, setName] = useState("Weekend trip")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [held, setHeld] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scenarioCents = Math.round((Number(amount) || 0) * 100)
  const comparison = useMemo(() => {
    if (!data) return null
    const positiveAdjustment = kind === "income" || kind === "card"
    return runScenario(data.input, scenarioCents ? [{ id: "scenario:preview", name: name.trim() || "Scenario", date, amountCents: positiveAdjustment ? scenarioCents : -scenarioCents, type: positiveAdjustment ? "income" : "expense", source: "scenario", confidence: "confirmed" }] : [])
  }, [data, date, kind, name, scenarioCents])

  const chartData = comparison?.scenario.days.map((day) => ({
    day: day.date,
    label: new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    before: comparison.baseline.days.find((baseline) => baseline.date === day.date)?.endingBalanceCents ?? null,
    after: day.endingBalanceCents,
  })) ?? []
  const values = chartData.flatMap((point) => [point.before, point.after]).filter((value): value is number => typeof value === "number")
  const minimum = Math.min(...values, data?.safetyBufferCents ?? 0)
  const maximum = Math.max(...values, data?.safetyBufferCents ?? 0)
  const padding = Math.max(10_000, Math.round((maximum - minimum) * 0.18))
  const domain: [number, number] = [Math.max(0, minimum - padding), maximum + padding]
  const lowPoint = comparison?.scenario.days.find((day) => day.date === comparison.scenario.lowestBalanceDate)
  const condition = comparison && data ? determineForecastCondition(comparison.scenario, data.safetyBufferCents, data.freshness.status) : "clear"
  const conditionLabel = condition === "update_needed" ? "Update needed" : condition[0].toUpperCase() + condition.slice(1)
  const conditionTone = condition === "clear" ? "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]" : condition === "watch" ? "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]" : condition === "tight" ? "bg-[hsl(var(--fs-red-bg))] text-[hsl(var(--fs-red))]" : "bg-muted text-muted-foreground"
  const decisionDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const decisionText = kind === "income" ? `Income of ${money(scenarioCents)}` : kind === "card" ? `Card payment reduced by ${money(scenarioCents)}` : `${name || "Purchase"} · ${money(scenarioCents)}`
  const delta = comparison?.safeToSpendDeltaCents ?? 0

  function choosePreset(next: ScenarioKind) {
    setKind(next); setSaved(false); setHeld(false)
    if (next === "purchase") setName("Weekend trip")
    if (next === "income") setName("One-time income")
    if (next === "card") { setName("Lower card payment"); if (data?.cardPayments[0]?.dueDate) setDate(data.cardPayments[0].dueDate) }
  }

  async function saveScenario() {
    if (!data || !scenarioCents || kind === "card") return
    setSaving(true); setError(null)
    const result = await createManualTransaction({ accountId: data.includedAccountIds[0], date, description: name.trim() || "Scenario", amountCents: kind === "income" ? scenarioCents : -scenarioCents })
    setSaving(false)
    if (!result.ok) { setError(result.message); return }
    setSaved(true)
  }

  if (!data) return <div className="mx-auto max-w-3xl px-5 py-16"><ActionToast message="Add an account and balance before testing a scenario." tone="info" /></div>

  return <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-9">
    <header className="mb-7"><Link href="/app/forecast" className="text-xs text-muted-foreground hover:text-foreground">← Back to Forecast</Link><h1 className="mt-3 text-2xl font-semibold tracking-tight">Scenario planner</h1><p className="mt-1 text-sm text-muted-foreground">Test one temporary change against your next 30 days. Nothing changes until you save it.</p></header>
    {saved && <div className="mb-5"><ActionToast message="Saved to your forecast. The dashboard will recalculate with this change." /></div>}
    {held && <div className="mb-5"><ActionToast message="Keeping this comparison temporarily. It disappears when you leave this page." tone="info" onDismiss={() => setHeld(false)} /></div>}
    {error && <div className="mb-5"><ActionToast message={error} tone="error" onDismiss={() => setError(null)} /></div>}

    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /><h2 className="font-semibold">Choose one change</h2></div>
        <div className="space-y-2">{presets.map((preset) => { const selected = preset.id === kind; return <button key={preset.id} type="button" onClick={() => choosePreset(preset.id)} className={`w-full rounded-2xl border text-left transition-all ${selected ? "border-primary/45 bg-primary/[0.06] p-4 shadow-sm" : "border-border px-4 py-3 hover:border-primary/25"}`}><div className="flex justify-between gap-3"><div><p className="text-sm font-medium">{preset.label}</p>{selected && <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>}</div>{selected && <CheckCircle className="h-4 w-4 shrink-0 text-primary" />}</div></button> })}</div>
        <div className="mt-5 space-y-4 border-t border-border pt-5"><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-name">What is it?</label><input id="scenario-name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></div><div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-amount">{kind === "card" ? "Payment reduction" : "Amount"}</label><input id="scenario-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono" /></div><div><label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="scenario-date">Date</label><input id="scenario-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" /></div></div></div>
        <p className="mt-5 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground"><RotateCcw className="mr-1 inline h-3.5 w-3.5 text-primary" />Temporary until saved. Adjust the amount or date without changing your real forecast.</p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-muted-foreground">If you make this change</p><h2 className="mt-1 text-lg font-semibold">{decisionText} on {decisionDate}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${conditionTone}`}>{conditionLabel}</span></div>
        <p className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">What the lines mean:</span> gray is your current plan. Orange is your balance after this one change.</p>
        <div className="mt-4 h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 16, right: 12, left: -4, bottom: 0 }}><XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} /><YAxis domain={domain} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 100_000 ? `$${(value / 100_000).toFixed(1)}k` : `$${Math.round(value / 100)}`} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "4 4" }} /><ReferenceLine x={decisionDate} stroke="hsl(var(--primary))" strokeDasharray="3 4" label={{ value: "Your change", position: "insideTopLeft", fontSize: 10 }} /><ReferenceLine y={data.safetyBufferCents} stroke="hsl(var(--fs-amber))" strokeDasharray="5 4" label={{ value: "Buffer", position: "insideBottomLeft", fontSize: 10 }} /><Area type="monotone" dataKey="after" stroke="hsl(var(--primary))" strokeWidth={2.75} fill="hsl(var(--primary) / 0.10)" name="With change" animationDuration={550} /><Line type="monotone" dataKey="before" stroke="#64748B" strokeDasharray="6 4" strokeWidth={2} dot={false} name="Current plan" isAnimationActive={false} />{lowPoint && <ReferenceDot x={new Date(`${lowPoint.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} y={lowPoint.endingBalanceCents} r={5} fill="hsl(var(--primary))" stroke="#fff" strokeWidth={2} />}</AreaChart></ResponsiveContainer></div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4"><div><p className="text-[10px] text-muted-foreground">Safe to Spend</p><p className="mt-1 font-mono font-semibold">{money(comparison?.scenario.safeToSpendCents ?? 0)}</p><p className="mt-1 text-[10px] text-muted-foreground">{delta >= 0 ? "+" : "−"}{money(Math.abs(delta))} from this change</p></div><div><p className="text-[10px] text-muted-foreground">Projected low</p><p className="mt-1 font-mono font-semibold">{money(comparison?.scenario.lowestBalanceCents ?? 0)}</p></div><div className="rounded-lg bg-primary/[0.04] px-2 py-1"><p className="text-[10px] text-muted-foreground">● Low point on chart</p><p className="mt-1 text-sm font-medium">{comparison?.scenario.lowestBalanceDate}</p></div><div><p className="text-[10px] text-muted-foreground">Buffer</p><p className="mt-1 text-sm font-medium">{comparison?.riskChanged ? "At risk" : "Protected"}</p></div></div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={saveScenario} disabled={saving || !scenarioCents || kind === "card" || saved} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45">{saving ? "Saving…" : saved ? "Saved" : kind === "card" ? "Card estimate is temporary" : "Save as a real transaction"}<ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => setHeld(true)} className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground">Keep temporary</button><button type="button" onClick={() => { setAmount("480"); setDate(new Date().toISOString().slice(0, 10)); setName("Weekend trip"); setKind("purchase"); setSaved(false); setHeld(false); setError(null) }} className="rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground">Remove</button></div>
      </section>
    </div>
  </main>
}
