"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setTransactionCategory } from "@/app/app/transactions/actions"
import { categoriesForDirection, isForecastIncomeCategory, suggestTransactionCategory } from "@/lib/analytics/categories"

export function TransactionCategorySelect({ transactionId, description, amountCents, currentCategory }: { transactionId: string; description: string; amountCents: number; currentCategory?: string | null }) {
  const router = useRouter()
  const categories = categoriesForDirection(amountCents < 0 ? "money_out" : "money_in")
  const suggested = suggestTransactionCategory(description, amountCents)
  const [value, setValue] = useState(categories.some((category) => category.name === currentCategory) ? currentCategory! : suggested)
  const [saving, setSaving] = useState(false)
  const tone = value === "Income — needs review"
    ? "border-dashed border-[oklch(var(--fs-amber))] bg-white text-foreground shadow-[0_0_0_2px_oklch(var(--fs-amber)/0.08)]"
    : amountCents > 0 && isForecastIncomeCategory(value)
      ? "border-[oklch(var(--fs-green))]/15 bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]"
      : "border-transparent bg-muted/65 text-foreground hover:border-input"
  return <select aria-label={`Category for ${description}`} value={value} disabled={saving} onChange={async (event) => { const previous = value; const next = event.target.value; setValue(next); setSaving(true); const result = await setTransactionCategory(transactionId, next); setSaving(false); if (!result.ok) { setValue(previous); return } router.refresh() }} className={`min-w-36 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-60 ${tone}`}>{categories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select>
}
