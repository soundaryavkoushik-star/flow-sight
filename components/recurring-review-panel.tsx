"use client"

import { useState } from "react"
import { CheckCircle, Repeat2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { confirmRecurringSuggestions, type RecurringConfirmationInput } from "@/app/app/transactions/actions"

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
          {suggestions.map((item) => (
            <label key={item.id} className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
              <input type="checkbox" checked={selected.has(item.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next })} className="mt-1" />
              <span className="flex-1"><span className="block text-sm font-medium">{item.name}</span><span className="block text-xs text-muted-foreground mt-1 capitalize">{item.frequency} · {item.type} · next estimated {new Date(`${item.nextExpected}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></span>
              <span className="text-sm font-mono">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amountCents / 100)}</span>
            </label>
          ))}
          {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
          <Button disabled={saving || selected.size === 0} onClick={async () => { setSaving(true); setMessage(null); const result = await confirmRecurringSuggestions(suggestions.filter((item) => selected.has(item.id))); setSaving(false); if (!result.ok) { setMessage(result.message); return } setMessage("Recurring activity confirmed. Your forecast has been refreshed."); router.refresh() }}><CheckCircle className="h-4 w-4" /> {saving ? "Confirming…" : `Confirm ${selected.size} selected`}</Button>
        </div>
      )}
    </section>
  )
}
