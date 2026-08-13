"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  Car,
  CircleHelp,
  HeartPulse,
  Home,
  Landmark,
  Lightbulb,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Utensils,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionCategorySelect } from "@/components/transaction-category-select"
import { SPENDING_CATEGORIES, isForecastIncomeCategory, suggestTransactionCategory } from "@/lib/analytics/categories"
import { setTransactionsCategory } from "@/app/app/transactions/actions"
import { amountColorClass } from "@/lib/financial/amount-style"
import { merchantDisplayName } from "@/lib/financial/merchant-name"

export interface TransactionRow {
  id: string
  date: string
  description: string
  accountName: string | null
  categoryName: string | null
  amountCents: number
  source: string | null
  transferStatus: string | null
  unmatchedCardPayment?: boolean
  estimated?: boolean
}

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(cents) / 100)

function CategoryIcon({ category, transfer, review, estimated }: { category: string; transfer: boolean; review: boolean; estimated: boolean }) {
  const Icon = transfer
    ? ArrowLeftRight
    : review
      ? CircleHelp
      : category === "Groceries"
        ? ShoppingCart
        : category === "Dining"
          ? Utensils
          : category === "Transport"
            ? Car
            : category === "Utilities"
              ? Lightbulb
              : category === "Housing"
                ? Home
                : category === "Health"
                  ? HeartPulse
                  : category === "Shopping"
                    ? ShoppingBag
                    : category === "Regular paycheck"
                      ? Landmark
                      : category === "Variable / side income" || category === "Business income"
                        ? BriefcaseBusiness
                        : ReceiptText
  const tone = transfer
    ? "bg-[oklch(var(--fs-transfer-bg))] text-[oklch(var(--fs-transfer))]"
    : review
      ? "bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]"
      : estimated
        ? "bg-[oklch(var(--fs-estimate-bg))] text-[oklch(var(--fs-estimate))]"
        : ["Regular paycheck", "Variable / side income", "Business income", "Investment income", "Benefits"].includes(category)
          ? "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]"
          : "bg-[oklch(var(--primary)/.14)] text-[oklch(var(--primary))]"
  return <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-[18px] w-[18px]" strokeWidth={2} /></span>
}

export function TransactionsTable({ transactions }: { transactions: TransactionRow[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCategory, setBulkCategory] = useState("Other")
  const [saving, setSaving] = useState(false)
  const expenseIds = transactions.filter((transaction) => transaction.amountCents < 0 && transaction.transferStatus !== "confirmed").map((transaction) => transaction.id)
  const reviewCount = transactions.filter((transaction) => !transaction.unmatchedCardPayment && transaction.transferStatus !== "confirmed" && transaction.amountCents > 0 && (transaction.categoryName ?? suggestTransactionCategory(transaction.description, transaction.amountCents)) === "Income — needs review").length

  const toggle = (id: string, checked: boolean) => setSelected((current) => {
    const next = new Set(current)
    if (checked) next.add(id)
    else next.delete(id)
    return next
  })

  const detailsFor = (transaction: TransactionRow) => {
    const displayName = merchantDisplayName(transaction.description)
    const category = transaction.categoryName ?? suggestTransactionCategory(transaction.description, transaction.amountCents)
    const transfer = transaction.transferStatus === "confirmed"
    const cardPayment = Boolean(transaction.unmatchedCardPayment) && !transfer
    const review = !transfer && !cardPayment && transaction.amountCents > 0 && category === "Income — needs review"
    const selectedRow = selected.has(transaction.id)
    const income = transaction.amountCents > 0 && isForecastIncomeCategory(category)
    const amountClass = amountColorClass(transfer || cardPayment ? "transfer" : income ? "income" : "spending")
    const rowClass = review
      ? "bg-[oklch(var(--fs-amber-bg))]/85"
      : selectedRow
        ? "bg-primary/[0.035] shadow-[inset_0_0_0_1px_rgba(212,117,74,0.22)]"
        : "bg-card hover:bg-muted/25"
    const date = new Date(`${transaction.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    const amount = `${transaction.estimated ? "~" : ""}${transaction.amountCents >= 0 ? "+" : "−"}${money(transaction.amountCents)}`
    return { category, transfer, cardPayment, review, selectedRow, amountClass, rowClass, date, amount, displayName }
  }

  const categoryControl = (transaction: TransactionRow, transfer: boolean, cardPayment: boolean) => transfer
    ? <span className="inline-flex rounded-lg bg-[oklch(var(--fs-transfer-bg))] px-2.5 py-1.5 text-xs font-medium text-[oklch(var(--fs-transfer))]">Between accounts</span>
    : cardPayment
      ? <span className="inline-flex rounded-lg bg-[oklch(var(--fs-transfer-bg))] px-2.5 py-1.5 text-xs font-medium text-[oklch(var(--fs-transfer))]">Card payment · Source not matched</span>
    : <TransactionCategorySelect transactionId={transaction.id} description={transaction.description} amountCents={transaction.amountCents} currentCategory={transaction.categoryName} />

  return <>
    {reviewCount > 0 && <div className="mx-4 sm:mx-5 mt-4 rounded-xl border border-[oklch(var(--fs-amber))]/20 bg-[oklch(var(--fs-amber-bg))] px-3 py-2.5 text-xs leading-relaxed text-foreground"><span className="font-semibold">{reviewCount} money-in {reviewCount === 1 ? "transaction needs" : "transactions need"} review.</span> Use the highlighted category menu to tell Cusp what the payment represents.</div>}
    <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className="text-base font-semibold">Recent activity</p>
        <p className="text-sm text-muted-foreground mt-0.5">Showing {transactions.length} transactions on this page.</p>
      </div>
      {selected.size > 0 && <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{selected.size} selected</span>
        <select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
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

    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[780px] text-sm">
        <thead className="bg-muted/45 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            <th className="w-14 px-4 py-3.5 text-center"><input type="checkbox" aria-label="Select all expenses on this page" checked={expenseIds.length > 0 && expenseIds.every((id) => selected.has(id))} onChange={(event) => setSelected(event.target.checked ? new Set(expenseIds) : new Set())} /></th>
            <th className="px-3 py-3.5 text-left">Description</th>
            <th className="w-52 px-3 py-3.5 text-left">Category</th>
            <th className="w-40 px-3 py-3.5 text-right">Amount</th>
            <th className="w-40 px-5 py-3.5 text-right">Account</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const details = detailsFor(transaction)
            return <tr key={transaction.id} className={`border-t border-border transition-colors ${details.rowClass}`}>
              <td className="px-4 py-4 text-center"><input type="checkbox" aria-label={`Select ${transaction.description}`} disabled={transaction.amountCents >= 0 || details.transfer} checked={details.selectedRow} onChange={(event) => toggle(transaction.id, event.target.checked)} /></td>
              <td className="px-3 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryIcon category={details.category} transfer={details.transfer || details.cardPayment} review={details.review} estimated={Boolean(transaction.estimated)} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground" title={transaction.description}>{details.displayName}</p>
                    <p className={`mt-0.5 text-xs ${details.review ? "font-medium text-[oklch(var(--fs-amber))]" : "text-muted-foreground"}`}>{details.date}{transaction.estimated ? " · estimated" : details.cardPayment ? " · card payment" : details.review ? " · needs review" : ""}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4">{categoryControl(transaction, details.transfer, details.cardPayment)}</td>
              <td className={`px-3 py-4 text-right font-mono text-[15px] font-medium tabular-nums ${details.amountClass}`}>{details.amount}</td>
              <td className="px-5 py-4 text-right"><p className="text-xs text-muted-foreground">{transaction.accountName ?? "Unassigned"}</p><p className="mt-0.5 max-w-36 truncate text-[11px] text-muted-foreground/65">{transaction.source ?? "Manual"}</p></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>

    <div className="divide-y divide-border md:hidden">
      {transactions.map((transaction) => {
        const details = detailsFor(transaction)
        return <div key={transaction.id} className={`p-4 transition-colors ${details.rowClass}`}>
          <div className="flex items-start gap-3">
            <input className="mt-3" type="checkbox" aria-label={`Select ${transaction.description}`} disabled={transaction.amountCents >= 0 || details.transfer} checked={details.selectedRow} onChange={(event) => toggle(transaction.id, event.target.checked)} />
            <CategoryIcon category={details.category} transfer={details.transfer || details.cardPayment} review={details.review} estimated={Boolean(transaction.estimated)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium" title={transaction.description}>{details.displayName}</p><p className={`mt-0.5 text-xs ${details.review ? "text-[oklch(var(--fs-amber))]" : "text-muted-foreground"}`}>{details.date}{transaction.estimated ? " · estimated" : details.cardPayment ? " · card payment" : details.review ? " · needs review" : ""}</p></div>
                <span className={`shrink-0 font-mono text-sm font-medium ${details.amountClass}`}>{details.amount}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">{categoryControl(transaction, details.transfer, details.cardPayment)}<span className="text-xs text-muted-foreground">{transaction.accountName ?? "Unassigned"}</span></div>
            </div>
          </div>
        </div>
      })}
    </div>
  </>
}
