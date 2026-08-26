"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, List, Pause, Pencil, Play, Plus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteRecurringSeries, saveRecurringSeries, setRecurringSeriesActive, type RecurringSeriesInput } from "@/app/app/transactions/actions"
import { amountColorClass } from "@/lib/financial/amount-style"
import { ConfidencePill } from "@/components/financial-display"
import { ActionToast } from "@/components/ui/toast"
import { recurringDisplayName, recurringFrequencyLabel } from "@/lib/financial/recurring-label"
import { FinancialCalendar, type CalendarEvent } from "@/components/financial-calendar"
import { InlineInfo } from "@/components/ui/inline-info"
import { FinancialEventIcon } from "@/components/financial-event-visual"

export interface ManagedRecurringItem {
  id: string
  name: string
  type: "bill" | "income"
  amountCents: number
  frequency: "weekly" | "biweekly" | "monthly" | "annual"
  nextExpected: string | null
  accountId: string | null
  accountName: string | null
  accountType: string | null
  source: "Manual" | "CSV pattern"
  confidence: "confirmed" | "estimated"
  status: "confirmed" | "dismissed"
  minAmountCents: number | null
  maxAmountCents: number | null
  occurrenceCount: number | null
  incomeConfidence?: string | null
}

interface AccountOption { id: string; name: string; type: string }

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(cents) / 100)
}

export function RecurringManager({ items, accounts, editId }: { items: ManagedRecurringItem[]; accounts: AccountOption[]; editId?: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState<ManagedRecurringItem | "new" | null>(() => items.find((item) => item.id === editId) ?? null)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [display, setDisplay] = useState<"list" | "calendar">("list")
  const active = useMemo(() => items.filter((item) => item.status === "confirmed"), [items])
  const paused = useMemo(() => items.filter((item) => item.status === "dismissed"), [items])
  const calendarEvents = useMemo(() => active.flatMap((item) => recurringCalendarEvents(item, 100)), [active])
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)
  const highlightedItemIds = useMemo(() => new Set<string>(calendarEvents.flatMap((event) => event.date === highlightedDate && event.recurringItemId ? [event.recurringItemId] : [])), [calendarEvents, highlightedDate])
  const nextThirtyDays = calendarEvents.filter((event) => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 30)
    const eventDate = new Date(`${event.date}T00:00:00`)
    return eventDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && eventDate <= end
  })
  const nextThirtyNet = nextThirtyDays.reduce((sum, event) => sum + event.amountCents, 0)
  const nextThirtyIncomeDates = new Set(nextThirtyDays.filter((event) => event.amountCents > 0).map((event) => event.date)).size
  const nextThirtyBillCount = nextThirtyDays.filter((event) => event.amountCents < 0).length

  useEffect(() => {
    if (display !== "list" || highlightedItemIds.size === 0) return
    const firstId = [...highlightedItemIds][0]
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const frame = window.requestAnimationFrame(() => document.querySelector(`[data-recurring-id="${CSS.escape(firstId)}"]`)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }))
    const clear = () => setHighlightedDate(null)
    const clearOnOutsideClick = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("[data-recurring-id]")) clear()
    }
    const scrollListenerDelay = window.setTimeout(() => window.addEventListener("scroll", clear, { once: true, passive: true }), reduceMotion ? 50 : 750)
    const fadeTimer = window.setTimeout(clear, 2600)
    document.addEventListener("pointerdown", clearOnOutsideClick)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(scrollListenerDelay)
      window.clearTimeout(fadeTimer)
      window.removeEventListener("scroll", clear)
      document.removeEventListener("pointerdown", clearOnOutsideClick)
    }
  }, [display, highlightedItemIds])

  async function toggle(item: ManagedRecurringItem) {
    setWorkingId(item.id)
    const result = await setRecurringSeriesActive(item.id, item.status !== "confirmed")
    setWorkingId(null)
    if (!result.ok) { setMessage(result.message); return }
    router.refresh()
  }

  async function remove(item: ManagedRecurringItem) {
    if (!window.confirm(`Remove ${item.name}? It will no longer appear in future forecasts.`)) return
    setWorkingId(item.id)
    const result = await deleteRecurringSeries(item.id)
    setWorkingId(null)
    if (!result.ok) { setMessage(result.message); return }
    router.refresh()
  }

  return <div className="space-y-5">
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div>
        <h2 className="text-lg font-semibold">Recurring items</h2>
        <p className="text-sm text-muted-foreground mt-1">Income and bills Cusp expects to happen again.</p>
      </div>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start"><div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5" aria-label="Recurring view"><button type="button" onClick={() => { setHighlightedDate(null); setDisplay("list") }} className={`flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs ${display === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`} aria-label="List view"><List className="h-4 w-4" /><span>List</span></button><button type="button" onClick={() => { setHighlightedDate(null); setDisplay("calendar") }} className={`flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs ${display === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`} aria-label="Calendar view"><CalendarClock className="h-4 w-4" /><span>Calendar</span></button></div><Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add recurring</Button></div>
    </div>
    {message && <ActionToast message={message} tone="error" onDismiss={() => setMessage(null)} />}
    {items.length === 0 && <div className="rounded-2xl border border-border bg-card py-14 text-center">
      <CalendarClock className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="font-medium">No recurring items yet</h3>
      <p className="text-sm text-muted-foreground mt-1">Import transaction history or add one manually.</p>
    </div>}
    {display === "calendar" && active.length > 0 && <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-[linear-gradient(120deg,oklch(var(--primary)/.09),transparent_58%)] px-5 py-5 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Your recurring rhythm</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h3 className="text-xl font-semibold tracking-tight">What lands when</h3><p className="mt-1 text-sm text-muted-foreground">See paydays, predictable bills, and crowded weeks in one place.</p></div><div className="flex flex-wrap gap-2 text-[11px]"><span className="rounded-full border border-border bg-card px-3 py-1.5">{nextThirtyIncomeDates} income {nextThirtyIncomeDates === 1 ? "date" : "dates"}</span><span className="rounded-full border border-border bg-card px-3 py-1.5">{nextThirtyBillCount} bills</span><span className={`rounded-full border border-border bg-card px-3 py-1.5 font-mono ${nextThirtyNet >= 0 ? "text-[oklch(var(--fs-green))]" : "text-foreground"}`}>{nextThirtyNet >= 0 ? "+" : "−"}{money(nextThirtyNet)} net · next 30d</span></div></div>
      </div>
      <div className="min-w-0 p-4 sm:p-6"><FinancialCalendar events={calendarEvents} initialDate={calendarEvents[0]?.date} onSelectDate={(date) => { setHighlightedDate(date); setDisplay("list") }} /></div>
      <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground">Dates are projected from each recurring item’s current frequency. Estimated items use blue, a clock icon, and a dashed edge so they never rely on color alone.</p>
    </section>}
    {display === "list" && active.length > 0 && <RecurringGroup title="Included in forecast" items={active} highlightedIds={highlightedItemIds} workingId={workingId} onEdit={setEditing} onToggle={toggle} onRemove={remove} />}
    {display === "list" && paused.length > 0 && <RecurringGroup title="Paused" items={paused} highlightedIds={new Set()} workingId={workingId} onEdit={setEditing} onToggle={toggle} onRemove={remove} />}
    {editing && <RecurringEditor item={editing === "new" ? null : editing} accounts={accounts} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />}
  </div>
}

function recurringCalendarEvents(item: ManagedRecurringItem, horizonDays: number): CalendarEvent[] {
  if (!item.nextExpected) return []
  const result: CalendarEvent[] = []
  let cursor = new Date(`${item.nextExpected}T00:00:00`)
  const anchorDay = cursor.getDate()
  const end = new Date()
  end.setDate(end.getDate() + horizonDays)
  for (let occurrence = 0; cursor <= end && occurrence < 20; occurrence += 1) {
    result.push({ id: `${item.id}:${occurrence}`, recurringItemId: item.id, date: localDateKey(cursor), name: recurringDisplayName(item.name, item.type), amountCents: item.type === "income" ? Math.abs(item.amountCents) : -Math.abs(item.amountCents), confidence: item.confidence })
    if (item.frequency === "weekly" || item.frequency === "biweekly") cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + (item.frequency === "weekly" ? 7 : 14))
    else if (item.frequency === "annual") cursor = new Date(cursor.getFullYear() + 1, cursor.getMonth(), anchorDay)
    else {
      const targetMonth = cursor.getMonth() + 1
      const lastDay = new Date(cursor.getFullYear(), targetMonth + 1, 0).getDate()
      cursor = new Date(cursor.getFullYear(), targetMonth, Math.min(anchorDay, lastDay))
    }
  }
  return result
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function RecurringGroup({ title, items, highlightedIds, workingId, onEdit, onToggle, onRemove }: { title: string; items: ManagedRecurringItem[]; highlightedIds: Set<string>; workingId: string | null; onEdit: (item: ManagedRecurringItem) => void; onToggle: (item: ManagedRecurringItem) => void; onRemove: (item: ManagedRecurringItem) => void }) {
  return <section>
    <h3 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{title} · {items.length}</h3>
    <div className="rounded-2xl border border-border bg-card divide-y divide-border">
      {items.map((item) => {
        const displayName = recurringDisplayName(item.name, item.type)
        const amountEstimated = item.incomeConfidence !== null || (item.minAmountCents !== null && item.maxAmountCents !== null && item.minAmountCents !== item.maxAmountCents)
        const dateOnlyEstimate = item.confidence === "estimated" && !amountEstimated
        return <div key={item.id} data-recurring-id={item.id} className={`flex flex-col gap-3 p-4 transition-[background-color,box-shadow] duration-700 hover:bg-muted/25 sm:flex-row sm:items-center ${item.confidence === "estimated" ? "border-l-2 border-dashed border-l-[oklch(var(--fs-estimate))]/50" : ""} ${item.status === "dismissed" ? "opacity-70" : ""} ${highlightedIds.has(item.id) ? "relative z-10 bg-primary/[0.11] shadow-[inset_3px_0_0_oklch(var(--primary)),0_0_0_1px_oklch(var(--primary)/.3),0_8px_24px_oklch(var(--primary)/.1)]" : ""}`}>
        <FinancialEventIcon name={displayName} amountCents={item.type === "income" ? Math.abs(item.amountCents) : -Math.abs(item.amountCents)} confidence={item.confidence} className="h-10 w-10 rounded-xl" iconClassName="h-[18px] w-[18px]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate" title={item.source === "CSV pattern" ? item.name : undefined}>{displayName}</p>
            {dateOnlyEstimate
              ? <span className="inline-flex rounded-full bg-[oklch(var(--fs-estimate-bg))] px-2 py-0.5 text-[10px] font-medium text-[oklch(var(--fs-estimate))]">Confirmed amount · Estimated date</span>
              : <ConfidencePill confidence={item.confidence} />}
            {item.confidence === "estimated" && <InlineInfo label={`Why ${displayName} is estimated`}>{amountEstimated && item.occurrenceCount && item.minAmountCents !== null && item.maxAmountCents !== null ? <p>The last {item.occurrenceCount} payments ranged from {money(Math.min(Math.abs(item.minAmountCents), Math.abs(item.maxAmountCents)))} to {money(Math.max(Math.abs(item.minAmountCents), Math.abs(item.maxAmountCents)))}.</p> : dateOnlyEstimate ? <p>The payment amount looks stable, but its date has varied.</p> : <p>The amount or date may change.</p>}</InlineInfo>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{item.type === "income" ? "Income" : "Bill"} · {recurringFrequencyLabel(item.frequency)} · Next {item.nextExpected ? new Date(`${item.nextExpected}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "date not set"}</p>
          <p className="text-[11px] text-muted-foreground/75 mt-1">{item.accountName ?? "No account assigned"} · {item.source}</p>
          {item.accountType === "credit_card" && item.type === "bill" && <p className="text-[11px] text-muted-foreground mt-1">Tracked on this card · its cash impact is reflected in the card payment.</p>}
          {item.confidence === "estimated" && item.occurrenceCount && item.minAmountCents !== null && item.maxAmountCents !== null && <p className="text-[11px] text-muted-foreground mt-1">Estimated from {item.occurrenceCount} occurrences ranging {money(Math.min(Math.abs(item.minAmountCents), Math.abs(item.maxAmountCents)))}–{money(Math.max(Math.abs(item.minAmountCents), Math.abs(item.maxAmountCents)))}.</p>}
        </div>
        <p className={`font-mono text-[15px] font-medium tabular-nums ${amountColorClass(item.type === "income" ? "income" : "spending")}`}>{amountEstimated ? "~" : ""}{item.amountCents >= 0 ? "+" : "−"}{money(item.amountCents)}</p>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" disabled={workingId === item.id} onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" disabled={workingId === item.id} onClick={() => onToggle(item)} aria-label={item.status === "confirmed" ? `Pause ${item.name}` : `Resume ${item.name}`}>{item.status === "confirmed" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
          <Button size="icon" variant="ghost" className="text-destructive" disabled={workingId === item.id} onClick={() => onRemove(item)} aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>})}
    </div>
  </section>
}

function RecurringEditor({ item, accounts, onClose, onSaved }: { item: ManagedRecurringItem | null; accounts: AccountOption[]; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"bill" | "income">(item?.type ?? "bill")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="recurring-editor-title">
    <button className="absolute inset-0 bg-background/75 backdrop-blur-sm" onClick={onClose} aria-label="Close recurring editor" />
    <form className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4" onSubmit={async (event) => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      const amountCents = Math.round(Number(form.get("amount")) * 100)
      const input: RecurringSeriesInput = { id: item?.id, name: String(form.get("name")), type, amountCents, frequency: String(form.get("frequency")) as RecurringSeriesInput["frequency"], nextExpected: String(form.get("nextExpected")), accountId: String(form.get("accountId") || "") || null, confidence: String(form.get("confidence")) as RecurringSeriesInput["confidence"] }
      setSaving(true)
      const result = await saveRecurringSeries(input)
      setSaving(false)
      if (!result.ok) { setError(result.message); return }
      onSaved()
    }}>
      <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-primary mb-1">Recurring</p><h2 id="recurring-editor-title" className="text-xl font-semibold">{item ? "Edit recurring item" : "Add recurring item"}</h2></div><Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div>
      <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="recurring-name">Name</label><input id="recurring-name" name="name" defaultValue={item?.name} required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="recurring-type">Type</label><select id="recurring-type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="bill">Bill</option><option value="income">Income</option></select></div>
        <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="recurring-amount">Amount</label><input id="recurring-amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={item ? Math.abs(item.amountCents) / 100 : ""} required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="recurring-frequency">Frequency</label><select id="recurring-frequency" name="frequency" defaultValue={item?.frequency ?? "monthly"} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option><option value="annual">Annual</option></select></div>
        <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="recurring-next">Next date</label><input id="recurring-next" name="nextExpected" type="date" defaultValue={item?.nextExpected ?? ""} required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="recurring-account">{type === "bill" ? "Paid with" : "Deposited to"}</label><select id="recurring-account" name="accountId" defaultValue={item?.accountId ?? ""} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Not assigned</option>{accounts.filter((account) => type === "bill" || account.type !== "credit_card").map((account) => <option key={account.id} value={account.id}>{account.name}{account.type === "credit_card" ? " · credit card" : ""}</option>)}</select></div>
        <div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="recurring-confidence">Status</label><select id="recurring-confidence" name="confidence" defaultValue={item?.confidence ?? "confirmed"} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="confirmed">Confirmed</option><option value="estimated">Estimated</option></select></div>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Save recurring item"}</Button>
    </form>
  </div>
}
