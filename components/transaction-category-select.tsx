"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setTransactionCategory } from "@/app/app/transactions/actions"
import { categoriesForDirection, suggestTransactionCategory } from "@/lib/analytics/categories"

export function TransactionCategorySelect({ transactionId, description, amountCents, currentCategory }: { transactionId: string; description: string; amountCents: number; currentCategory?: string | null }) {
  const router = useRouter()
  const categories = categoriesForDirection(amountCents < 0 ? "money_out" : "money_in")
  const suggested = suggestTransactionCategory(description, amountCents)
  const [value, setValue] = useState(categories.some((category) => category.name === currentCategory) ? currentCategory! : suggested)
  const [saving, setSaving] = useState(false)
  return <select aria-label={`Category for ${description}`} value={value} disabled={saving} onChange={async (event) => { const previous = value; const next = event.target.value; setValue(next); setSaving(true); const result = await setTransactionCategory(transactionId, next); setSaving(false); if (!result.ok) { setValue(previous); return } router.refresh() }} className={`rounded-md border px-2 py-1 text-xs min-w-36 disabled:opacity-60 ${value === "Income — needs review" ? "border-[hsl(var(--fs-amber))] bg-[hsl(var(--fs-amber-bg))] text-foreground" : "border-input bg-background"}`}>{categories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select>
}
