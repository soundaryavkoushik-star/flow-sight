import Link from "next/link"
import { ArrowLeftRight } from "lucide-react"
import type { Prisma } from "@prisma/client"
import { CsvImportPanel } from "@/components/csv-import-panel"
import { ManualTransactionPanel } from "@/components/manual-transaction-panel"
import { TransactionsTable } from "@/components/transactions-table"
import { RecurringReviewPanel } from "@/components/recurring-review-panel"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { suggestRecurring } from "@/lib/csv/parse"
import { SPENDING_CATEGORIES } from "@/lib/analytics/categories"

const PAGE_SIZE = 25

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ import?: string; q?: string; type?: string; category?: string; page?: string }> }) {
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1)
  const where: Prisma.TransactionWhereInput = user ? {
    userId: user.id,
    ...(query.q?.trim() ? { description: { contains: query.q.trim(), mode: "insensitive" } } : {}),
    ...(query.type === "income" ? { amountCents: { gt: 0 } } : query.type === "expense" ? { amountCents: { lt: 0 } } : {}),
    ...(query.category ? query.category === "Other" ? { OR: [{ category: { name: "Other" } }, { categoryId: null }] } : { category: { name: query.category } } : {}),
  } : { userId: "" }
  const [transactions, transactionCount, recurringHistory, confirmedRecurring, accounts] = user ? await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { date: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { account: { select: { name: true } }, category: { select: { name: true } } } }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({ where: { userId: user.id, accountId: { not: null } }, orderBy: { date: "asc" }, take: 2000 }),
    prisma.recurringSeries.findMany({ where: { userId: user.id, status: "confirmed" }, select: { name: true } }),
    prisma.account.findMany({ where: { userId: user.id, isLiability: false }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, type: true } }),
  ]) : [[], 0, [], [], []]
  const confirmedNames = new Set(confirmedRecurring.map((item) => item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")))
  const accountIds = [...new Set(recurringHistory.map((item) => item.accountId).filter((value): value is string => Boolean(value)))]
  const recurringSuggestions = accountIds.flatMap((accountId) => suggestRecurring(recurringHistory.filter((item) => item.accountId === accountId).map((item) => ({ date: item.date.toISOString().slice(0, 10), description: item.description, amountCents: item.amountCents })), accountId)).filter((item) => !confirmedNames.has(item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")))
  const totalPages = Math.max(1, Math.ceil(transactionCount / PAGE_SIZE))
  const paramsFor = (targetPage: number) => { const params = new URLSearchParams(); if (query.q) params.set("q", query.q); if (query.type) params.set("type", query.type); if (query.category) params.set("category", query.category); params.set("page", String(targetPage)); return `/app/transactions?${params}` }

  return <div className="p-4 sm:p-6 max-w-5xl mx-auto"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"><div><h1 className="text-2xl font-bold tracking-tight">Transactions</h1><p className="text-sm text-muted-foreground mt-0.5">All your income and expenses in one place.</p></div><div className="flex flex-wrap gap-2"><CsvImportPanel autoOpen={query.import === "1"} accounts={accounts} /><ManualTransactionPanel accounts={accounts} /></div></div>

    {transactionCount > 0 || query.q || query.type || query.category ? <form className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 mb-5" action="/app/transactions"><input name="q" defaultValue={query.q} placeholder="Search descriptions" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" /><select name="type" defaultValue={query.type ?? ""} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select><select name="category" defaultValue={query.category ?? ""} className="rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">All categories</option>{SPENDING_CATEGORIES.map((category) => <option key={category.name}>{category.name}</option>)}</select><button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Filter</button></form> : null}

    {recurringHistory.length > 0 && <RecurringReviewPanel suggestions={recurringSuggestions} />}

    {transactions.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><ArrowLeftRight className="h-8 w-8 text-primary" /></div><h2 className="text-xl font-semibold mb-2">{transactionCount === 0 && !query.q && !query.type && !query.category ? "No transactions yet" : "No transactions match those filters"}</h2><p className="text-muted-foreground text-sm max-w-sm mb-6">{transactionCount === 0 && !query.q && !query.type && !query.category ? "Import a CSV from your bank or add transactions manually. FlowSight will detect patterns and build your forecast from the history." : "Try a broader search or clear one of the filters."}</p>{transactionCount === 0 && !query.q && !query.type && !query.category ? <div className="flex flex-wrap justify-center gap-3"><CsvImportPanel accounts={accounts} /><ManualTransactionPanel accounts={accounts} variant="outline" /></div> : <Link href="/app/transactions" className="text-sm text-primary hover:underline">Clear filters</Link>}</div> : <div className="rounded-2xl border border-border bg-card overflow-hidden"><TransactionsTable transactions={transactions.map((transaction) => ({ id: transaction.id, date: transaction.date.toISOString().slice(0, 10), description: transaction.description, accountName: transaction.account?.name ?? null, categoryName: transaction.category?.name ?? null, amountCents: transaction.amountCents, source: transaction.source }))} /></div>}

    {totalPages > 1 && <nav className="flex items-center justify-between mt-5 text-sm" aria-label="Transaction pages"><Link href={paramsFor(Math.max(1, page - 1))} aria-disabled={page === 1} className={`rounded-md border border-input px-3 py-2 ${page === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>Previous</Link><span className="text-muted-foreground">Page {Math.min(page, totalPages)} of {totalPages}</span><Link href={paramsFor(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} className={`rounded-md border border-input px-3 py-2 ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>Next</Link></nav>}
  </div>
}
