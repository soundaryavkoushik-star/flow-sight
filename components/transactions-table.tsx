"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TransactionCategorySelect } from "@/components/transaction-category-select"
import { SPENDING_CATEGORIES, suggestTransactionCategory } from "@/lib/analytics/categories"
import { setTransactionsCategory } from "@/app/app/transactions/actions"

export interface TransactionRow {
  id: string
  date: string
  description: string
  accountName: string | null
  categoryName: string | null
  amountCents: number
  source: string | null
}

export function TransactionsTable({ transactions }: { transactions: TransactionRow[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCategory, setBulkCategory] = useState("Other")
  const [saving, setSaving] = useState(false)
  const expenseIds = transactions.filter((transaction) => transaction.amountCents < 0).map((transaction) => transaction.id)
  const reviewCount = transactions.filter((transaction) => transaction.amountCents > 0 && (transaction.categoryName ?? suggestTransactionCategory(transaction.description, transaction.amountCents)) === "Income — needs review").length

  return <>
    {reviewCount > 0 && <div className="mx-4 sm:mx-5 mt-4 rounded-xl bg-[hsl(var(--fs-amber-bg))] px-3 py-2 text-xs text-foreground"><span className="font-medium">{reviewCount} money-in {reviewCount === 1 ? "transaction needs" : "transactions need"} review.</span> Use the highlighted category menu to tell FlowSight what the payment represents.</div>}
    <div className="px-4 sm:px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">Recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">Showing {transactions.length} transactions on this page.</p>
      </div>
      {selected.size > 0 && <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{selected.size} selected</span>
        <select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs">
          {SPENDING_CATEGORIES.map((category) => <option key={category.name}>{category.name}</option>)}
        </select>
        <Button size="sm" disabled={saving} onClick={async () => {
          setSaving(true)
          const result = await setTransactionsCategory([...selected], bulkCategory)
          setSaving(false)
          if (result.ok) {
            setSelected(new Set())
            router.refresh()
          }
        }}>{saving ? "Applying…" : "Apply category"}</Button>
      </div>}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 sm:px-5 py-3"><input type="checkbox" aria-label="Select all expenses on this page" checked={expenseIds.length > 0 && expenseIds.every((id) => selected.has(id))} onChange={(event) => setSelected(event.target.checked ? new Set(expenseIds) : new Set())} /></th>
            <th className="text-left px-3 py-3">Date</th>
            <th className="text-left px-3 py-3">Description</th>
            <th className="text-left px-3 py-3">Account</th>
            <th className="text-left px-3 py-3">Direction</th>
            <th className="text-left px-3 py-3">Category</th>
            <th className="text-right px-3 py-3">Amount</th>
            <th className="text-right px-3 sm:px-5 py-3">Source</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => <tr key={transaction.id} className="border-t border-border">
            <td className="px-3 sm:px-5 py-3"><input type="checkbox" aria-label={`Select ${transaction.description}`} disabled={transaction.amountCents >= 0} checked={selected.has(transaction.id)} onChange={(event) => setSelected((current) => {
              const next = new Set(current)
              if (event.target.checked) next.add(transaction.id)
              else next.delete(transaction.id)
              return next
            })} /></td>
            <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{new Date(`${transaction.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
            <td className="px-3 py-3 font-medium max-w-56 truncate">{transaction.description}</td>
            <td className="px-3 py-3 text-muted-foreground">{transaction.accountName ?? "Unassigned"}</td>
            <td className="px-3 py-3 text-xs text-muted-foreground">{transaction.amountCents < 0 ? "Money out" : "Money in"}</td>
            <td className="px-3 py-3"><TransactionCategorySelect transactionId={transaction.id} description={transaction.description} amountCents={transaction.amountCents} currentCategory={transaction.categoryName} /></td>
            <td className={`px-3 py-3 text-right font-mono ${transaction.amountCents >= 0 ? "text-primary" : "text-destructive"}`}>{transaction.amountCents >= 0 ? "+" : "−"}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(transaction.amountCents) / 100)}</td>
            <td className="px-3 sm:px-5 py-3 text-right text-xs text-muted-foreground">{transaction.source ?? "Manual"}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </>
}
