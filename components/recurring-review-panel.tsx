"use client"

import { useState } from "react"
import { CheckCircle, Repeat2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { confirmRecurringSuggestions, type RecurringConfirmationInput } from "@/app/app/transactions/actions"
import { amountColorClass } from "@/lib/financial/amount-style"
import { FinancialEventIcon } from "@/components/financial-event-visual"

type Suggestion = RecurringConfirmationInput & { id: string }

export function RecurringReviewPanel({ suggestions }: { suggestions: Suggestion[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState(() => new Set(suggestions.map((item) => item.id)))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <section className="rounded-2xl border border-border bg-card p-5 mb-5" aria-labelledby="recurring-review-title">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Repeat2 className="h-4 w-4 text-primary" /></div>
        <div className="flex-1">
          <h2 id="recurring-review-title" className="text-sm font-semibold">Review recurring activity</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {suggestions.length > 0
              ? `We found ${suggestions.length} possible recurring ${suggestions.length === 1 ? "pattern" : "patterns"}. Nothing enters your forecast until you confirm it.`
              : "We didn’t find a reliable recurring pattern in your transaction history yet. We’ll check again after your next import."}
          </p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-5 space-y-3">
          {suggestions.map((item) => {
            const isSelected = selected.has(item.id)
            return (
            <label key={item.id} className={`flex items-start gap-3 rounded-xl border border-dashed p-4 cursor-pointer transition-[background-color,border-color,box-shadow,opacity] ${isSelected ? "border-primary/30 bg-primary/[0.035] shadow-[inset_0_0_0_1px_rgba(212,117,74,0.14)]" : "border-[oklch(var(--fs-amber))]/30 bg-muted/20 opacity-70 hover:opacity-100"}`}>
              <input type="checkbox" checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next })} className="mt-1" />
              <FinancialEventIcon name={item.name} amountCents={item.amountCents} confidence="estimated" className="h-10 w-10 rounded-xl" iconClassName="h-[18px] w-[18px]" />
              <span className="flex-1"><span className="block text-sm font-medium">{item.name}</span><span className="block text-xs text-muted-foreground mt-1"><span className="capitalize">{item.type}</span> · <span className="capitalize">{item.frequency}</span> · Next estimated {new Date(`${item.nextExpected}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><span className="block text-[11px] text-muted-foreground mt-1">Estimated from {item.occurrenceCount} occurrences ranging {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.min(Math.abs(item.minAmountCents), Math.abs(item.maxAmountCents)) / 100)}–{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.max(Math.abs(item.minAmountCents), Math.abs(item.maxAmountCents)) / 100)}.</span></span>
              <span className={`font-mono text-[15px] font-medium tabular-nums ${amountColorClass(item.type === "income" ? "income" : "spending")}`}>~{item.amountCents > 0 ? "+" : "−"}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(item.amountCents) / 100)}</span>
            </label>
          )})}
          {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
          <p className="text-[11px] text-muted-foreground">Unchecked items will be remembered as “Not recurring” and won’t be suggested again for this account.</p>
          <Button disabled={saving} onClick={async () => { setSaving(true); setMessage(null); const result = await confirmRecurringSuggestions(suggestions.filter((item) => selected.has(item.id)), [], suggestions.filter((item) => !selected.has(item.id))); setSaving(false); if (!result.ok) { setMessage(result.message); return } setMessage("Your recurring decisions were saved. Your forecast has been refreshed."); router.refresh() }}><CheckCircle className="h-4 w-4" /> {saving ? "Saving…" : "Save review"}</Button>
        </div>
      )}
    </section>
  )
}
