"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setTransactionCategory } from "@/app/app/transactions/actions"
import { SPENDING_CATEGORIES, suggestSpendingCategory } from "@/lib/analytics/categories"

export function TransactionCategorySelect({ transactionId, description, currentCategory }: { transactionId: string; description: string; currentCategory?: string | null }) {
  const router = useRouter()
  const [value, setValue] = useState(currentCategory ?? suggestSpendingCategory(description))
  const [saving, setSaving] = useState(false)
  return <select aria-label={`Category for ${description}`} value={value} disabled={saving} onChange={async (event) => { const previous = value; const next = event.target.value; setValue(next); setSaving(true); const result = await setTransactionCategory(transactionId, next); setSaving(false); if (!result.ok) { setValue(previous); return } router.refresh() }} className="rounded-md border border-input bg-background px-2 py-1 text-xs min-w-28 disabled:opacity-60">{SPENDING_CATEGORIES.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select>
}
