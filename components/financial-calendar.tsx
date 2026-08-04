"use client"

import { useMemo, useState } from "react"
import { CalendarClock, ChevronLeft, ChevronRight, Landmark, ReceiptText } from "lucide-react"
import type { ForecastDay } from "@/lib/forecast/types"

export interface CalendarEvent {
  id: string
  date: string
  name: string
  amountCents: number
  confidence?: "confirmed" | "estimated"
  recurringItemId?: string
}

function key(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00`)
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(cents) / 100)
}

export function FinancialCalendar({
  days,
  events,
  safetyBufferCents = 0,
  initialDate,
  selectedDate,
  onSelectDate,
  compact = false,
}: {
  days?: ForecastDay[]
  events?: CalendarEvent[]
  safetyBufferCents?: number
  initialDate?: string
  selectedDate?: string | null
  onSelectDate?: (date: string) => void
  compact?: boolean
}) {
  const normalizedEvents = useMemo(() => events ?? days?.flatMap((day) => day.events.map((event) => ({ ...event, date: day.date }))) ?? [], [days, events])
  const dayByDate = useMemo(() => new Map(days?.map((day) => [day.date, day])), [days])
  const eventByDate = useMemo(() => {
    const result = new Map<string, CalendarEvent[]>()
    normalizedEvents.forEach((event) => result.set(event.date, [...(result.get(event.date) ?? []), event]))
    return result
  }, [normalizedEvents])
  const firstDate = initialDate ?? days?.[0]?.date ?? normalizedEvents[0]?.date ?? key(new Date())
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = dateFromKey(firstDate)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })

  if (compact) {
    const start = dateFromKey(firstDate)
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return key(date)
    })
    return <div className="grid grid-cols-7 gap-1.5" aria-label="Next seven days">
      {dates.map((dateKey) => {
        const date = dateFromKey(dateKey)
        const day = dayByDate.get(dateKey)
        const dayEvents = eventByDate.get(dateKey) ?? []
        const isTight = day ? day.endingBalanceCents < safetyBufferCents : false
        return <button key={dateKey} type="button" onClick={() => onSelectDate?.(dateKey)} className={`min-w-0 rounded-xl border px-1 py-2.5 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.04] ${selectedDate === dateKey ? "border-primary bg-primary/[0.06]" : isTight ? "border-[hsl(var(--fs-red))]/30 bg-[hsl(var(--fs-red-bg))]/55" : "border-border bg-card"}`}>
          <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
          <span className="mt-1 block text-sm font-medium">{date.getDate()}</span>
          <span className="mt-1.5 flex h-2 items-center justify-center gap-1" aria-label={`${dayEvents.length} events`}>
            {dayEvents.slice(0, 3).map((event) => <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${event.confidence === "estimated" ? "bg-[hsl(var(--fs-estimate))]" : event.amountCents > 0 ? "bg-[hsl(var(--fs-green))]" : "bg-primary"}`} />)}
          </span>
        </button>
      })}
    </div>
  }

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const gridStart = new Date(year, month, 1 - new Date(year, month, 1).getDay())
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
  const moveMonth = (amount: number) => setVisibleMonth(new Date(year, month + amount, 1))

  return <div className="rounded-2xl bg-[linear-gradient(145deg,hsl(var(--card)),hsl(var(--muted)/.26))] p-1">
    <div className="mb-4 flex items-center justify-between">
      <h4 className="text-sm font-medium">{visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h4>
      <div className="flex gap-1">
        <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl">
    <div className="grid min-w-[680px] grid-cols-7 border-l border-t border-border text-center text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => <div key={label} className="border-b border-r border-border px-1 py-2">{label}</div>)}
      {cells.map((date) => {
        const dateKey = key(date)
        const day = dayByDate.get(dateKey)
        const dayEvents = eventByDate.get(dateKey) ?? []
        const inMonth = date.getMonth() === month
        const netCents = dayEvents.reduce((sum, event) => sum + event.amountCents, 0)
        const isTight = day ? day.endingBalanceCents < safetyBufferCents : false
        const isWatch = day ? !isTight && day.endingBalanceCents < safetyBufferCents + Math.max(20_000, Math.round(safetyBufferCents * .2)) : false
        return <button key={dateKey} type="button" disabled={!day && dayEvents.length === 0} onClick={() => onSelectDate?.(dateKey)} className={`relative min-h-28 border-b border-r border-border p-2 text-left align-top transition-[background-color,box-shadow,transform] disabled:cursor-default ${inMonth ? "bg-card/90" : "bg-muted/20 text-muted-foreground/45"} ${isTight ? "bg-[hsl(var(--fs-red-bg))]/45" : isWatch ? "bg-[hsl(var(--fs-amber-bg))]/45" : ""} ${selectedDate === dateKey ? "z-10 -translate-y-0.5 bg-primary/[0.055] shadow-md ring-2 ring-inset ring-primary" : "enabled:hover:bg-primary/[0.035]"}`}>
          <span className="text-xs font-medium">{date.getDate()}</span>
          {dayEvents.length > 0 && <div className="mt-2 space-y-1">
            {dayEvents.slice(0, 2).map((event) => {
              const EventIcon = event.amountCents > 0 ? Landmark : event.confidence === "estimated" ? CalendarClock : ReceiptText
              return <div key={event.id} className={`flex items-center gap-1.5 truncate rounded-lg border px-1.5 py-1 text-[10px] normal-case tracking-normal shadow-[0_1px_2px_rgba(74,65,60,0.04)] ${event.confidence === "estimated" ? "border-dashed border-[hsl(var(--fs-estimate))]/40 bg-[hsl(var(--fs-estimate-bg))] text-[hsl(var(--fs-estimate))]" : event.amountCents > 0 ? "border-[hsl(var(--fs-green))]/28 bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]" : "border-primary/40 bg-primary/[0.13] text-primary"}`} title={`${event.name}: ${event.amountCents > 0 ? "+" : "−"}${money(event.amountCents)}`}><EventIcon className="h-3 w-3 shrink-0" strokeWidth={2.25} /><span className="truncate font-semibold">{event.name}</span></div>
            })}
            {dayEvents.length > 2 && <p className="px-1 text-[9px] text-muted-foreground">+{dayEvents.length - 2} more</p>}
          </div>}
          {dayEvents.length > 0 && <span className={`absolute bottom-1.5 right-2 font-mono text-[9px] normal-case tracking-normal ${netCents > 0 ? "text-[hsl(var(--fs-green))]" : "text-muted-foreground"}`}>{netCents > 0 ? "+" : "−"}{money(netCents)}</span>}
        </button>
      })}
    </div></div>
    <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--fs-green-bg))] px-2.5 py-1 text-[hsl(var(--fs-green))]"><Landmark className="h-3 w-3" />Income</span><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.11] px-2.5 py-1 text-primary"><ReceiptText className="h-3 w-3" />Bill</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--fs-estimate-bg))] px-2.5 py-1 text-[hsl(var(--fs-estimate))]"><CalendarClock className="h-3 w-3" />Estimated</span></div>
  </div>
}
