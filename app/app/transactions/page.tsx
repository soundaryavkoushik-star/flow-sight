import Link from "next/link"
import { ArrowLeftRight } from "lucide-react"
import type { Prisma } from "@prisma/client"
import { CsvImportPanel } from "@/components/csv-import-panel"
import { ManualTransactionPanel } from "@/components/manual-transaction-panel"
import { TransactionsTable } from "@/components/transactions-table"
import { TransactionFilters } from "@/components/transaction-filters"
import { RecurringReviewPanel } from "@/components/recurring-review-panel"
import { RecurringManager, type ManagedRecurringItem } from "@/components/recurring-manager"
import { TransferReviewPanel } from "@/components/transfer-review-panel"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { normalizeMerchant, suggestRecurring } from "@/lib/csv/parse"
import { suggestTransactionCategory } from "@/lib/analytics/categories"
import { detectTransferSuggestions, isUnmatchedCardPayment } from "@/lib/transfers/detect"
import { recurringDisplayName } from "@/lib/financial/recurring-label"

const PAGE_SIZE = 25

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ import?: string; account?: string; tab?: string; edit?: string; q?: string; type?: string; category?: string; page?: string }> }) {
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

  const [transactionPool, unfilteredTransactionCount, recurringHistory, confirmedRecurring, managedRecurring, accounts, profile, transferHistory, transferDecisions, recurringDecisions] = user ? await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { date: "desc" }, ...transactionPagination, include: { account: { select: { name: true, type: true } }, category: { select: { name: true } }, outgoingTransfer: { select: { status: true } }, incomingTransfer: { select: { status: true } } } }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({ where: { userId: user.id, accountId: { not: null } }, orderBy: { date: "asc" }, take: 2000 }),
    prisma.recurringSeries.findMany({ where: { userId: user.id, status: "confirmed" }, select: { id: true, name: true, amountCents: true, frequency: true, type: true, nextExpected: true, accountId: true, isManual: true, normalizedKey: true } }),
    prisma.recurringSeries.findMany({ where: { userId: user.id, status: { in: ["confirmed", "dismissed"] } }, orderBy: [{ status: "asc" }, { nextExpected: "asc" }] }),
    prisma.account.findMany({ where: { userId: user.id, type: { in: ["checking", "savings", "credit_card"] } }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, type: true, source: true, anchorBalanceCents: true, anchorDate: true } }),
    prisma.userProfile.findUnique({ where: { userId: user.id }, select: { incomePattern: true, incomePatternSource: true, safetyBufferConfiguredAt: true, safetyBufferPromptDismissedAt: true } }),
    prisma.transaction.findMany({ where: { userId: user.id, accountId: { not: null } }, orderBy: { date: "desc" }, take: 2000, include: { account: { select: { name: true, type: true } } } }),
    prisma.transactionTransfer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        outgoingTransaction: { include: { account: { select: { name: true } } } },
        incomingTransaction: { include: { account: { select: { name: true } } } },
      },
    }),
    prisma.recurringSuggestionDecision.findMany({ where: { userId: user.id, decision: "dismissed" }, select: { accountId: true, normalizedKey: true } }),
  ]) : [[], 0, [], [], [], [], null, [], [], []]

  const categoryMatches = query.category
    ? transactionPool.filter((transaction) => (transaction.category?.name ?? (isUnmatchedCardPayment(transaction.description, transaction.amountCents, transaction.account?.type) ? "Transfer in" : suggestTransactionCategory(transaction.description, transaction.amountCents))) === query.category)
    : transactionPool
  const transactionCount = query.category ? categoryMatches.length : unfilteredTransactionCount
  const transactions = query.category ? categoryMatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : categoryMatches
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]))
  const accountTypeById = new Map(accounts.map((account) => [account.id, account.type]))
  const confirmedNames = new Set(confirmedRecurring.map((item) => item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")))
  const dismissedRecurringKeys = new Set(recurringDecisions.map((decision) => `${decision.accountId}:${decision.normalizedKey}`))
  const accountIds = [...new Set(recurringHistory.map((item) => item.accountId).filter((value): value is string => Boolean(value)))]
  const recurringSuggestions = accountIds
    .flatMap((accountId) => suggestRecurring(recurringHistory.filter((item) => item.accountId === accountId).map((item) => ({ date: item.date.toISOString().slice(0, 10), description: item.description, amountCents: item.amountCents })), accountId, new Date(), { accountType: accounts.find((account) => account.id === accountId)?.type }))
    .filter((item) => !confirmedNames.has(item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " "))
      && !dismissedRecurringKeys.has(`${item.accountId}:${normalizeMerchant(item.name)}`))
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
    initialAccountId: accounts.some((account) => account.id === query.account) ? query.account : undefined,
    existingRecurring: confirmedRecurring.map((item) => ({ ...item, nextExpected: item.nextExpected?.toISOString().slice(0, 10) ?? null })),
    incomePatternEstablished: Boolean(profile && (profile.incomePatternSource === "onboarding" || profile.incomePatternSource === "user_updated")),
    safetyBufferSetupResolved: Boolean(profile?.safetyBufferConfiguredAt || profile?.safetyBufferPromptDismissedAt),
    dismissedRecurringKeys: [...dismissedRecurringKeys],
  }
  const recurringItems: ManagedRecurringItem[] = managedRecurring.flatMap((item) => {
    if (!["bill", "income"].includes(item.type) || !["weekly", "biweekly", "monthly", "annual"].includes(item.frequency) || !["confirmed", "dismissed"].includes(item.status)) return []
    return [{
      id: item.id,
      name: recurringDisplayName(item.name, item.type),
      type: item.type as ManagedRecurringItem["type"],
      amountCents: item.amountCents,
      frequency: item.frequency as ManagedRecurringItem["frequency"],
      nextExpected: item.nextExpected?.toISOString().slice(0, 10) ?? null,
      accountId: item.accountId,
      accountName: item.accountId ? accountNameById.get(item.accountId) ?? null : null,
      accountType: item.accountId ? accountTypeById.get(item.accountId) ?? null : null,
      source: item.isManual ? "Manual" : "CSV pattern",
      confidence: item.dateConfidence === "confirmed" ? "confirmed" : "estimated",
      status: item.status as ManagedRecurringItem["status"],
      minAmountCents: item.minAmountCents,
      maxAmountCents: item.maxAmountCents,
      occurrenceCount: item.occurrenceCount,
      incomeConfidence: item.incomeConfidence,
    }]
  })
  const decidedTransactionIds = new Set(transferDecisions.flatMap((decision) => [decision.outgoingTransactionId, decision.incomingTransactionId]))
  const transferById = new Map(transferHistory.map((transaction) => [transaction.id, transaction]))
  const transferSuggestions = detectTransferSuggestions(transferHistory
    .filter((transaction) => !decidedTransactionIds.has(transaction.id))
    .map((transaction) => ({
      id: transaction.id,
      accountId: transaction.accountId,
      accountType: transaction.account?.type ?? null,
      accountName: transaction.account?.name ?? null,
      date: transaction.date,
      amountCents: transaction.amountCents,
      description: transaction.description,
    })))
    .flatMap((suggestion) => {
      const outgoing = transferById.get(suggestion.outgoingTransactionId)
      const incoming = transferById.get(suggestion.incomingTransactionId)
      if (!outgoing?.account || !incoming?.account) return []
      return [{
        ...suggestion,
        outgoingDescription: outgoing.description,
        incomingDescription: incoming.description,
        outgoingAccountName: outgoing.account.name,
        incomingAccountName: incoming.account.name,
        amountCents: Math.abs(outgoing.amountCents),
        date: outgoing.date.toISOString().slice(0, 10),
      }]
    })
  const confirmedTransfers = transferDecisions
    .filter((decision) => decision.status === "confirmed" || decision.status === "rejected")
    .flatMap((decision) => decision.outgoingTransaction.account && decision.incomingTransaction.account ? [{
      id: decision.id,
      outgoingDescription: decision.outgoingTransaction.description,
      incomingDescription: decision.incomingTransaction.description,
      outgoingAccountName: decision.outgoingTransaction.account.name,
      incomingAccountName: decision.incomingTransaction.account.name,
      amountCents: Math.abs(decision.outgoingTransaction.amountCents),
      date: decision.outgoingTransaction.date.toISOString().slice(0, 10),
      status: decision.status as "confirmed" | "rejected",
    }] : [])

  return <div className="p-4 sm:p-6 max-w-5xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Transactions</h1><p className="mt-1 text-sm text-muted-foreground">Review activity and manage what FlowSight expects next.</p></div>
      <div className="flex flex-wrap gap-2"><CsvImportPanel autoOpen={query.import === "1"} {...csvProps} /><ManualTransactionPanel accounts={accountOptions} /></div>
    </div>

    <nav className="flex gap-1 border-b border-border mb-6" aria-label="Transaction sections">
      <Link href="/app/transactions" className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === "activity" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Activity</Link>
      <Link href="/app/transactions?tab=recurring" className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === "recurring" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Recurring <span className="ml-1 text-xs text-muted-foreground">{recurringItems.length}</span></Link>
    </nav>

    {tab === "activity" ? <>
      <TransferReviewPanel suggestions={transferSuggestions} confirmed={confirmedTransfers} />
      {transactionCount > 0 || query.q || query.type || query.category ? <TransactionFilters query={query.q} type={query.type} category={query.category} /> : null}
      {transactions.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><ArrowLeftRight className="h-8 w-8 text-primary" /></div><h2 className="text-xl font-semibold mb-2">{transactionCount === 0 && !query.q && !query.type && !query.category ? "No transactions yet" : "No transactions match those filters"}</h2><p className="text-muted-foreground text-sm max-w-sm mb-6">{transactionCount === 0 && !query.q && !query.type && !query.category ? "Import a CSV from your bank or add transactions manually. FlowSight will detect patterns and build your forecast from the history." : "Try a broader search or clear one of those filters."}</p>{transactionCount === 0 && !query.q && !query.type && !query.category ? <div className="flex flex-wrap justify-center gap-3"><CsvImportPanel {...csvProps} /><ManualTransactionPanel accounts={accountOptions} variant="outline" /></div> : <Link href="/app/transactions" className="text-sm text-primary hover:underline">Clear filters</Link>}</div> : <div className="rounded-2xl border border-border bg-card overflow-hidden"><TransactionsTable transactions={transactions.map((transaction) => ({ id: transaction.id, date: transaction.date.toISOString().slice(0, 10), description: transaction.description, accountName: transaction.account?.name ?? null, categoryName: transaction.category?.name ?? null, amountCents: transaction.amountCents, source: transaction.source, transferStatus: transaction.outgoingTransfer?.status ?? transaction.incomingTransfer?.status ?? null, unmatchedCardPayment: isUnmatchedCardPayment(transaction.description, transaction.amountCents, transaction.account?.type) }))} /></div>}
      {totalPages > 1 && <nav className="flex items-center justify-between mt-5 text-sm" aria-label="Transaction pages"><Link href={paramsFor(Math.max(1, page - 1))} aria-disabled={page === 1} className={`rounded-md border border-input px-3 py-2 ${page === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>Previous</Link><span className="text-muted-foreground">Page {Math.min(page, totalPages)} of {totalPages}</span><Link href={paramsFor(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} className={`rounded-md border border-input px-3 py-2 ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>Next</Link></nav>}
    </> : <div className="space-y-6">
      {recurringSuggestions.length > 0 && <RecurringReviewPanel suggestions={recurringSuggestions} />}
      <RecurringManager items={recurringItems} accounts={accounts.map(({ id, name, type }) => ({ id, name, type }))} editId={query.edit} />
    </div>}
  </div>
}
