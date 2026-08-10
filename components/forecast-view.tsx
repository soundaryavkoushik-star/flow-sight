"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine,
  CartesianGrid,
} from "recharts"
import {
  TrendingUp, Plus, Upload, AlertTriangle,
  ChevronRight, X,
  CalendarDays, Pencil, GitBranch,
  Info, WalletCards, ReceiptText, Landmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DashboardForecast } from "@/lib/data/forecast"
import { confirmForecastEstimate, deleteForecastTransaction, recordForecastVisit, skipForecastOccurrence, stopRecurringEvent, updateForecastEvent, updateSafetyBuffer, type ForecastEventUpdate } from "@/app/app/forecast/actions"
import { runScenario } from "@/lib/forecast/scenarios"
import { determineForecastCondition } from "@/lib/forecast/condition"
import { decisionRoomNote } from "@/lib/forecast/scenario-presentation"
import { amountColorClass, amountDotClass } from "@/lib/financial/amount-style"
import { ActionToast } from "@/components/ui/toast"
import { ConditionBanner, conditionTone, safeToSpendTone } from "@/components/condition-banner"

/* ── DATA ── */

/* ── Tooltip ── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  const val = payload.find(p => p.value != null)
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Projected balance</p>
      <p className="mt-0.5 font-semibold text-foreground font-mono">${val?.value?.toLocaleString()}</p>
    </div>
  )
}

function AnimatedMetric({ value, format = (metric) => Math.round(metric).toLocaleString() }: { value: number; format?: (metric: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      if (reduceMotion) {
        setDisplayed(value)
        return
      }
      const started = performance.now()
      const duration = 650
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayed(value * eased)
        if (progress < 1) window.requestAnimationFrame(tick)
      }
      window.requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{format(displayed)}</span>
}

function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setOpen(false)
        return
      }
      if (event instanceof PointerEvent && !containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", close)
    document.addEventListener("pointerdown", close)
    return () => {
      document.removeEventListener("keydown", close)
      document.removeEventListener("pointerdown", close)
    }
  }, [open])

  return (
    <span
      ref={containerRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 text-left text-xs font-normal leading-relaxed text-foreground shadow-xl"
        >
          {children}
        </span>
      )}
    </span>
  )
}

function LabelWithInfo({ label, explanation, infoLabel }: { label: string; explanation: string; infoLabel?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span>{label}</span>
      <InfoTip label={infoLabel ?? `Learn about ${label}`}>{explanation}</InfoTip>
    </span>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}

/* ── Component ── */

export function ForecastView({ name, data, view = "dashboard", initialSelectedDate = null }: {
  name: string
  data: DashboardForecast | null
  view?: "dashboard" | "forecast"
  initialSelectedDate?: string | null
}) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelectedDate)
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
  const [safeToSpendPulse, setSafeToSpendPulse] = useState(false)
  const previousSafeToSpend = useRef(
    data ? Math.max(0, data.forecast.lowestBalanceCents - (bufferPreviewCents ?? data.safetyBufferCents)) : null,
  )

  const displayedSafeToSpend = data
    ? Math.max(0, data.forecast.lowestBalanceCents - (bufferPreviewCents ?? data.safetyBufferCents))
    : null

  useEffect(() => {
    if (displayedSafeToSpend === null) return
    if (previousSafeToSpend.current === null) {
      previousSafeToSpend.current = displayedSafeToSpend
      return
    }
    if (previousSafeToSpend.current === displayedSafeToSpend) return
    previousSafeToSpend.current = displayedSafeToSpend
    setSafeToSpendPulse(false)
    const start = window.requestAnimationFrame(() => setSafeToSpendPulse(true))
    const stop = window.setTimeout(() => setSafeToSpendPulse(false), 760)
    return () => {
      window.cancelAnimationFrame(start)
      window.clearTimeout(stop)
    }
  }, [displayedSafeToSpend])

  useEffect(() => {
    if (!data) return
    const events = data.forecast.days.flatMap((day) => day.events.map((event) => ({ id: event.id, date: event.date, name: event.name, amountCents: event.amountCents, confidence: event.confidence, source: event.source })))
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    void recordForecastVisit({ timezone, accountIds: data.includedAccountIds, startDate: data.input.settings.startDate, startingBalanceCents: data.input.startingBalanceCents, safetyBufferCents: data.input.settings.safetyBufferCents, safeToSpendCents: data.forecast.safeToSpendCents, lowestBalanceCents: data.forecast.lowestBalanceCents, lowestBalanceDate: data.forecast.lowestBalanceDate, days: data.forecast.days.map((day) => ({ date: day.date, endingBalanceCents: day.endingBalanceCents })), events }).then(() => {
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

  function editForecastEvent(event: { id: string; recurring?: boolean }) {
    if (event.recurring && event.id.startsWith("recurring:")) {
      const recurringId = event.id.split(":")[1]
      router.push(`/app/transactions?tab=recurring&edit=${encodeURIComponent(recurringId)}`)
      return
    }
    setEditingEventId(event.id)
    setEventSaveError(null)
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
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:80ms] [animation-fill-mode:both]">Your forecast starts here</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:140ms] [animation-fill-mode:both]">
            Import a CSV or add your current balance, upcoming income, and bills to see the next 30 days.
          </p>
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 [animation-delay:200ms] [animation-fill-mode:both]">
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
  const horizonDays = data.forecast.days.length
  const forecastData = data.forecast.days.map((day) => ({
    date: day.date,
    day: new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    projected: day.endingBalanceCents / 100,
  }))
  const endDate = forecastData.at(-1)?.day ?? ""
  const riskAlerts = data.preferences.alertSafetyBuffer ? data.forecast.risks.map((risk) => ({
    msg: `Balance may reach ${money(risk.balanceCents)} on ${new Date(`${risk.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
    type: "warn",
  })) : []
  const balanceAgeDays = data.freshness.balanceAgeDays
  const alerts = [
    ...riskAlerts,
    ...(data.preferences.alertStaleBalance && balanceAgeDays >= 7 ? [{ msg: `Your balance was last updated ${balanceAgeDays} days ago. Refresh it before relying on Safe to Spend.`, type: "info" }] : []),
  ]
  const visibleAlerts = alerts.map((alert, index) => ({ ...alert, index }))
  const lowestDate = new Date(`${data.forecast.lowestBalanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const lowestDateShort = new Date(`${data.forecast.lowestBalanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const baselineWindowDays = 30
  const additionalHorizonDays = horizonDays - baselineWindowDays
  const horizonComparisonNote = additionalHorizonDays > 0
    ? (data.forecast.days.findIndex((day) => day.date === data.forecast.lowestBalanceDate) < baselineWindowDays
      ? `No lower point appears in the additional ${additionalHorizonDays} days.`
      : `A new low point appears within the additional ${additionalHorizonDays} days, later than your ${baselineWindowDays}-day forecast.`)
    : null
  const condition = determineForecastCondition(data.forecast, data.safetyBufferCents, data.freshness.status)
  const todayForecastDate = data.forecast.days[0]?.date ?? data.input.settings.startDate
  const conditionLabel = condition === "update_needed"
    ? "Update needed"
    : condition === "tight"
      ? "Tight · Below buffer"
      : condition === "watch"
        ? "Watch · Low point ahead"
        : "Clear"
  const scopedConditionLabel = view === "dashboard" && condition === "clear"
    ? `Clear · Next ${horizonDays} days`
    : conditionLabel
  const dashboardConditionLabel = condition === "update_needed"
    ? "Update needed"
    : condition === "tight"
      ? "Tight"
      : condition === "watch"
        ? "Watch"
        : "Clear"
  const dashboardConditionTone = condition === "tight"
    ? "text-[oklch(var(--fs-red))]"
    : condition === "watch"
      ? "text-[oklch(var(--fs-amber))]"
      : condition === "clear"
        ? "text-[oklch(var(--fs-green))]"
        : "text-muted-foreground"
  const resultTitle = condition === "update_needed"
    ? "Update your balance before relying on this forecast."
    : condition === "tight"
    ? `Your balance may fall below your safety buffer on ${lowestDate}.`
    : condition === "watch"
      ? `Your balance may feel tight around ${lowestDate}.`
      : `You’re on track for the next ${horizonDays} days.`
  const resultExplanation = data.forecast.explanations[0]?.headline
  const effectiveBufferCents = bufferPreviewCents ?? data.safetyBufferCents
  const previewSafeToSpendCents = Math.max(0, data.forecast.lowestBalanceCents - effectiveBufferCents)
  const allForecastEvents = data.forecast.days.flatMap((day) => day.events.map((event) => ({ ...event, day: day.date })))
  const confirmedEventCount = allForecastEvents.filter((event) => event.confidence === "confirmed").length
  const estimatedEventCount = allForecastEvents.filter((event) => event.confidence === "estimated").length
  const coverageState = "Forecast ready"
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
      isToday: event.day === todayForecastDate,
      name: event.name,
      amount: `${event.amountEstimated ? "~" : ""}${event.amountCents > 0 ? "+" : "–"}${money(Math.abs(event.amountCents))}`,
      days: `${event.day === todayForecastDate ? "Today · pending" : new Date(`${event.day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${event.confidence === "estimated" ? event.amountEstimated ? " · estimated" : " · date estimated" : ""}`,
      color: event.amountCents > 0 ? "text-[oklch(var(--fs-green))]" : "text-foreground",
      isIncome: event.amountCents > 0,
      iconTone: event.confidence === "estimated"
        ? "bg-[oklch(var(--fs-estimate-bg))] text-[oklch(var(--fs-estimate))]"
        : event.amountCents > 0
          ? "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]"
          : "bg-primary/[0.10] text-primary",
      rowTone: event.confidence === "estimated"
        ? "hover:bg-[oklch(var(--fs-estimate-bg))]/70"
        : event.amountCents > 0
          ? "hover:bg-[oklch(var(--fs-green-bg))]/65"
          : "hover:bg-muted/50",
    }))
  const firstUpcoming = upcoming[0]
  const safeToSpendChange = data.previousForecast.safeToSpendCents === null ? null : data.forecast.safeToSpendCents - data.previousForecast.safeToSpendCents
  const lowestBalanceChange = data.previousForecast.lowestBalanceCents === null ? null : data.forecast.lowestBalanceCents - data.previousForecast.lowestBalanceCents
  const briefingChanges: string[] = []
  const previousAccountIds = new Set(data.previousForecast.accountIds)
  const addedAccountCount = data.includedAccountIds.filter((accountId) => !previousAccountIds.has(accountId)).length
  if (data.previousForecast.viewedAt !== null && addedAccountCount > 0) briefingChanges.push(`${addedAccountCount} ${addedAccountCount === 1 ? "account is" : "accounts are"} now included in this forecast.`)
  if (safeToSpendChange !== null && safeToSpendChange !== 0) briefingChanges.push(`Safe to Spend ${safeToSpendChange > 0 ? "increased" : "decreased"} by ${money(Math.abs(safeToSpendChange))}.`)
  if (lowestBalanceChange !== null && lowestBalanceChange !== 0) briefingChanges.push(`Your projected low is ${money(Math.abs(lowestBalanceChange))} ${lowestBalanceChange > 0 ? "higher" : "lower"}.`)
  const maxWeeklySpendingCents = Math.max(1, ...data.spendingHistory.weeks.map((week) => week.spendingCents))
  const spendingChangeLabel = data.spendingHistory.changePercent === null
    ? "Not enough earlier history for a comparison."
    : data.spendingHistory.changePercent === 0
      ? "About the same as the previous four weeks."
      : `${Math.abs(data.spendingHistory.changePercent)}% ${data.spendingHistory.changePercent > 0 ? "more" : "less"} than the previous four weeks.`

  const lowPointIndex = Math.max(0, data.forecast.days.findIndex((day) => day.date === data.forecast.lowestBalanceDate))
  const daysThroughLow = data.forecast.days.slice(0, lowPointIndex + 1)
  const billWindow = daysThroughLow.reduce<{ start: number; end: number; totalCents: number; count: number } | null>((best, _, start) => {
    const windowDays = daysThroughLow.slice(start, Math.min(daysThroughLow.length, start + 7))
    const bills = windowDays.flatMap((day) => day.events).filter((event) => event.amountCents < 0)
    const candidate = { start, end: start + Math.max(0, windowDays.length - 1), totalCents: Math.abs(bills.reduce((sum, event) => sum + event.amountCents, 0)), count: bills.length }
    return !best || candidate.totalCents > best.totalCents ? candidate : best
  }, null)
  const nextPaydayDay = data.forecast.days.slice(lowPointIndex + 1).find((day) => day.events.some((event) => event.amountCents > 0)) ?? null
  const recoveryDay = data.forecast.days.slice(lowPointIndex + 1).find((day) => day.endingBalanceCents >= data.currentBalanceCents)
    ?? data.forecast.days.at(-1)
    ?? null
  const runwayDate = (date?: string | null) => date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—"
  const billWindowStart = billWindow ? daysThroughLow[billWindow.start]?.date : null
  const billWindowEnd = billWindow ? daysThroughLow[billWindow.end]?.date : null
  const billWindowDates = billWindowStart
    ? `${runwayDate(billWindowStart)}${billWindowEnd && billWindowEnd !== billWindowStart ? `–${runwayDate(billWindowEnd)}` : ""}`
    : "No cluster ahead"
  const recoveryLabel = recoveryDay?.endingBalanceCents !== undefined && recoveryDay.endingBalanceCents >= data.currentBalanceCents
    ? "Recovers"
    : "End of outlook"
  const runwayPoints = [
    { key: "today", label: "Today opens", value: money(data.currentBalanceCents), detail: runwayDate(todayForecastDate) },
    { key: "bills", label: billWindow && billWindow.count > 1 ? `${billWindow.count} bills cluster` : billWindow?.count === 1 ? "Next bill" : "No bill cluster", value: billWindow ? `−${money(billWindow.totalCents)}` : "Nothing due", detail: billWindowDates },
    { key: "low", label: "Lowest point", value: money(data.forecast.lowestBalanceCents), detail: runwayDate(data.forecast.lowestBalanceDate) },
    { key: "recovery", label: recoveryLabel, value: recoveryDay ? money(recoveryDay.endingBalanceCents) : money(data.forecast.lowestBalanceCents), detail: runwayDate(recoveryDay?.date) },
  ]
  const runwayCaption = billWindow && billWindow.count > 0 && nextPaydayDay
    ? `${billWindow.count === 1 ? "One bill lands" : `${billWindow.count} bills land`} before ${nextPaydayDay.events.find((event) => event.amountCents > 0)?.name ?? "your next income"} on ${runwayDate(nextPaydayDay.date)}.`
    : "See the events and timing behind your projected low point."
  const primaryRisk = data.forecast.risks[0]
  const primaryAlertMessage = visibleAlerts.length > 0
    ? (visibleAlerts[0].type === "warn" && primaryRisk && primaryRisk.date !== data.forecast.lowestBalanceDate
      ? `Crosses ${money(primaryRisk.balanceCents)} on ${runwayDate(primaryRisk.date)} · reaches ${money(data.forecast.lowestBalanceCents)} on ${runwayDate(data.forecast.lowestBalanceDate)}.`
      : visibleAlerts[0].msg)
    : null
  const bufferWatchMarginCents = Math.max(20_000, Math.round(data.safetyBufferCents * 0.25))
  const bufferMarginCents = data.forecast.lowestBalanceCents - data.safetyBufferCents
  const bufferStatus = !data.safetyBufferConfigured
    ? { label: "Not set", tone: "text-muted-foreground", value: "Protecting against $0 only", explanation: "You haven't set a safety buffer, so Cusp only protects your projected balance from going below $0." }
    : data.forecast.lowestBalanceCents < 0
      ? { label: "Breached", tone: "text-[oklch(var(--fs-red))]", value: `${money(Math.abs(data.forecast.lowestBalanceCents))} below $0`, explanation: `Your projected balance is expected to go below $0 at its lowest point, which is also below your ${money(data.safetyBufferCents)} buffer.` }
      : bufferMarginCents < 0
        ? { label: "Below buffer", tone: "text-[oklch(var(--fs-amber))]", value: `${money(Math.abs(bufferMarginCents))} below target`, explanation: `Your projected balance stays above $0, but is expected to drop ${money(Math.abs(bufferMarginCents))} below your ${money(data.safetyBufferCents)} buffer at its lowest point.` }
        : bufferMarginCents <= bufferWatchMarginCents
          ? { label: "Getting close", tone: "text-[oklch(var(--fs-amber))]", value: `${money(bufferMarginCents)} above buffer`, explanation: `Your projected balance is expected to stay above your ${money(data.safetyBufferCents)} buffer, but by only ${money(bufferMarginCents)} at its lowest point.` }
          : { label: "Intact", tone: "text-[oklch(var(--fs-green))]", value: `${money(data.safetyBufferCents)} protected`, explanation: `Your projected balance is expected to stay above your ${money(data.safetyBufferCents)} buffer through the end of this forecast.` }
  const lowPointEvents = daysThroughLow.flatMap((day) => day.events.map((event) => ({ ...event, day: day.date })))
  const cascadeGroupThreshold = 8
  const cascadeEvents = lowPointEvents.length <= cascadeGroupThreshold
    ? lowPointEvents.map((event) => ({ label: event.name, day: event.day, amountCents: event.amountCents, confidence: event.confidence }))
    : [
        { label: `${lowPointEvents.length - (cascadeGroupThreshold - 1)} earlier events`, day: lowPointEvents.at(-cascadeGroupThreshold)?.day ?? data.input.settings.startDate, amountCents: lowPointEvents.slice(0, -(cascadeGroupThreshold - 1)).reduce((sum, event) => sum + event.amountCents, 0), confidence: lowPointEvents.slice(0, -(cascadeGroupThreshold - 1)).some((event) => event.confidence === "estimated") ? "estimated" as const : "confirmed" as const },
        ...lowPointEvents.slice(-(cascadeGroupThreshold - 1)).map((event) => ({ label: event.name, day: event.day, amountCents: event.amountCents, confidence: event.confidence })),
      ]
  const cascadeSteps = cascadeEvents.reduce<Array<(typeof cascadeEvents)[number] & { resultingBalanceCents: number }>>((steps, event) => {
    const previousBalance = steps.at(-1)?.resultingBalanceCents
      ?? data.forecast.days[0]?.openingBalanceCents
      ?? data.currentBalanceCents
    return [...steps, { ...event, resultingBalanceCents: previousBalance + event.amountCents }]
  }, [])

  return (
    <div className={`${data.preferences.dashboardDensity === "compact" ? "px-4 lg:px-6 py-4 space-y-3" : "px-5 lg:px-7 py-6 space-y-5"} max-w-[1200px] mx-auto`}>
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[26px] font-extrabold tracking-tight leading-tight">
              {view === "dashboard" ? `Good ${getTimeOfDay()}, ${name}.` : `Your ${horizonDays}-day forecast`}
            </h2>
            {view === "forecast" && <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${conditionTone(condition)}`}>
              <LabelWithInfo
                label={scopedConditionLabel}
                explanation="Your condition is based on the lowest projected balance, your safety buffer, and the confirmed or estimated events included in this forecast."
              />
            </span>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === "dashboard"
              ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
              : "Explore exactly what happens to your balance and why."}
          </p>
          {view === "forecast" && <div className="mt-3 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lowest in the next {horizonDays} days</p>
            <p className="mt-1 font-mono text-lg font-semibold text-foreground">{money(data.forecast.lowestBalanceCents)} · {lowestDateShort}</p>
            <p className="text-sm text-muted-foreground mt-2">{resultExplanation ?? `Your lowest projected balance is ${money(data.forecast.lowestBalanceCents)} on ${lowestDate}.`}</p>
            {horizonComparisonNote && <p className="text-xs text-muted-foreground mt-1">{horizonComparisonNote}</p>}
          </div>}
        </div>
      </div>

      {/* Primary forecast result */}
      {view === "dashboard" && <ConditionBanner condition={condition}>
        <p className={`mb-2 font-mono text-[10px] uppercase tracking-[0.14em] ${dashboardConditionTone}`}>{dashboardConditionLabel}</p>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">{resultTitle}</h3>
        <p className="text-xs font-medium uppercase tracking-wide opacity-70 mt-3">Lowest in the next {horizonDays} days</p>
        <p className="mt-1 font-mono text-lg font-semibold text-foreground">{money(data.forecast.lowestBalanceCents)} · {lowestDateShort}</p>
        {resultExplanation
          ? <p className="text-sm text-muted-foreground mt-2">{resultExplanation}</p>
          : <p className="text-sm text-muted-foreground mt-2">Your lowest projected balance is {money(data.forecast.lowestBalanceCents)} on {lowestDate}.</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className={data.freshness.status === "stale" ? "font-medium text-[oklch(var(--fs-amber))]" : ""}>Based on balances updated {new Date(`${data.currentBalanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{data.freshness.status === "stale" ? " · update needed" : ""}</span>
          {briefingChanges.length > 0 && <><span aria-hidden="true">·</span><span>{briefingChanges[0]}</span></>}
          {data.freshness.status === "stale" && <Link href="/app/accounts" className="font-medium text-foreground underline underline-offset-2">Refresh balance</Link>}
        </div>
      </ConditionBanner>}

      {/* Stat cards */}
      {view === "dashboard" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Today’s opening balance</p>
          <p className="text-xl font-bold text-foreground leading-none font-mono"><AnimatedMetric value={data.currentBalanceCents} format={money} /></p>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">Before today’s scheduled activity across included accounts.</p>
        </div>
        <div className={`bg-card border border-border rounded-2xl px-4 py-4 ${safeToSpendPulse ? "fs-safe-recalculated" : ""}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Safe to Spend</p>
          <p aria-live="polite" className={`text-xl font-bold leading-none font-mono ${safeToSpendTone(condition, data.forecast.safeToSpendCents)}`}><AnimatedMetric value={data.forecast.safeToSpendCents} format={money} /></p>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{decisionRoomNote({ safeToSpendCents: data.forecast.safeToSpendCents, lowestBalanceCents: data.forecast.lowestBalanceCents, hasPositiveBuffer: data.safetyBufferConfigured && data.safetyBufferCents > 0, throughLabel: endDate })}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Safety buffer</p>
          <p className={`text-lg font-semibold leading-none ${bufferStatus.tone}`}><LabelWithInfo label={bufferStatus.label} explanation={bufferStatus.explanation} /></p>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{bufferStatus.value}</p>
          <Link href="/app/settings" className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline">{data.safetyBufferConfigured ? "Adjust" : "Set buffer"}<ChevronRight className="h-3 w-3" /></Link>
        </div>
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Next important event</p>
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{firstUpcoming?.name ?? "Nothing scheduled"}</p>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{firstUpcoming ? `${firstUpcoming.isToday ? "Today · pending" : firstUpcoming.days.split(" · ")[0]} · ${firstUpcoming.amount}` : "No included events in the next 30 days."}</p>
        </div>
      </div>}

      {view === "dashboard" && <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Cash-flow runway</p>
          <h3 className="mt-1 text-sm font-semibold">The moments shaping your next 30 days</h3>
        </div>

        <div className="relative mt-10 hidden pb-2 pt-3 sm:block">
          <div className="fs-runway-line absolute left-[6%] right-[6%] top-[22px] h-1 rounded-full" style={{ background: "linear-gradient(90deg, oklch(var(--fs-green)) 0 22%, oklch(var(--fs-amber)) 22% 60%, oklch(var(--fs-red)) 60% 70%, oklch(var(--fs-green)) 70% 100%)" }} />
          <div className="relative grid grid-cols-4">
            {runwayPoints.map((point) => {
              const isLow = point.key === "low"
              const content = <>
                <span className={`relative block rounded-full border-[3px] border-card ${isLow ? "fs-runway-low h-6 w-6 bg-[oklch(var(--fs-red))]" : point.key === "bills" ? "mt-1.5 h-3 w-3 bg-muted-foreground/40" : point.key === "recovery" ? "mt-1 h-4 w-4 bg-[oklch(var(--fs-green))]" : "mt-1 h-4 w-4 bg-foreground"}`} />
                <span className={`mt-3 block text-xs ${isLow ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{point.label}</span>
                <span className={`mt-0.5 block font-mono ${isLow ? "text-[28px] font-bold leading-none text-foreground" : point.key === "bills" ? "text-[15px] font-medium text-muted-foreground" : "text-[15px] font-medium text-foreground"}`}>{point.value}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{point.detail}</span>
              </>
              return isLow
                ? <Link key={point.key} href={`/app/forecast?date=${encodeURIComponent(data.forecast.lowestBalanceDate)}&detail=1`} className="group flex min-w-0 flex-col items-center text-center outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={`Explore lowest point of ${point.value} on ${point.detail} in Forecast`}>{content}</Link>
                : <div key={point.key} className="flex min-w-0 flex-col items-center text-center">{content}</div>
            })}
          </div>
        </div>

        <div className="relative mt-7 sm:hidden">
          <div className="fs-runway-line-y absolute bottom-5 left-[10px] top-5 w-1 rounded-full" style={{ background: "linear-gradient(180deg, oklch(var(--fs-green)) 0 22%, oklch(var(--fs-amber)) 22% 60%, oklch(var(--fs-red)) 60% 70%, oklch(var(--fs-green)) 70% 100%)" }} />
          <div className="relative space-y-6">
            {runwayPoints.map((point) => {
              const isLow = point.key === "low"
              const row = <>
                <span className={`relative mt-0.5 block shrink-0 rounded-full border-[3px] border-card ${isLow ? "fs-runway-low h-6 w-6 bg-[oklch(var(--fs-red))]" : point.key === "bills" ? "ml-1.5 h-3 w-3 bg-muted-foreground/40" : point.key === "recovery" ? "ml-1 h-4 w-4 bg-[oklch(var(--fs-green))]" : "ml-1 h-4 w-4 bg-foreground"}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-xs ${isLow ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{point.label}</span>
                  <span className={`mt-0.5 block font-mono ${isLow ? "text-[28px] font-bold leading-none" : point.key === "bills" ? "text-[15px] font-medium text-muted-foreground" : "text-[15px] font-medium"}`}>{point.value}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{point.detail}</span>
                </span>
              </>
              return isLow
                ? <Link key={point.key} href={`/app/forecast?date=${encodeURIComponent(data.forecast.lowestBalanceDate)}&detail=1`} className="flex gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={`Explore lowest point of ${point.value} on ${point.detail} in Forecast`}>{row}</Link>
                : <div key={point.key} className="flex gap-4">{row}</div>
            })}
          </div>
        </div>

        <div className="mt-7 border-t border-border pt-4">
          <div className="max-w-3xl text-xs text-muted-foreground">
            {visibleAlerts.length > 0 ? <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[oklch(var(--fs-amber))]" />
              <p><span className="font-medium text-foreground">{primaryAlertMessage}</span>{visibleAlerts.length > 1 && <Link href="/app/alerts" className="ml-1 font-medium text-primary hover:underline">View {visibleAlerts.length - 1} more</Link>}</p>
            </div> : <p>{runwayCaption}</p>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {(condition === "tight" || condition === "watch") && <Link href={`/app/forecast?date=${encodeURIComponent(data.forecast.lowestBalanceDate)}&detail=1`} className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">Review low point <ChevronRight className="h-3 w-3" /></Link>}
            {condition === "update_needed" && <Link href="/app/accounts" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">Refresh balance <ChevronRight className="h-3 w-3" /></Link>}
            <Link href="/app/scenarios" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">Test a decision <ChevronRight className="h-3 w-3" /></Link>
          </div>
        </div>
      </section>}

      {view === "dashboard" && data.preferences.showSpendingHistory && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Recent spending context</p>
              <h3 className="mt-1 text-sm font-semibold">Last four weeks: {money(data.spendingHistory.recentFourWeeksCents)}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{spendingChangeLabel}</p>
            </div>
            <Link href="/app/transactions?type=money_out" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
              Review spending <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {data.spendingHistory.transactionCount > 0 ? (
            <div className="mt-5 grid h-24 grid-cols-8 items-end gap-2" aria-label="Weekly spending over the last eight weeks">
              {data.spendingHistory.weeks.map((week) => {
                const height = Math.max(6, Math.round((week.spendingCents / maxWeeklySpendingCents) * 72))
                const label = new Date(`${week.startDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                return (
                  <div key={week.startDate} className="flex min-w-0 flex-col items-center justify-end gap-1.5">
                    <div
                      className="w-full rounded-t-md bg-primary/35 transition-colors hover:bg-primary/55"
                      style={{ height }}
                      title={`${label}: ${money(week.spendingCents)}`}
                    />
                    <span className="hidden text-[9px] text-muted-foreground sm:block">{label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-muted/50 px-4 py-5 text-sm text-muted-foreground">
              Add or import spending transactions to see recent weekly context here.
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">This is backward-looking context only. It does not create a budget or change your forecast assumptions.</p>
        </section>
      )}

      {/* Main grid */}
      {view === "forecast" && <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Forecast chart */}
          {view === "forecast" && <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-semibold">Cash Flow Forecast</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Projected through {endDate}</p>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5" aria-label="Forecast horizon">{[30, 60, 90].map((range) => <Link key={range} href={`/app/forecast?range=${range}`} className={`rounded-md px-2 py-1 text-[11px] font-mono transition-colors ${horizonDays === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{range}d</Link>)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <span className="w-5 border-t border-dashed border-primary inline-block" />Projected
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[oklch(var(--fs-amber))] inline-block" />Today
              </span>
              {data.safetyBufferConfigured && data.safetyBufferCents > 0 && <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <span className="w-5 border-t border-dashed border-[oklch(var(--fs-amber))] inline-block" />Safety buffer
              </span>}
            </div>

            <ResponsiveContainer width="100%" height={320}>
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
                    <stop offset="5%" stopColor="#BB6C43" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#BB6C43" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BB6C43" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#BB6C43" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,29,58,0.08)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#625852" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#625852" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "#BB6C43", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.65 }}
                  animationDuration={180}
                />
                <ReferenceLine x={forecastData[0]?.day} stroke="#CA8A04" strokeDasharray="4 3" strokeWidth={1.5} />
                {data.safetyBufferConfigured && data.safetyBufferCents > 0 && <ReferenceLine y={data.safetyBufferCents / 100} stroke="oklch(var(--fs-amber))" strokeDasharray="5 4" strokeWidth={1.25} />}
                {(condition === "tight" || condition === "watch") && recoveryDay && recoveryDay.date !== data.forecast.lowestBalanceDate && <ReferenceDot x={new Date(`${recoveryDay.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} y={recoveryDay.endingBalanceCents / 100} r={4} fill="oklch(var(--fs-green))" stroke="#fff" strokeWidth={1.5} />}
                <ReferenceDot x={lowestDateShort} y={data.forecast.lowestBalanceCents / 100} r={5} fill="oklch(var(--fs-red))" stroke="#fff" strokeWidth={2} />
                {selectedDay && <ReferenceDot x={new Date(`${selectedDay.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} y={selectedDay.endingBalanceCents / 100} r={5} fill="#BB6C43" stroke="#FFFFFF" strokeWidth={2} />}
                <Area type="monotone" dataKey="projected" stroke="#BB6C43" strokeWidth={2} strokeDasharray="5 3" fill="url(#dashGrad2)" dot={false} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>}

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
                        <td className={`px-4 py-3 text-right font-mono ${amountColorClass(day.netChangeCents > 0 ? "income" : "neutral")}`}>{day.netChangeCents >= 0 ? "+" : "−"}{money(Math.abs(day.netChangeCents))}</td>
                        <td className="px-5 py-3 text-right font-semibold font-mono">{money(day.endingBalanceCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === "forecast" && <section className="overflow-hidden rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Step by step</p><h3 className="mt-1 text-sm font-semibold">What creates the projected low</h3></div><button type="button" onClick={() => setSelectedDate(data.forecast.lowestBalanceDate)} className="self-start text-xs font-medium text-primary hover:underline">Review low-point day</button></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-mono bg-muted/30">
                  <tr><th className="px-3 py-2 font-medium">Event</th><th className="px-3 py-2 font-medium text-right">Change</th><th className="px-3 py-2 font-medium text-right">Ending balance</th></tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2.5"><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><WalletCards className="h-3.5 w-3.5" /></span><div className="min-w-0"><span className="font-medium">Opening balance</span><span className="block text-[10px] text-muted-foreground">{new Date(`${data.forecast.days[0]?.date ?? data.input.settings.startDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div></div></td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">—</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">{money(data.forecast.days[0]?.openingBalanceCents ?? data.currentBalanceCents)}</td>
                  </tr>
                  {cascadeSteps.map((step, index) => <tr key={`${step.label}:${index}`} onClick={() => setSelectedDate(step.day)} className="cursor-pointer border-t border-border transition-colors hover:bg-muted/40">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${step.confidence === "estimated" ? "bg-[oklch(var(--fs-estimate-bg))] text-[oklch(var(--fs-estimate))]" : step.amountCents > 0 ? "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]" : "bg-primary/[0.10] text-primary"}`}>{step.amountCents > 0 ? <Landmark className="h-3.5 w-3.5" /> : <ReceiptText className="h-3.5 w-3.5" />}</span>
                        <div className="min-w-0">
                          <span className="font-medium">{step.label}</span>
                          {step.confidence === "estimated" ? <span className="ml-1.5 inline-flex items-center rounded-full bg-[oklch(var(--fs-estimate-bg))] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[oklch(var(--fs-estimate))]">Estimated</span> : <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Confirmed</span>}
                          <span className="block text-[10px] text-muted-foreground">{new Date(`${step.day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${step.amountCents > 0 ? "text-[oklch(var(--fs-green))]" : "text-foreground"}`}>{step.confidence === "estimated" ? "~" : ""}{step.amountCents >= 0 ? "+" : "−"}{money(Math.abs(step.amountCents))}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">{money(step.resultingBalanceCents)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            {lowPointEvents.length === 0 && <p className="mt-4 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">No included events occur before the low point; it begins at the forecast’s opening balance.</p>}
            {lowPointEvents.length > cascadeGroupThreshold && <p className="mt-2 text-[11px] text-muted-foreground">Earlier, smaller activity is grouped to keep this explanation readable. Its net amount is included, so the final balance still reconciles exactly.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Every step reconciles to {money(data.forecast.lowestBalanceCents)} on {lowestDate}.</p>
          </section>}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Safe to spend */}
          {view === "forecast" && <div className={`bg-card border border-primary/20 rounded-2xl p-5 relative ${safeToSpendPulse ? "fs-safe-recalculated" : ""}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">
              <LabelWithInfo label="Safe to Spend" infoLabel="Learn how Safe to Spend is calculated" explanation="An estimate of what you could spend while covering the commitments currently included in this forecast and keeping your safety buffer available at the forecast’s lowest point. This amount may change when your balance or upcoming activity changes." />
            </p>
            <p aria-live="polite" className={`text-[36px] font-medium leading-none mb-1 font-mono ${safeToSpendTone(condition, previewSafeToSpendCents)}`}>{money(previewSafeToSpendCents)}</p>
            <p className="text-xs text-muted-foreground mb-1">After protecting your safety buffer at the lowest forecast point.</p>
            <Link href="/learn/safe-to-spend#formula" className="mb-5 inline-flex text-xs font-medium text-primary hover:underline">Learn why</Link>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Today’s opening balance</span>
                <span className="text-xs font-medium font-mono text-foreground">{money(data.currentBalanceCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground"><LabelWithInfo label="Lowest projected balance" explanation={`The lowest your included account balance is expected to reach during this ${horizonDays}-day forecast.`} /></span>
                <span className="text-xs font-medium font-mono text-muted-foreground">{money(data.forecast.lowestBalanceCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Buffer target</span>
                <span className="text-xs font-medium font-mono text-foreground">{money(effectiveBufferCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground"><LabelWithInfo label="Buffer gap" explanation="Lowest projected balance minus your buffer target. Negative means the buffer is not fully covered at the forecast's lowest point." /></span>
                <span className={`text-xs font-medium font-mono ${data.forecast.lowestBalanceCents - effectiveBufferCents < 0 ? "text-destructive" : "text-[oklch(var(--fs-green))]"}`}>{data.forecast.lowestBalanceCents - effectiveBufferCents >= 0 ? "+" : "−"}{money(Math.abs(data.forecast.lowestBalanceCents - effectiveBufferCents))}</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">Safe to spend</span>
                <span className={`text-sm font-medium font-mono ${safeToSpendTone(condition, previewSafeToSpendCents)}`}>{money(previewSafeToSpendCents)}</span>
              </div>
            </div>
            <div className="border-t border-border mt-5 pt-5">
              <div className="flex items-center justify-between mb-2"><div className="inline-flex items-center text-xs font-semibold"><label htmlFor="buffer-preview">Safety buffer</label><InfoTip label="Learn about Safety buffer">The amount you want Cusp to keep available when calculating Safe to Spend. It is not treated as available spending money.</InfoTip></div><span className="text-xs font-mono text-foreground">{money(effectiveBufferCents)}</span></div>
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
              {showWorkOpen && data.safetyBufferConfigured && effectiveBufferCents > 0 && <div className="mb-4 rounded-xl border border-primary/15 bg-primary/[0.04] p-3 text-xs leading-relaxed text-muted-foreground">{data.forecast.lowestBalanceCents > 0 ? <>Before protecting your <span className="font-mono text-foreground">{money(effectiveBufferCents)}</span> safety buffer, up to <span className="font-mono text-foreground">{money(data.forecast.lowestBalanceCents)}</span> remains above $0. After protecting it, your Safe to Spend is <span className="font-mono text-primary">{money(previewSafeToSpendCents)}</span>.</> : <>Your projected low is already at or below $0, so there is nothing available before protecting your <span className="font-mono text-foreground">{money(effectiveBufferCents)}</span> safety buffer.</>}</div>}
              <button type="button" className="w-full flex items-center justify-between text-sm font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" onClick={() => setShowWorkOpen((open) => !open)} aria-expanded={showWorkOpen} aria-controls="safe-to-spend-work"><span>Show your work</span><ChevronRight className={`h-4 w-4 transition-transform ${showWorkOpen ? "rotate-90" : ""}`} /></button>
              {showWorkOpen && <div id="safe-to-spend-work" className="mt-4 space-y-4"><p className="text-xs text-muted-foreground leading-relaxed">{`Safe to Spend uses the lowest balance in your ${horizonDays}-day forecast, then protects your safety buffer.`}</p><div className="rounded-xl bg-muted/50 p-3 space-y-2"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Lowest projected balance</span><span className="font-mono">{money(data.forecast.lowestBalanceCents)}</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Protected safety buffer</span><span className="font-mono">−{money(effectiveBufferCents)}</span></div><div className="border-t border-border pt-2 flex justify-between text-xs font-semibold"><span>Safe to Spend</span><span className="font-mono text-primary">{money(previewSafeToSpendCents)}</span></div></div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Included events</p><div className="grid grid-cols-2 gap-2"><div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono">{confirmedEventCount}</p><p className="text-[10px] text-muted-foreground"><LabelWithInfo label="Confirmed" explanation="The amount and date have been reviewed or explicitly provided." /></p></div><div className="rounded-lg border border-border p-2"><p className="text-lg font-bold font-mono">{estimatedEventCount}</p><p className="text-[10px] text-muted-foreground"><LabelWithInfo label="Estimated" explanation="The amount, date, or both may change." /></p><Link href="/learn/forecast#confirmed-and-estimated" className="mt-1 inline-flex text-[10px] text-primary hover:underline">Learn why</Link></div></div></div>{data.cardPayments.length > 0 && <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Credit card cash timing</p><div className="space-y-2">{data.cardPayments.map((payment) => <div key={`${payment.cardName}-${payment.dueDate}`} className="rounded-lg border border-border p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-medium">{payment.cardName} payment</span><span className="font-mono">−{money(payment.expectedPaymentCents)}</span></div><p className="mt-1 text-muted-foreground">{payment.strategy} · due {new Date(`${payment.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} from {payment.paymentAccountName}.</p></div>)}</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Credit card purchases explain what you spent. The card payment is when cash actually leaves your account.</p><Link href="/learn/credit-cards#payment-estimates" className="mt-2 inline-flex text-[10px] text-primary hover:underline">Learn why</Link></div>}{data.excludedEvents.length > 0 && <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Excluded or skipped</p>{data.excludedEvents.map((event) => <div key={`${event.name}-${event.date}`} className="flex justify-between gap-2 text-xs py-1"><span className="text-muted-foreground truncate">{event.name} · {new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><span className="font-mono">{money(Math.abs(event.amountCents))}</span></div>)}</div>}<div className={`rounded-lg p-3 text-xs ${data.freshness.status === "stale" ? "bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]" : "bg-muted/50 text-muted-foreground"}`}><p className="font-medium text-foreground">Data freshness: {data.freshness.status === "fresh" ? "Fresh" : data.freshness.status === "aging" ? "Getting older" : "Update needed"}</p><p className="mt-1">{data.freshness.status === "stale" ? `Your balance was last updated ${balanceAgeDays} ${balanceAgeDays === 1 ? "day" : "days"} ago. Refresh it before relying on Safe to Spend.` : `Balance dated ${new Date(`${data.currentBalanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}${balanceAgeDays > 0 ? ` · ${balanceAgeDays} days ago` : " · today"}.`}</p>{data.freshness.status === "stale" && <Link href="/app/accounts" className="inline-flex mt-2 text-foreground underline underline-offset-2">Update account balance</Link>}</div></div>}
            </div>
          </div>}

          {/* Upcoming */}
          {view === "forecast" && <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4"><h3 className="text-sm font-semibold">Upcoming Events</h3><Link href="/app/transactions?tab=recurring" className="text-xs text-primary hover:underline">Manage recurring items</Link></div>
            <div className="space-y-3">
              {upcoming.length === 0 && (
                <p className="text-xs text-muted-foreground">No recurring events in this forecast window.</p>
              )}
              {upcoming.map(({ id, day, name, amount, days, color, isIncome, iconTone, rowTone }) => (
                <button key={id} type="button" onClick={() => setSelectedDate(day)} className={`w-full flex items-center gap-3 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring p-2 -m-2 transition-colors ${rowTone}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>{isIncome ? <Landmark className="h-3.5 w-3.5" /> : <ReceiptText className="h-3.5 w-3.5" />}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{days}</p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 font-mono ${color}`}>{amount}</span>
                </button>
              ))}
            </div>
          </div>}

          {/* Forecast coverage */}
          {view === "forecast" && <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">What this forecast knows</h3>
              <span className="text-primary font-semibold text-sm">{coverageState}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on {confirmedEventCount} confirmed {confirmedEventCount === 1 ? "event" : "events"} and {estimatedEventCount} {estimatedEventCount === 1 ? "estimate" : "estimates"}. Add or review missing activity to improve the result.
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
          </div>}

          {view === "forecast" && <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold"><LabelWithInfo label="Forecast track record" explanation="Compares earlier forecasts with later actual balances. Only dates with sufficient refreshed account data are evaluated." /></h3>
            {data.trackRecord.eligibleDays === 0 ? <p className="text-xs text-muted-foreground leading-relaxed mt-2">Measurement starts after you refresh every active account balance for a date that an earlier forecast covered. We won’t score days without enough actual data.</p> : <div className="mt-3 space-y-3"><div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-muted/50 p-3"><p className="text-lg font-bold font-mono"><AnimatedMetric value={data.trackRecord.eligibleDays} /></p><p className="text-[10px] text-muted-foreground">Evaluated days</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-lg font-bold font-mono"><AnimatedMetric value={data.trackRecord.meanAbsoluteErrorCents ?? 0} format={(value) => money(Math.round(value))} /></p><p className="text-[10px] text-muted-foreground">Typical absolute error</p></div></div>{data.trackRecord.latest && <p className="text-xs text-muted-foreground">Latest evaluation: projected {money(data.trackRecord.latest.projectedBalanceCents)} and observed {money(data.trackRecord.latest.actualBalanceCents)} on {new Date(`${data.trackRecord.latest.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.</p>}</div>}
          </div>}
        </div>
      </div>}

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
              <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">What changes that day</h3><span className={`text-sm font-semibold font-mono ${amountColorClass(selectedDay.netChangeCents > 0 ? "income" : "neutral")}`}>{selectedDay.netChangeCents >= 0 ? "+" : "−"}{money(Math.abs(selectedDay.netChangeCents))}</span></div>
              {selectedDay.events.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border p-4">No income or bills are expected that day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDay.events.map((event) => (
                    <button key={event.id} type="button" onClick={() => editForecastEvent(event)} className="w-full rounded-xl border border-border p-4 flex items-start gap-3 text-left hover:border-primary/30 hover:bg-primary/[0.04] transition-colors">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${amountDotClass(event.amountCents >= 0 ? "income" : "spending")}`} />
                      <div className="flex-1 min-w-0"><p className="font-medium truncate">{event.name}</p><p className="text-xs text-muted-foreground mt-1">{event.confidence === "confirmed" ? "Confirmed" : event.amountEstimated ? "Estimated" : "Confirmed amount · Estimated date"} · {event.recurring ? "Recurring" : event.source}</p>{event.confidence === "estimated" && event.estimateEvidence && <p className="text-[11px] text-muted-foreground mt-1">Based on {event.estimateEvidence.occurrenceCount} occurrences ranging {money(Math.min(Math.abs(event.estimateEvidence.minAmountCents), Math.abs(event.estimateEvidence.maxAmountCents)))}–{money(Math.max(Math.abs(event.estimateEvidence.minAmountCents), Math.abs(event.estimateEvidence.maxAmountCents)))}.</p>}</div>
                      <div className="text-right"><span className={`font-semibold font-mono ${amountColorClass(event.amountCents >= 0 ? "income" : "spending")}`}>{event.amountCents >= 0 ? "+" : "−"}{money(Math.abs(event.amountCents))}</span><p className="text-[10px] text-muted-foreground mt-1">{event.recurring ? "Manage recurring" : "Edit"}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {editingEvent && (
              <form
                key={editingEvent.id}
                className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 mb-7 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
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
                  <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="event-type">Direction</label><select id="event-type" name="type" defaultValue={editingEvent.amountCents < 0 ? "expense" : "income"} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="expense">Money out</option><option value="income">Money in</option></select></div>
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

            {(eventActionMessage || lastEventUndo) && <div className="mb-7"><ActionToast message={eventActionMessage ?? "Forecast recalculated."} action={lastEventUndo ? "Undo edit" : undefined} onAction={lastEventUndo ? async () => { await finishEventAction(updateForecastEvent(lastEventUndo), "Your last event edit was undone."); setLastEventUndo(null) } : undefined} /></div>}

            <div className="rounded-xl bg-muted/40 p-4 mb-7">
              <div className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm">How this balance is calculated</h3></div>
              <p className="text-sm text-muted-foreground leading-relaxed">{money(selectedDay.openingBalanceCents)} opening balance {selectedDay.netChangeCents >= 0 ? "+" : "−"} {money(Math.abs(selectedDay.netChangeCents))} in known activity = {money(selectedDay.endingBalanceCents)} projected balance.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" disabled={selectedDay.events.length === 0} onClick={() => { const first = selectedDay.events[0]; if (first) editForecastEvent(first) }}><Pencil className="h-4 w-4" /> {selectedDay.events[0]?.recurring ? "Manage recurring" : "Edit event"}</Button>
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
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Safe to Spend with scenario</span><span className={`font-mono ${safeToSpendTone(determineForecastCondition(scenarioComparison.scenario, effectiveBufferCents, data.freshness.status), scenarioComparison.scenario.safeToSpendCents)}`}>{money(scenarioComparison.scenario.safeToSpendCents)}</span></div>
                    <p className={`text-sm rounded-lg border p-3 ${scenarioComparison.scenario.risks.length > 0 ? "border-[oklch(var(--fs-red))]/25 bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]" : "border-[oklch(var(--fs-green))]/20 bg-[oklch(var(--fs-green-bg))] text-foreground"}`}>
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
