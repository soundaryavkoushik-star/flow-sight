import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.dataExport)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many exports. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds), "Cache-Control": "private, no-store" } },
    )
  }

  const [profile, accounts, transactions, categories, categoryRules, recurringSeries, recurringExceptions, forecastSnapshots, actualBalanceObservations, recurringSuggestionDecisions, transactionTransfers, creditCardSettings] = await prisma.$transaction([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.categoryRule.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.recurringSeries.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.recurringException.findMany({ where: { userId: user.id }, orderBy: { originalDate: "asc" } }),
    prisma.forecastSnapshot.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.actualBalanceObservation.findMany({ where: { userId: user.id }, orderBy: { observedAt: "asc" } }),
    prisma.recurringSuggestionDecision.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.transactionTransfer.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.creditCardSettings.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ])

  const body = JSON.stringify({
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    profile,
    accounts,
    transactions,
    categories,
    categoryRules,
    recurringSeries,
    recurringExceptions,
    forecastSnapshots,
    actualBalanceObservations,
    recurringSuggestionDecisions,
    transactionTransfers,
    creditCardSettings,
  }, null, 2)

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="cusp-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  })
}
