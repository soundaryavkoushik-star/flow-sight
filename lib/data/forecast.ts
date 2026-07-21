import { prisma } from "@/lib/data/prisma"
import { getForecast } from "@/lib/services/forecast"
import type { FinancialEvent, ForecastInput, ForecastResult, RecurringRule } from "@/lib/forecast"
import { buildSpendingHistory, type SpendingHistory } from "@/lib/analytics/spending"
import { buildMonthlySpending } from "@/lib/analytics/categories"
import { measureForecasts } from "@/lib/analytics/forecast-measurement"

export interface DashboardForecast {
  currentBalanceCents: number
  currentBalanceDate: string
  safetyBufferCents: number
  preferences: {
    alertSafetyBuffer: boolean
    alertKnownBill: boolean
    alertEstimateReview: boolean
    alertStaleBalance: boolean
    alertLeadDays: number
    dashboardEmphasis: "status" | "calendar" | "decision"
    dashboardDensity: "comfortable" | "compact"
    showSpendingHistory: boolean
  }
  previousForecast: {
    viewedAt: string | null
    safeToSpendCents: number | null
    lowestBalanceCents: number | null
  }
  input: ForecastInput
  forecast: ForecastResult
  spendingHistory: SpendingHistory
  monthlySpending: ReturnType<typeof buildMonthlySpending>
  freshness: { balanceAgeDays: number; status: "fresh" | "aging" | "stale" }
  excludedEvents: Array<{ name: string; date: string; amountCents: number }>
  trackRecord: ReturnType<typeof measureForecasts>
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

export async function loadDashboardForecast(userId: string, days = 30): Promise<DashboardForecast | null> {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const end = addUtcDays(start, days)

  const historyStart = addUtcDays(start, -55)
  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  const [profile, accounts, transactions, snapshots, observations, recurring, historicalTransactions, monthlyTransactions] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.account.findMany({ where: { userId, isLiability: false } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.forecastSnapshot.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, select: { createdAt: true, forecastStartDate: true, forecastEndDate: true, projectedDays: true } }),
    prisma.actualBalanceObservation.findMany({ where: { userId }, orderBy: { observedAt: "desc" }, take: 500, select: { accountId: true, balanceCents: true, observedAt: true, createdAt: true } }),
    prisma.recurringSeries.findMany({
      where: {
        userId,
        status: "confirmed",
        nextExpected: { not: null, lt: end },
        frequency: { in: ["weekly", "biweekly", "monthly", "annual"] },
      },
      orderBy: { nextExpected: "asc" },
      include: { exceptions: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: historyStart, lt: addUtcDays(start, 1) }, amountCents: { lt: 0 } },
      orderBy: { date: "asc" },
      select: { date: true, amountCents: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: monthStart, lt: addUtcDays(start, 1) }, amountCents: { lt: 0 } },
      select: { description: true, amountCents: true, category: { select: { name: true } } },
    }),
  ])

  const anchoredAccounts = accounts.filter((account) => account.anchorBalanceCents !== null)
  if (anchoredAccounts.length === 0) return null

  const currentBalanceCents = anchoredAccounts.reduce(
    (total, account) => total + (account.anchorBalanceCents ?? 0),
    0,
  )
  const currentBalanceDate = anchoredAccounts
    .map((account) => account.anchorDate)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? start

  const events: FinancialEvent[] = transactions.map((transaction) => ({
    id: transaction.id,
    date: dateKey(transaction.date),
    amountCents: transaction.amountCents,
    type: transaction.amountCents >= 0 ? "income" : "expense",
    source: transaction.source ? "csv" : "transaction",
    name: transaction.description,
    accountId: transaction.accountId ?? undefined,
    confidence: "confirmed",
  }))

  const recurringRules: RecurringRule[] = recurring.map((item) => ({
    id: item.id,
    name: item.name,
    amountCents: item.amountCents,
    frequency: item.frequency as RecurringRule["frequency"],
    nextDate: dateKey(item.nextExpected!),
    accountId: item.accountId ?? undefined,
    confidence: item.dateConfidence === "confirmed" ? "confirmed" : "estimated",
    exceptions: item.exceptions.map((exception) => ({ date: dateKey(exception.originalDate), movedDate: exception.movedDate ? dateKey(exception.movedDate) : undefined })),
  }))

  const input: ForecastInput = {
    startingBalanceCents: currentBalanceCents,
    events,
    recurringRules,
    settings: {
      startDate: dateKey(start),
      days,
      safetyBufferCents: profile?.safetyBufferCents ?? 0,
    },
  }
  const balanceAgeDays = Math.max(0, Math.floor((start.getTime() - currentBalanceDate.getTime()) / 86_400_000))
  const excludedEvents = recurring.flatMap((series) => series.exceptions
    .filter((exception) => exception.action === "skip" && exception.originalDate >= start && exception.originalDate < end)
    .map((exception) => ({ name: series.name, date: dateKey(exception.originalDate), amountCents: series.amountCents })))

  return {
    currentBalanceCents,
    currentBalanceDate: dateKey(currentBalanceDate),
    safetyBufferCents: profile?.safetyBufferCents ?? 0,
    preferences: {
      alertSafetyBuffer: profile?.alertSafetyBuffer ?? true,
      alertKnownBill: profile?.alertKnownBill ?? true,
      alertEstimateReview: profile?.alertEstimateReview ?? true,
      alertStaleBalance: profile?.alertStaleBalance ?? true,
      alertLeadDays: profile?.alertLeadDays ?? 3,
      dashboardEmphasis: (profile?.dashboardEmphasis as "status" | "calendar" | "decision") ?? "status",
      dashboardDensity: (profile?.dashboardDensity as "comfortable" | "compact") ?? "comfortable",
      showSpendingHistory: profile?.showSpendingHistory ?? false,
    },
    previousForecast: {
      viewedAt: profile?.lastForecastViewedAt?.toISOString() ?? null,
      safeToSpendCents: profile?.lastSafeToSpendCents ?? null,
      lowestBalanceCents: profile?.lastLowestBalanceCents ?? null,
    },
    input,
    forecast: getForecast(input),
    spendingHistory: buildSpendingHistory(historicalTransactions, start),
    monthlySpending: buildMonthlySpending(monthlyTransactions.map((transaction) => ({ description: transaction.description, amountCents: transaction.amountCents, categoryName: transaction.category?.name }))),
    freshness: { balanceAgeDays, status: balanceAgeDays >= 7 ? "stale" : balanceAgeDays >= 3 ? "aging" : "fresh" },
    excludedEvents,
    trackRecord: measureForecasts(snapshots, observations, anchoredAccounts.map((account) => account.id)),
  }
}
