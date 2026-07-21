"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  CartesianGrid, Cell,
} from "recharts"
import {
  TrendingUp, Plus, Upload, AlertTriangle,
  CheckCircle, ChevronRight, ArrowUpRight, ArrowDownRight, X,
  Sparkles, CalendarDays, Pencil, GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DashboardForecast } from "@/lib/data/forecast"
import { confirmForecastEstimate, deleteForecastTransaction, recordForecastVisit, skipForecastOccurrence, stopRecurringEvent, updateForecastEvent, updateSafetyBuffer, type ForecastEventUpdate } from "@/app/app/forecast/actions"
import { runScenario } from "@/lib/forecast/scenarios"
import { determineForecastCondition } from "@/lib/forecast/condition"

/* ── DATA ── */

/* ── Tooltip ── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  const val = payload.find(p => p.value != null)
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground font-mono">${val?.value?.toLocaleString()}</p>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}

/* ── Component ── */

export function ForecastView({ name, data, view = "dashboard" }: {
  name: string
  data: DashboardForecast | null
  view?: "dashboard" | "forecast"
}) {
  const router = useRouter()
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventSaveError, setEventSaveError] = useState<string | null>(null)
  const [savingEvent, setSavingEvent] = useState(false)
  const [bufferPreviewCents, setBufferPreviewCents] = useState<number | null>(null)
  const [savingBuffer, setSavingBuffer] = useState(false)
  const [bufferMessage, setBufferMessage] = useState<string | null>(null)
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [scenarioName, setScenarioName] = useState("One-time purchase")
  const [scenarioAmount, setScenarioAmount] = useState("500")
  const [lastEventUndo, setLastEventUndo] = useState<ForecastEventUpdate | null>(null)
  const [eventActionMessage, setEventActionMessage] = useState<string | null>(null)
  const [showWorkOpen, setShowWorkOpen] = useState(false)

  useEffect(() => {
    if (!data) return
    const events = data.forecast.days.flatMap((day) => day.events.map((event) => ({ id: event.id, date: event.date, name: event.name, amountCents: event.amountCents, confidence: event.confidence, source: event.source })))
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    void recordForecastVisit({ timezone, startDate: data.input.settings.startDate, startingBalanceCents: data.input.startingBalanceCents, safetyBufferCents: data.input.settings.safetyBufferCents, safeToSpendCents: data.forecast.safeToSpendCents, lowestBalanceCents: data.forecast.lowestBalanceCents, lowestBalanceDate: data.forecast.lowestBalanceDate, days: data.forecast.days.map((day) => ({ date: day.date, endingBalanceCents: day.endingBalanceCents })), events }).then(() => {
      if (timezone !== data.timezone) router.refresh()
    })
  }, [data, router])

  useEffect(() => {
    if (!selectedDate) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedDate(null)
        setEditingEventId(null)
      }
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [selectedDate])

  async function finishEventAction(action: Promise<{ ok: true } | { ok: false; message: string }>, success: string) {
    setSavingEvent(true)
    setEventActionMessage(null)
    const result = await action
    setSavingEvent(false)
    if (!result.ok) { setEventSaveError(result.message); return }
    setEditingEventId(null)
    setEventActionMessage(success)
    router.refresh()
  }

  if (!data) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Good {getTimeOfDay()}, {name}</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/app/transactions?import=1"><Upload className="h-4 w-4" /> Import CSV</Link></Button>
            <Button asChild size="sm"><Link href="/app/accounts"><Plus className="h-4 w-4" /> Add account</Link></Button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your forecast starts here</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Import a CSV or add your current balance, upcoming income, and bills to see the next 30 days.
          </p>
          <div className="flex gap-3">
            <Button asChild><Link href="/app/accounts"><Plus className="h-4 w-4" /> Add your first account</Link></Button>
            <Button asChild variant="outline"><Link href="/app/transactions?import=1"><Upload className="h-4 w-4" /> Import CSV</Link></Button>
          </div>
        </div>
      </div>
    )
  }

  const money = (cents: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100)
  const forecastData = data.forecast.days.map((day) => ({
    date: day.date,
    day: new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    projected: day.endingBalanceCents / 100,
  }))
  const endDate = forecastData.at(-1)?.day ?? ""
  const totalIncomeCents = data.forecast.days.flatMap((day) => day.events)
    .filter((event) => event.amountCents > 0)
    .reduce((sum, event) => sum + event.amountCents, 0)
  const totalSpendingCents = Math.abs(data.forecast.days.flatMap((day) => day.events)
    .filter((event) => event.amountCents < 0)
    .reduce((sum, event) => sum + event.amountCents, 0))
  const riskAlerts = data.preferences.alertSafetyBuffer ? data.forecast.risks.map((risk) => ({
    msg: `Balance may reach ${money(risk.balanceCents)} on ${new Date(`${risk.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
    type: "warn",
  })) : []
  const balanceAgeDays = data.freshness.balanceAgeDays
  const alerts = [
    ...riskAlerts,
    ...(data.preferences.alertStaleBalance && balanceAgeDays >= 7 ? [{ msg: `Your current balance was last updated ${balanceAgeDays} days ago. Refresh it to keep the forecast grounded.`, type: "info" }] : []),
  ]
  const visibleAlerts = alerts.filter((_, i) => !dismissedAlerts.includes(i))
  const lowestDate = new Date(`${data.forecast.lowestBalanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const condition = determineForecastCondition(data.forecast, data.safetyBufferCents, data.freshness.status)
  const hasRisk = condition === "tight"
  const resultTitle = condition === "update_needed"
    ? "Update your balance before relying on this forecast."
    : condition === "tight"
    ? `Your balance may fall below your safety buffer on ${lowestDate}.`
    : condition === "watch"
      ? `Your balance may feel tight around ${lowestDate}.`
      : "You’re on track for the next 30 days."
  const resultDetail = `Your lowest projected balance is ${money(data.forecast.lowestBalanceCents)} on ${lowestDate}.`
  const resultExplanation = data.forecast.explanations[0]?.headline
  const effectiveBufferCents = bufferPreviewCents ?? data.safetyBufferCents
  const previewSafeToSpendCents = Math.max(0, data.forecast.lowestBalanceCents - effectiveBufferCents)
  const allForecastEvents = data.forecast.days.flatMap((day) => day.events.map((event) => ({ ...event, day: day.date })))
  const confirmedEventCount = allForecastEvents.filter((event) => event.confidence === "confirmed").length
  const estimatedEventCount = allForecastEvents.filter((event) => event.confidence === "estimated").length
  const coverageState = confirmedEventCount === 0
    ? "Let’s add more detail"
    : estimatedEventCount > confirmedEventCount
      ? "Needs a quick check"
      : estimatedEventCount > 0
        ? "Looking good"
        : "Ready to go"
  const selectedDay = selectedDate ? data.forecast.days.find((day) => day.date === selectedDate) : null
  const editingEvent = selectedDay?.events.find((event) => event.id === editingEventId) ?? null
  const scenarioAmountCents = Math.round((Number(scenarioAmount) || 0) * 100)
  const scenarioComparison = selectedDay && scenarioOpen && scenarioAmountCents > 0
    ? runScenario(data.input, [{
        id: "scenario:preview",
        name: scenarioName.trim() || "Scenario expense",
        date: selectedDay.date,
        amountCents: -scenarioAmountCents,
        type: "expense",
        source: "scenario",
        confidence: "confirmed",
      }])
    : null
  const upcoming = allForecastEvents
    .slice(0, 6)
    .map((event) => ({
      id: event.id,
      day: event.day,
      name: event.name,
      amount: `${event.confidence === "estimated" ? "~" : ""}${event.amountCents > 0 ? "+" : "–"}${money(Math.abs(event.amountCents))}`,
      days: `${new Date(`${event.day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${event.confidence === "estimated" ? " · estimated" : ""}`,
      color: event.amountCents > 0 ? "text-primary" : "text-red-400",
      dot: event.amountCents > 0 ? "bg-primary" : "bg-red-400",
    }))
  const firstUpcoming = upcoming[0]
  const dashboardContext = data.preferences.dashboardEmphasis === "calendar" && firstUpcoming
    ? `Next: ${firstUpcoming.name} on ${firstUpcoming.days.split(" · ")[0]}.`
    : data.preferences.dashboardEmphasis === "decision"
      ? `${money(data.forecast.safeToSpendCents)} is currently safe to spend after known commitments and your buffer.`
      : `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · Here’s your financial picture.`
  const safeToSpendChange = data.previousForecast.safeToSpendCents === null ? null : data.forecast.safeToSpendCents - data.previousForecast.safeToSpendCents
  const changeSummary = safeToSpendChange === null
    ? "This is your first saved forecast snapshot."
    : safeToSpendChange === 0
      ? "Your Safe to Spend amount hasn’t changed since your last visit."
      : `Since your last visit, Safe to Spend ${safeToSpendChange > 0 ? "increased" : "decreased"} by ${money(Math.abs(safeToSpendChange))}.`
  const spendingChartData = data.spendingHistory.weeks.map((week, index) => ({
    label: new Date(`${week.startDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    spending: week.spendingCents / 100,
    recent: index >= 4,
  }))
  const spendingChange = data.spendingHistory.changePercent
  const spendingTrendText = spendingChange === null
    ? "More history is needed for a reliable comparison."
    : spendingChange === 0
      ? "Spending is unchanged from the previous four weeks."
      : `Spending is ${Math.abs(spendingChange)}% ${spendingChange > 0 ? "higher" : "lower"} than the previous four weeks.`

  return (
    <div className={`${data.preferences.dashboardDensity === "compact" ? "px-4 lg:px-6 py-4 space-y-3" : "px-5 lg:px-7 py-6 space-y-5"} max-w-[1200px] mx-auto`}>
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[26px] font-extrabold tracking-tight leading-tight">
            {view === "dashboard" ? `Good ${getTimeOfDay()}, ${name}.` : "Your 30-day forecast"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === "dashboard"
              ? dashboardContext
              : "Explore exactly what happens to your balance and why."}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1.5 rounded-full">
          <Sparkles className="h-2.5 w-2.5" />
          <span>Calculated from your latest details</span>
        </div>
      </div>

      {/* Primary forecast result */}
      <section className={`rounded-2xl border p-5 ${hasRisk ? "border-yellow-500/30 bg-yellow-500/[0.07]" : "border-primary/25 bg-primary/[0.07]"}`}>
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-current/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider mb-3">{condition === "update_needed" ? "Update needed" : condition === "tight" ? "Tight" : condition === "watch" ? "Watch" : "Clear"}</span>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono mb-2">Your forecast result</p>
          <h3 className="text-xl font-semibold tracking-tight">{resultTitle}</h3>
          <p className="text-sm text-muted-foreground mt-2">{resultDetail}</p>
          {resultExplanation && <p className="text-sm text-muted-foreground mt-1">{resultExplanation}</p>}
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60">{changeSummary}</p>
        </div>
      </section>

      {/* Alerts */}
      {view === "dashboard" && visibleAlerts.length > 0 && (
        <div className="space-y-2">
          {visibleAlerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                alert.type === "warn"
                  ? "bg-yellow-500/[0.08] border-yellow-500/20"
                  : alert.type === "ok"
                  ? "bg-primary/[0.08] border-primary/20"
                  : "bg-blue-500/[0.08] border-blue-500/20"
              }`}
            >
              {alert.type === "ok"
                ? <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                : <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${alert.type === "warn" ? "text-yellow-400" : "text-blue-400"}`} />
              }
              <p className="text-muted-foreground flex-1 leading-relaxed">{alert.msg}</p>
              <button
                onClick={() => setDismissedAlerts(p => [...p, alerts.indexOf(alert)])}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      {view === "dashboard" && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Current Balance", value: money(data.currentBalanceCents), sub: "Across active accounts", color: "text-foreground", trend: null },
          { label: "Safe to Spend", value: money(data.forecast.safeToSpendCents), sub: "After commitments and buffer", color: "text-primary", trend: null },
          { label: "Income (30 days)", value: money(totalIncomeCents), sub: "Confirmed and recurring", color: "text-foreground", trend: "up" as const },
          { label: "Spending (30 days)", value: money(totalSpendingCents), sub: "Confirmed and recurring", color: "text-foreground", trend: "up-bad" as const },
        ].map(({ label, value, sub, color, trend }) => (
          <div key={label} className="bg-card border border-border rounded-2xl px-4 py-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">{label}</p>
            <div className="flex items-end justify-between gap-2">
              <p className={`text-xl font-bold ${color} leading-none font-mono`}>{value}</p>
              {trend && (
                <div className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-primary" : "text-destructive"}`}>
                  {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{sub}</p>
          </div>
        ))}
      </div>}

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Forecast chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold">Cash Flow Forecast</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Projected through {endDate}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-mono">30 days</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-5 h-px bg-blue-400 inline-block" />Actual
              </span>
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <span className="w-5 border-t border-dashed border-primary inline-block" />Projected
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />Today
              </span>
            </div>

            <ResponsiveContainer width="100%" height={view === "forecast" ? 320 : 200}>
              <AreaChart
                data={forecastData}
                margin={{ top: 5, right: 5, left: -18, bottom: 0 }}
                className="cursor-pointer"
                onClick={(state) => {
                  const label = state?.activeLabel
                  const matched = forecastData.find((item) => item.day === label)
                  if (matched) setSelectedDate(matched.date)
                }}
              >
                <defs>
                  <linearGradient id="dashGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5573ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5573ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#5c6b8a" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#5c6b8a" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine x={forecastData[0]?.day} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} />
                <Area type="monotone" dataKey="projected" stroke="hsl(142, 71%, 45%)" strokeWidth={2} strokeDasharray="5 3" fill="url(#dashGrad2)" dot={false} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {view === "forecast" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold">Daily balance details</h3>
                <p className="text-xs text-muted-foreground mt-1">Choose a day to review or adjust the activity behind it.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                    <tr className="border-b border-border"><th className="px-5 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium text-right">Change</th><th className="px-5 py-3 font-medium text-right">Ending balance</th></tr>
                  </thead>
                  <tbody>
                    {data.forecast.days.map((day) => (
                      <tr key={day.date} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3"><button type="button" onClick={() => setSelectedDate(day.date)} className="font-medium text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</button></td>
                        <td className={`px-4 py-3 text-right font-mono ${day.netChangeCents >= 0 ? "text-primary" : "text-destructive"}`}>{day.netChangeCents >= 0 ? "+" : "−"}{money(Math.abs(day.netChangeCents))}</td>
                        <td className="px-5 py-3 text-right font-semibold font-mono">{money(day.endingBalanceCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transaction history */}
          {view === "dashboard" && data.preferences.showSpendingHistory && <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-semibold">Spending History</h3>
                <p className="text-xs text-muted-foreground mt-1">Actual spending from imported transactions over the last eight weeks.</p>
              </div>
              <Link href="/app/transactions" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
                View transactions <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {data.spendingHistory.transactionCount === 0 ? (
              <div className="rounded-xl bg-muted/40 px-4 py-6 text-center"><p className="text-sm text-muted-foreground">No spending was found in the last eight weeks.</p><Link href="/app/transactions?import=1" className="inline-flex text-xs text-primary mt-2 hover:underline">Import more history</Link></div>
            ) : <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Last 4 weeks</p><p className="text-lg font-bold font-mono mt-1">{money(data.spendingHistory.recentFourWeeksCents)}</p></div>
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Previous 4 weeks</p><p className="text-lg font-bold font-mono mt-1">{money(data.spendingHistory.previousFourWeeksCents)}</p></div>
              </div>
              <div className="h-[180px]" role="img" aria-label={`Weekly spending chart. ${spendingTrendText}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5c6b8a" }} tickLine={false} axisLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#5c6b8a" }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="spending" radius={[4, 4, 0, 0]}>{spendingChartData.map((item, index) => <Cell key={`${item.label}-${index}`} fill={item.recent ? "hsl(252, 83%, 67%)" : "hsl(220, 15%, 35%)"} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className={`text-xs mt-3 ${spendingChange !== null && spendingChange > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>{spendingTrendText}</p>
            </>}
          </div>}

          {view === "forecast" && <div className="bg-card border border-border rounded-2xl p-5"><h3 className="text-sm font-semibold mb-3">How the forecast works</h3><p className="text-sm text-muted-foreground leading-relaxed">Each day begins with the previous day’s projected balance. FlowSight then adds confirmed and estimated income, subtracts known bills and spending, and carries the result into the next day. Temporary scenarios are kept separate until you decide to save a real change.</p></div>}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Safe to spend */}
          {view === "dashboard" && <div className="bg-card border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Safe to Spend</p>
            <p className="text-[36px] font-extrabold text-primary leading-none mb-1 font-mono">{money(data.forecast.safeToSpendCents)}</p>
            <p className="text-xs text-muted-foreground mb-5">After committed outflows</p>
            <div className="space-y-2">
              {[
                { label: "Current balance", value: money(data.currentBalanceCents), color: "text-foreground" },
                { label: "30-day income", value: money(totalIncomeCents), color: "text-primary" },
                { label: "30-day commitments", value: `–${money(totalSpendingCents)}`, color: "text-red-400" },
                { label: "Lowest projected balance", value: money(data.forecast.lowestBalanceCents), color: "text-muted-foreground" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-xs font-medium font-mono ${color}`}>{value}</span>
                </div>
              ))}
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">Safe to spend</span>
                <span className="text-sm font-bold text-primary font-mono">{money(previewSafeToSpendCents)}</span>
              </div>
            </div>
            <div className="border-t border-border mt-5 pt-5">
              <div className="flex items-center justify-between mb-2"><label htmlFor="buffer-preview" className="text-xs font-semibold">Safety buffer</label><span className="text-xs font-mono text-foreground">{money(effectiveBufferCents)}</span></div>
              <input id="buffer-preview" type="range" min={0} max={Math.max(100000, Math.ceil(data.forecast.lowestBalanceCents / 10000) * 10000)} step={5000} value={effectiveBufferCents} onChange={(event) => { setBufferPreviewCents(Number(event.target.value)); setBufferMessage(null) }} className="w-full accent-primary" />
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">Preview how much remains safe to spend while keeping this amount available.</p>
              {bufferPreviewCents !== null && bufferPreviewCents !== data.safetyBufferCents && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1" disabled={savingBuffer} onClick={async () => {
                    setSavingBuffer(true)
                    const result = await updateSafetyBuffer(bufferPreviewCents)
                    setSavingBuffer(false)
                    if (!result.ok) { setBufferMessage(result.message); return }
                    setBufferMessage("Safety buffer saved. Your forecast has been recalculated.")
                    setBufferPreviewCents(null)
                    router.refresh()
                  }}>{savingBuffer ? "Saving…" : "Keep this buffer"}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setBufferPreviewCents(null); setBufferMessage(null) }}>Reset</Button>
                </div>
              )}
              {bufferMessage && <p className="text-[11px] text-muted-foreground mt-2">{bufferMessage}</p>}
            </div>
            <div className="border-t border-border mt-5 pt-4 relative">
              {showWorkOpen && <div className="mt-4"><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Today’s opening balance</p>{data.balanceRollForward.map((item) => <div key={item.accountName} className="rounded-lg border border-border p-2 mb-2 text-xs"><p className="font-medium mb-1">{item.accountName}</p><p className="text-muted-foreground">{money(item.anchorBalanceCents)} as of {new Date(`${item.anchorDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {item.activityCents >= 0 ? "+" : "−"} {money(Math.abs(item.activityCents))} later activity = <span className="text-foreground font-mono">{money(item.openingBalanceCents)}</span></p></div>)}</div>}
              <button type="button" className="w-full flex items-center justify-between text-sm font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" onClick={() => setShowWorkOpen((open) => !open)} aria-expanded={showWorkOpen} aria-controls="safe-to-spend-work"><span>Show your work</span><ChevronRight className={`h-4 w-4 transition-transform ${showWorkOpen ? "rotate-90" : ""}`} /></button>
              {showWorkOpen && <div id="safe-to-spend-work" className="mt-4 space-y-4"><p className="text-xs text-muted-foreground leading-relaxed">Safe to Spend uses the lowest balance in your 30-day forecast, then protects your safety buffer.</p><div className="rounded-xl bg-muted/50 p-3 space-y-2"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Lowest projected balance</span><span className="font-mono">{money(data.forecast.lowestBalanceCents)}</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Protected safety buffer</span><span className="font-mono">−{money(effectiveBufferCents)}</span></div><div className="border-t border-border pt-2 flex justify-between text-xs font-semibold"><span>Safe to Spend</span><span className="font-mono text-primary">{money(previewSafeToSpendCents)}</span></div></div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Included events</p><div className="grid grid-cols-2 gap-2"><div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono">{confirmedEventCount}</p><p className="text-[10px] text-muted-foreground">Confirmed</p></div><div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono">{estimatedEventCount}</p><p className="text-[10px] text-muted-foreground">Estimated</p></div></div></div>{data.excludedEvents.length > 0 && <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Excluded or skipped</p>{data.excludedEvents.map((event) => <div key={`${event.name}-${event.date}`} className="flex justify-between gap-2 text-xs py-1"><span className="text-muted-foreground truncate">{event.name} · {new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><span className="font-mono">{money(Math.abs(event.amountCents))}</span></div>)}</div>}<div className={`rounded-lg p-3 text-xs ${data.freshness.status === "stale" ? "bg-yellow-500/10 text-yellow-300" : "bg-muted/50 text-muted-foreground"}`}><p className="font-medium text-foreground">Data freshness: {data.freshness.status === "fresh" ? "Fresh" : data.freshness.status === "aging" ? "Getting older" : "Update needed"}</p><p className="mt-1">Balance dated {new Date(`${data.currentBalanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{balanceAgeDays > 0 ? ` · ${balanceAgeDays} days ago` : " · today"}.</p>{data.freshness.status === "stale" && <Link href="/app/accounts" className="inline-flex mt-2 text-foreground underline underline-offset-2">Update account balance</Link>}</div></div>}
            </div>
          </div>}

          {/* Upcoming */}
          {view === "dashboard" && <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcoming.length === 0 && (
                <p className="text-xs text-muted-foreground">No recurring events in this forecast window.</p>
              )}
              {upcoming.map(({ id, day, name, amount, days, color, dot }) => (
                <button key={id} type="button" onClick={() => setSelectedDate(day)} className="w-full flex items-center gap-3 text-left rounded-lg hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring p-1 -m-1 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{days}</p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 font-mono ${color}`}>{amount}</span>
                </button>
              ))}
            </div>
          </div>}

          {/* Spending breakdown */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4"><div><h3 className="text-sm font-semibold">Spending This Month</h3><p className="text-xs text-muted-foreground mt-1">Actual imported expenses by category.</p></div><span className="text-sm font-bold font-mono">{money(data.monthlySpending.totalCents)}</span></div>
            {data.monthlySpending.categories.length === 0 ? <p className="text-xs text-muted-foreground leading-relaxed">No spending was found for this month.</p> : <div className="space-y-3">{data.monthlySpending.categories.slice(0, 6).map((category) => { const percent = data.monthlySpending.totalCents === 0 ? 0 : Math.round(category.amountCents / data.monthlySpending.totalCents * 100); return <div key={category.name}><div className="flex items-center justify-between gap-3 mb-1.5"><span className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</span><span className="text-xs font-mono text-muted-foreground">{money(category.amountCents)} · {percent}%</span></div><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: category.color }} /></div></div>})}<Link href="/app/transactions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1">Review categories <ChevronRight className="h-3 w-3" /></Link></div>}
          </div>

          {/* Forecast coverage */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">What this forecast knows</h3>
              <span className="text-primary font-semibold text-sm">{coverageState}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We’ve included {confirmedEventCount} confirmed {confirmedEventCount === 1 ? "event" : "events"} and {estimatedEventCount} {estimatedEventCount === 1 ? "estimate" : "estimates"} over the next 30 days.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "Forecast events", value: String(data.forecast.days.flatMap((day) => day.events).length) },
                { label: "Below-buffer days", value: String(data.forecast.risks.length) },
                { label: "Lowest point", value: money(data.forecast.lowestBalanceCents) },
                { label: "Through", value: endDate },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-xs font-semibold font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold">Forecast track record</h3>
            {data.trackRecord.eligibleDays === 0 ? <p className="text-xs text-muted-foreground leading-relaxed mt-2">Measurement starts after you refresh every active account balance for a date that an earlier forecast covered. We won’t score days without enough actual data.</p> : <div className="mt-3 space-y-3"><div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-muted/50 p-3"><p className="text-lg font-bold font-mono">{data.trackRecord.eligibleDays}</p><p className="text-[10px] text-muted-foreground">Evaluated days</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-lg font-bold font-mono">{money(data.trackRecord.meanAbsoluteErrorCents ?? 0)}</p><p className="text-[10px] text-muted-foreground">Typical absolute error</p></div></div>{data.trackRecord.latest && <p className="text-xs text-muted-foreground">Latest evaluation: projected {money(data.trackRecord.latest.projectedBalanceCents)} and observed {money(data.trackRecord.latest.actualBalanceCents)} on {new Date(`${data.trackRecord.latest.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.</p>}</div>}
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Daily forecast details">
          <button type="button" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => { setSelectedDate(null); setEditingEventId(null) }} aria-label="Close daily forecast details" />
          <aside className="relative h-full w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto p-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between gap-4 mb-7">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-mono mb-2">Daily forecast</p>
                <h2 className="text-2xl font-bold tracking-tight">{new Date(`${selectedDay.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedDate(null); setEditingEventId(null) }} aria-label="Close"><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-7">
              <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground mb-1">Opening balance</p><p className="font-semibold font-mono">{money(selectedDay.openingBalanceCents)}</p></div>
              <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground mb-1">Ending balance</p><p className="font-semibold font-mono">{money(selectedDay.endingBalanceCents)}</p></div>
            </div>

            <div className="mb-7">
              <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">What changes that day</h3><span className={`text-sm font-semibold font-mono ${selectedDay.netChangeCents >= 0 ? "text-primary" : "text-destructive"}`}>{selectedDay.netChangeCents >= 0 ? "+" : "−"}{money(Math.abs(selectedDay.netChangeCents))}</span></div>
              {selectedDay.events.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border p-4">No income or bills are expected that day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDay.events.map((event) => (
                    <button key={event.id} type="button" onClick={() => { setEditingEventId(event.id); setEventSaveError(null) }} className="w-full rounded-xl border border-border p-4 flex items-start gap-3 text-left hover:border-primary/30 hover:bg-primary/[0.04] transition-colors">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${event.amountCents >= 0 ? "bg-primary" : "bg-destructive"}`} />
                      <div className="flex-1 min-w-0"><p className="font-medium truncate">{event.name}</p><p className="text-xs text-muted-foreground mt-1 capitalize">{event.confidence} · {event.recurring ? "Recurring" : event.source}</p>{event.confidence === "estimated" && event.estimateEvidence && <p className="text-[11px] text-muted-foreground mt-1">Based on {event.estimateEvidence.occurrenceCount} occurrences ranging {money(event.estimateEvidence.minAmountCents)}–{money(event.estimateEvidence.maxAmountCents)}.</p>}</div>
                      <div className="text-right"><span className={`font-semibold font-mono ${event.amountCents >= 0 ? "text-primary" : "text-destructive"}`}>{event.amountCents >= 0 ? "+" : "−"}{money(Math.abs(event.amountCents))}</span><p className="text-[10px] text-muted-foreground mt-1">Edit</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {editingEvent && (
              <form
                key={editingEvent.id}
                className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 mb-7 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const formData = new FormData(event.currentTarget)
                  const amount = Math.round(Number(formData.get("amount")) * 100)
                  const type = String(formData.get("type"))
                  setLastEventUndo({ eventId: editingEvent.id, name: editingEvent.name, amountCents: editingEvent.amountCents, date: selectedDay.date, confidence: editingEvent.confidence })
                  setSavingEvent(true)
                  setEventSaveError(null)
                  const result = await updateForecastEvent({
                    eventId: editingEvent.id,
                    name: String(formData.get("name")),
                    amountCents: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
                    date: String(formData.get("date")),
                    confidence: String(formData.get("confidence")) === "estimated" ? "estimated" : "confirmed",
                  })
                  setSavingEvent(false)
                  if (!result.ok) { setEventSaveError(result.message); return }
                  setEditingEventId(null)
                  router.refresh()
                }}
              >
                <div className="flex items-center justify-between"><h3 className="font-semibold">Edit forecast event</h3><button type="button" onClick={() => setEditingEventId(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button></div>
                <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="event-name">Name</label><input id="event-name" name="name" defaultValue={editingEvent.name} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="event-amount">Amount</label><input id="event-amount" name="amount" type="number" min="0.01" step="0.01" defaultValue={(Math.abs(editingEvent.amountCents) / 100).toFixed(2)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" required /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="event-type">Type</label><select id="event-type" name="type" defaultValue={editingEvent.amountCents < 0 ? "expense" : "income"} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="expense">Expense</option><option value="income">Income</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="event-date">Date</label><input id="event-date" name="date" type="date" defaultValue={selectedDay.date} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="event-confidence">Status</label><select id="event-confidence" name="confidence" defaultValue={editingEvent.confidence} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="confirmed">Confirmed</option><option value="estimated">Estimated</option></select></div>
                </div>
                {eventSaveError && <p className="text-sm text-destructive">{eventSaveError}</p>}
                <Button type="submit" className="w-full" disabled={savingEvent}>{savingEvent ? "Saving and recalculating…" : "Save and recalculate"}</Button>
                <div className="flex flex-wrap gap-2 pt-1">
                  {editingEvent.confidence === "estimated" && <Button type="button" size="sm" variant="outline" disabled={savingEvent} onClick={() => finishEventAction(confirmForecastEstimate(editingEvent.id), "Estimate confirmed and forecast recalculated.")}>Confirm estimate</Button>}
                  {editingEvent.recurring ? <><Button type="button" size="sm" variant="outline" disabled={savingEvent} onClick={() => finishEventAction(skipForecastOccurrence(editingEvent.id), "This occurrence was skipped.")}>Skip this occurrence</Button><Button type="button" size="sm" variant="outline" disabled={savingEvent} onClick={() => { if (window.confirm("Stop all future occurrences of this recurring event?")) void finishEventAction(stopRecurringEvent(editingEvent.id), "Future occurrences were stopped.") }}>Stop repeating</Button></> : <Button type="button" size="sm" variant="outline" disabled={savingEvent} className="text-destructive" onClick={() => { if (window.confirm("Delete this transaction? This can’t be undone.")) void finishEventAction(deleteForecastTransaction(editingEvent.id), "Transaction deleted.") }}>Delete transaction</Button>}
                </div>
              </form>
            )}

            {(eventActionMessage || lastEventUndo) && <div className="rounded-xl border border-border bg-muted/40 p-4 mb-7 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{eventActionMessage ?? "Forecast recalculated."}</p>{lastEventUndo && <Button size="sm" variant="outline" disabled={savingEvent} onClick={async () => { await finishEventAction(updateForecastEvent(lastEventUndo), "Your last event edit was undone."); setLastEventUndo(null) }}>Undo edit</Button>}</div>}

            <div className="rounded-xl bg-muted/40 p-4 mb-7">
              <div className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">How this balance is calculated</h3></div>
              <p className="text-sm text-muted-foreground leading-relaxed">{money(selectedDay.openingBalanceCents)} opening balance {selectedDay.netChangeCents >= 0 ? "+" : "−"} {money(Math.abs(selectedDay.netChangeCents))} in known activity = {money(selectedDay.endingBalanceCents)} projected balance.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" disabled={selectedDay.events.length === 0} onClick={() => setEditingEventId(selectedDay.events[0]?.id ?? null)}><Pencil className="h-4 w-4" /> Edit events</Button>
              <Button variant="outline" className="flex-1" onClick={() => setScenarioOpen((value) => !value)}><GitBranch className="h-4 w-4" /> Try a scenario</Button>
            </div>

            {scenarioOpen && (
              <div className="rounded-2xl border border-border bg-muted/30 p-4 mt-4 space-y-4">
                <div><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-mono mb-1">Temporary scenario</p><h3 className="font-semibold">What if I spend money that day?</h3></div>
                <div><label htmlFor="scenario-name" className="text-xs text-muted-foreground block mb-1.5">What are you considering?</label><input id="scenario-name" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
                <div><label htmlFor="scenario-amount" className="text-xs text-muted-foreground block mb-1.5">Amount</label><input id="scenario-amount" type="number" min="1" step="1" value={scenarioAmount} onChange={(event) => setScenarioAmount(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" /></div>
                {scenarioComparison && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projected low before</span><span className="font-mono">{money(scenarioComparison.baseline.lowestBalanceCents)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projected low with scenario</span><span className="font-mono">{money(scenarioComparison.scenario.lowestBalanceCents)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Safe to Spend with scenario</span><span className="font-mono text-primary">{money(scenarioComparison.scenario.safeToSpendCents)}</span></div>
                    <p className={`text-sm rounded-lg p-3 ${scenarioComparison.scenario.risks.length > 0 ? "bg-yellow-500/10 text-yellow-300" : "bg-primary/10 text-foreground"}`}>
                      {scenarioComparison.scenario.risks.length > 0
                        ? `This would put your projected balance below your safety buffer. Your projected low would be ${money(scenarioComparison.scenario.lowestBalanceCents)}.`
                        : `Your forecast would remain above your safety buffer, with a projected low of ${money(scenarioComparison.scenario.lowestBalanceCents)}.`}
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">This preview does not change your real forecast data.</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
