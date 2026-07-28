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

export interface TransactionRow {
  id: string
  date: string
  description: string
  accountName: string | null
  categoryName: string | null
  amountCents: number
  source: string | null
  transferStatus: string | null
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
  const spendingTone: Record<string, string> = {
    Groceries: "bg-[#EEF3E3] text-[#365E1C]",
    Dining: "bg-[#FAEEE7] text-[#9A4E2D]",
    Transport: "bg-[#EAF0F6] text-[#3F607C]",
    Utilities: "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]",
    Housing: "bg-[#F0ECF6] text-[#66527F]",
    Subscriptions: "bg-[#F6ECF1] text-[#87506A]",
    Insurance: "bg-[#E8F2F0] text-[#376B62]",
    "Debt payments": "bg-[#EEF0F3] text-[#4B5563]",
    Shopping: "bg-[#F2EDF6] text-[#705583]",
    Health: "bg-[#E8F2F3] text-[#397078]",
    Other: "bg-[#F0F1F3] text-[#6B7280]",
  }
  const tone = transfer
    ? "bg-[#F0EEE9] text-[#6B7280]"
    : review
      ? "bg-[#F8EAF0] text-[#B44455]"
      : estimated
        ? "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]"
        : ["Regular paycheck", "Variable / side income", "Business income", "Investment income", "Benefits"].includes(category)
          ? "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]"
          : spendingTone[category] ?? "bg-[#F0F1F3] text-[#6B7280]"
  return <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-[18px] w-[18px]" strokeWidth={2} /></span>
}

export function TransactionsTable({ transactions }: { transactions: TransactionRow[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCategory, setBulkCategory] = useState("Other")
  const [saving, setSaving] = useState(false)
  const expenseIds = transactions.filter((transaction) => transaction.amountCents < 0 && transaction.transferStatus !== "confirmed").map((transaction) => transaction.id)
  const reviewCount = transactions.filter((transaction) => transaction.transferStatus !== "confirmed" && transaction.amountCents > 0 && (transaction.categoryName ?? suggestTransactionCategory(transaction.description, transaction.amountCents)) === "Income — needs review").length

  const toggle = (id: string, checked: boolean) => setSelected((current) => {
    const next = new Set(current)
    if (checked) next.add(id)
    else next.delete(id)
    return next
  })

  const detailsFor = (transaction: TransactionRow) => {
    const category = transaction.categoryName ?? suggestTransactionCategory(transaction.description, transaction.amountCents)
    const transfer = transaction.transferStatus === "confirmed"
    const review = !transfer && transaction.amountCents > 0 && category === "Income — needs review"
    const selectedRow = selected.has(transaction.id)
    const income = transaction.amountCents > 0 && isForecastIncomeCategory(category)
    const amountClass = amountColorClass(transfer ? "transfer" : income ? "income" : "spending")
    const rowClass = review
      ? "bg-[hsl(var(--fs-amber-bg))]/85"
      : selectedRow
        ? "bg-primary/[0.035] shadow-[inset_0_0_0_1px_rgba(212,117,74,0.22)]"
        : "bg-card hover:bg-muted/25"
    const date = new Date(`${transaction.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    const amount = `${transaction.estimated ? "~" : ""}${transaction.amountCents >= 0 ? "+" : "−"}${money(transaction.amountCents)}`
    return { category, transfer, review, selectedRow, amountClass, rowClass, date, amount }
  }

  const categoryControl = (transaction: TransactionRow, transfer: boolean) => transfer
    ? <span className="inline-flex rounded-lg bg-[#F0EEE9] px-2.5 py-1.5 text-xs font-medium text-muted-foreground">Between accounts</span>
    : <TransactionCategorySelect transactionId={transaction.id} description={transaction.description} amountCents={transaction.amountCents} currentCategory={transaction.categoryName} />

  return <>
    {reviewCount > 0 && <div className="mx-4 sm:mx-5 mt-4 rounded-xl border border-[hsl(var(--fs-amber))]/20 bg-[hsl(var(--fs-amber-bg))] px-3 py-2.5 text-xs leading-relaxed text-foreground"><span className="font-semibold">{reviewCount} money-in {reviewCount === 1 ? "transaction needs" : "transactions need"} review.</span> Use the highlighted category menu to tell FlowSight what the payment represents.</div>}
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
                  <CategoryIcon category={details.category} transfer={details.transfer} review={details.review} estimated={Boolean(transaction.estimated)} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{transaction.description}</p>
                    <p className={`mt-0.5 text-xs ${details.review ? "font-medium text-[hsl(var(--fs-amber))]" : "text-muted-foreground"}`}>{details.date}{transaction.estimated ? " · estimated" : details.review ? " · needs review" : ""}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4">{categoryControl(transaction, details.transfer)}</td>
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
            <CategoryIcon category={details.category} transfer={details.transfer} review={details.review} estimated={Boolean(transaction.estimated)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{transaction.description}</p><p className={`mt-0.5 text-xs ${details.review ? "text-[hsl(var(--fs-amber))]" : "text-muted-foreground"}`}>{details.date}{transaction.estimated ? " · estimated" : details.review ? " · needs review" : ""}</p></div>
                <span className={`shrink-0 font-mono text-sm font-medium ${details.amountClass}`}>{details.amount}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">{categoryControl(transaction, details.transfer)}<span className="text-xs text-muted-foreground">{transaction.accountName ?? "Unassigned"}</span></div>
            </div>
          </div>
        </div>
      })}
    </div>
  </>
}
