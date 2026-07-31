"use client"

import { useState } from "react"
import { CalendarClock, Landmark, Pause, Pencil, Play, Plus, ReceiptText, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteRecurringSeries, saveRecurringSeries, setRecurringSeriesActive, type RecurringSeriesInput } from "@/app/app/transactions/actions"
import { amountColorClass } from "@/lib/financial/amount-style"
import { ConfidencePill } from "@/components/financial-display"
import { ActionToast } from "@/components/ui/toast"
import { recurringFrequencyLabel } from "@/lib/financial/recurring-label"

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
  const active = items.filter((item) => item.status === "confirmed")
  const paused = items.filter((item) => item.status === "dismissed")

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
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">Recurring items</h2>
        <p className="text-sm text-muted-foreground mt-1">Income and bills FlowSight expects to happen again.</p>
      </div>
      <Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add recurring</Button>
    </div>
    {message && <ActionToast message={message} tone="error" onDismiss={() => setMessage(null)} />}
    {items.length === 0 && <div className="rounded-2xl border border-border bg-card py-14 text-center">
      <CalendarClock className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="font-medium">No recurring items yet</h3>
      <p className="text-sm text-muted-foreground mt-1">Import transaction history or add one manually.</p>
    </div>}
    {active.length > 0 && <RecurringGroup title="Included in forecast" items={active} workingId={workingId} onEdit={setEditing} onToggle={toggle} onRemove={remove} />}
    {paused.length > 0 && <RecurringGroup title="Paused" items={paused} workingId={workingId} onEdit={setEditing} onToggle={toggle} onRemove={remove} />}
    {editing && <RecurringEditor item={editing === "new" ? null : editing} accounts={accounts} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />}
  </div>
}

function RecurringGroup({ title, items, workingId, onEdit, onToggle, onRemove }: { title: string; items: ManagedRecurringItem[]; workingId: string | null; onEdit: (item: ManagedRecurringItem) => void; onToggle: (item: ManagedRecurringItem) => void; onRemove: (item: ManagedRecurringItem) => void }) {
  return <section>
    <h3 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{title} · {items.length}</h3>
    <div className="rounded-2xl border border-border bg-card divide-y divide-border">
      {items.map((item) => {
        const amountEstimated = item.incomeConfidence !== null || (item.minAmountCents !== null && item.maxAmountCents !== null && item.minAmountCents !== item.maxAmountCents)
        const dateOnlyEstimate = item.confidence === "estimated" && !amountEstimated
        const ItemIcon = item.type === "income" ? Landmark : item.confidence === "estimated" ? CalendarClock : ReceiptText
        const iconTone = item.type === "income"
          ? "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]"
          : item.confidence === "estimated"
            ? "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]"
            : "bg-[#F0F1F3] text-[#6B7280]"
        return <div key={item.id} className={`flex flex-col gap-3 p-4 transition-colors hover:bg-muted/25 sm:flex-row sm:items-center ${item.confidence === "estimated" ? "border-l-2 border-dashed border-l-[hsl(var(--fs-amber))]/45" : ""} ${item.status === "dismissed" ? "opacity-70" : ""}`}>
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}><ItemIcon className="h-[18px] w-[18px]" strokeWidth={2} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{item.name}</p>
            {dateOnlyEstimate
              ? <span className="inline-flex rounded-full bg-[hsl(var(--fs-amber-bg))] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--fs-amber))]">Confirmed amount · Estimated date</span>
              : <ConfidencePill confidence={item.confidence} />}
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
