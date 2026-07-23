import Link from "next/link"
import { ArrowLeftRight } from "lucide-react"
import type { Prisma } from "@prisma/client"
import { CsvImportPanel } from "@/components/csv-import-panel"
import { ManualTransactionPanel } from "@/components/manual-transaction-panel"
import { TransactionsTable } from "@/components/transactions-table"
import { TransactionFilters } from "@/components/transaction-filters"
import { RecurringReviewPanel } from "@/components/recurring-review-panel"
import { RecurringManager, type ManagedRecurringItem } from "@/components/recurring-manager"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { suggestRecurring } from "@/lib/csv/parse"
import { suggestTransactionCategory } from "@/lib/analytics/categories"

const PAGE_SIZE = 25

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ import?: string; tab?: string; q?: string; type?: string; category?: string; page?: string }> }) {
  const query = await searchParams
  const tab = query.tab === "recurring" ? "recurring" : "activity"
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1)
  const where: Prisma.TransactionWhereInput = user ? {
    userId: user.id,
    ...(query.q?.trim() ? { description: { contains: query.q.trim(), mode: "insensitive" } } : {}),
    ...(query.type === "money_in" || query.type === "income" ? { amountCents: { gt: 0 } } : query.type === "money_out" || query.type === "expense" ? { amountCents: { lt: 0 } } : {}),
  } : { userId: "" }
  const transactionPagination: { skip?: number; take: number } = query.category
    ? { take: 10_000 }
    : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }

  const [transactionPool, unfilteredTransactionCount, recurringHistory, confirmedRecurring, managedRecurring, accounts, profile] = user ? await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { date: "desc" }, ...transactionPagination, include: { account: { select: { name: true } }, category: { select: { name: true } } } }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({ where: { userId: user.id, accountId: { not: null } }, orderBy: { date: "asc" }, take: 2000 }),
    prisma.recurringSeries.findMany({ where: { userId: user.id, status: "confirmed" }, select: { id: true, name: true, amountCents: true, frequency: true, type: true, nextExpected: true, accountId: true, isManual: true, normalizedKey: true } }),
    prisma.recurringSeries.findMany({ where: { userId: user.id, status: { in: ["confirmed", "dismissed"] } }, orderBy: [{ status: "asc" }, { nextExpected: "asc" }] }),
    prisma.account.findMany({ where: { userId: user.id, isLiability: false }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, type: true, source: true, anchorBalanceCents: true, anchorDate: true } }),
    prisma.userProfile.findUnique({ where: { userId: user.id }, select: { incomePattern: true, incomePatternSource: true } }),
  ]) : [[], 0, [], [], [], [], null]

  const categoryMatches = query.category
    ? transactionPool.filter((transaction) => (transaction.category?.name ?? suggestTransactionCategory(transaction.description, transaction.amountCents)) === query.category)
    : transactionPool
  const transactionCount = query.category ? categoryMatches.length : unfilteredTransactionCount
  const transactions = query.category ? categoryMatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : categoryMatches
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]))
  const confirmedNames = new Set(confirmedRecurring.map((item) => item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")))
  const accountIds = [...new Set(recurringHistory.map((item) => item.accountId).filter((value): value is string => Boolean(value)))]
  const recurringSuggestions = accountIds
    .flatMap((accountId) => suggestRecurring(recurringHistory.filter((item) => item.accountId === accountId).map((item) => ({ date: item.date.toISOString().slice(0, 10), description: item.description, amountCents: item.amountCents })), accountId))
    .filter((item) => !confirmedNames.has(item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")))
  const totalPages = Math.max(1, Math.ceil(transactionCount / PAGE_SIZE))
  const paramsFor = (targetPage: number) => {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    if (query.type) params.set("type", query.type)
    if (query.category) params.set("category", query.category)
    params.set("page", String(targetPage))
    return `/app/transactions?${params}`
  }

  const accountOptions = accounts.map((account) => ({ ...account, anchorDate: account.anchorDate?.toISOString().slice(0, 10) ?? null }))
  const csvProps = {
    accounts: accountOptions,
    existingRecurring: confirmedRecurring.map((item) => ({ ...item, nextExpected: item.nextExpected?.toISOString().slice(0, 10) ?? null })),
    incomePatternEstablished: Boolean(profile && (profile.incomePatternSource === "onboarding" || profile.incomePatternSource === "user_updated")),
  }
  const recurringItems: ManagedRecurringItem[] = managedRecurring.flatMap((item) => {
    if (!["bill", "income"].includes(item.type) || !["weekly", "biweekly", "monthly", "annual"].includes(item.frequency) || !["confirmed", "dismissed"].includes(item.status)) return []
    return [{
      id: item.id,
      name: item.name,
      type: item.type as ManagedRecurringItem["type"],
      amountCents: item.amountCents,
      frequency: item.frequency as ManagedRecurringItem["frequency"],
      nextExpected: item.nextExpected?.toISOString().slice(0, 10) ?? null,
      accountId: item.accountId,
      accountName: item.accountId ? accountNameById.get(item.accountId) ?? null : null,
      confidence: item.dateConfidence === "confirmed" ? "confirmed" : "estimated",
      status: item.status as ManagedRecurringItem["status"],
      minAmountCents: item.minAmountCents,
      maxAmountCents: item.maxAmountCents,
      occurrenceCount: item.occurrenceCount,
    }]
  })

  return <div className="p-4 sm:p-6 max-w-5xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Transactions</h1><p className="text-sm text-muted-foreground mt-0.5">Review activity and manage what FlowSight expects next.</p></div>
      <div className="flex flex-wrap gap-2"><CsvImportPanel autoOpen={query.import === "1"} {...csvProps} /><ManualTransactionPanel accounts={accountOptions} /></div>
    </div>

    <nav className="flex gap-1 border-b border-border mb-6" aria-label="Transaction sections">
      <Link href="/app/transactions" className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === "activity" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Activity</Link>
      <Link href="/app/transactions?tab=recurring" className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === "recurring" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Recurring <span className="ml-1 text-xs text-muted-foreground">{recurringItems.length}</span></Link>
    </nav>

    {tab === "activity" ? <>
      {transactionCount > 0 || query.q || query.type || query.category ? <TransactionFilters query={query.q} type={query.type} category={query.category} /> : null}
      {transactions.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><ArrowLeftRight className="h-8 w-8 text-primary" /></div><h2 className="text-xl font-semibold mb-2">{transactionCount === 0 && !query.q && !query.type && !query.category ? "No transactions yet" : "No transactions match those filters"}</h2><p className="text-muted-foreground text-sm max-w-sm mb-6">{transactionCount === 0 && !query.q && !query.type && !query.category ? "Import a CSV from your bank or add transactions manually. FlowSight will detect patterns and build your forecast from the history." : "Try a broader search or clear one of those filters."}</p>{transactionCount === 0 && !query.q && !query.type && !query.category ? <div className="flex flex-wrap justify-center gap-3"><CsvImportPanel {...csvProps} /><ManualTransactionPanel accounts={accountOptions} variant="outline" /></div> : <Link href="/app/transactions" className="text-sm text-primary hover:underline">Clear filters</Link>}</div> : <div className="rounded-2xl border border-border bg-card overflow-hidden"><TransactionsTable transactions={transactions.map((transaction) => ({ id: transaction.id, date: transaction.date.toISOString().slice(0, 10), description: transaction.description, accountName: transaction.account?.name ?? null, categoryName: transaction.category?.name ?? null, amountCents: transaction.amountCents, source: transaction.source }))} /></div>}
      {totalPages > 1 && <nav className="flex items-center justify-between mt-5 text-sm" aria-label="Transaction pages"><Link href={paramsFor(Math.max(1, page - 1))} aria-disabled={page === 1} className={`rounded-md border border-input px-3 py-2 ${page === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>Previous</Link><span className="text-muted-foreground">Page {Math.min(page, totalPages)} of {totalPages}</span><Link href={paramsFor(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} className={`rounded-md border border-input px-3 py-2 ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>Next</Link></nav>}
    </> : <div className="space-y-6">
      {recurringSuggestions.length > 0 && <RecurringReviewPanel suggestions={recurringSuggestions} />}
      <RecurringManager items={recurringItems} accounts={accounts.map(({ id, name }) => ({ id, name }))} />
    </div>}
  </div>
}
