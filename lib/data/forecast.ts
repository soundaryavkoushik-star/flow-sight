import { prisma } from "@/lib/data/prisma"
import { getForecast } from "@/lib/services/forecast"
import type { FinancialEvent, ForecastInput, ForecastResult, RecurringRule } from "@/lib/forecast"
import { buildSpendingHistory, type SpendingHistory } from "@/lib/analytics/spending"
import { buildMonthlySpending } from "@/lib/analytics/categories"
import { measureForecasts } from "@/lib/analytics/forecast-measurement"
import { rollForwardAnchors } from "@/lib/forecast/anchors"
import { financialDateKey } from "@/lib/forecast/timezone"
import { recurringDisplayName } from "@/lib/financial/recurring-label"
import { buildKnownCardPayment, isMatchingCardPayment } from "@/lib/forecast/credit-cards"

export interface DashboardForecast {
  timezone: string
  includedAccountIds: string[]
  currentBalanceCents: number
  currentBalanceDate: string
  safetyBufferCents: number
  safetyBufferConfigured: boolean
  safetyBufferPromptDismissed: boolean
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
    accountIds: string[]
  }
  input: ForecastInput
  forecast: ForecastResult
  spendingHistory: SpendingHistory
  monthlySpending: ReturnType<typeof buildMonthlySpending>
  freshness: { balanceAgeDays: number; status: "fresh" | "aging" | "stale" }
  excludedEvents: Array<{ name: string; date: string; amountCents: number }>
  balanceRollForward: Array<{ accountName: string; anchorBalanceCents: number; anchorDate: string; activityCents: number; openingBalanceCents: number }>
  cardPayments: Array<{
    cardName: string
    paymentAccountName: string
    statementBalanceCents: number
    knownCycleChargesCents: number
    expectedPaymentCents: number
    chargeCount: number
    cycleCloseDate: string
    usesFallback: boolean
    dueDate: string
    strategy: string
  }>
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

function shortMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}

function shortDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export async function loadDashboardForecast(userId: string, days = 30): Promise<DashboardForecast | null> {
  const [profile, accounts] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.account.findMany({ where: { userId, isLiability: false } }),
  ])
  const timezone = profile?.timezone ?? "UTC"
  const safetyBufferCents = profile?.safetyBufferConfiguredAt ? profile.safetyBufferCents : 0
  const start = new Date(`${financialDateKey(new Date(), timezone)}T00:00:00.000Z`)
  const end = addUtcDays(start, days)
  const historyStart = addUtcDays(start, -55)
  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  const [transactions, snapshots, observations, recurring, historicalTransactions, monthlyTransactions, creditCards, confirmedTransfers] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: historyStart, lt: end } },
      orderBy: { date: "asc" },
      include: { account: { select: { isLiability: true } } },
    }),
    prisma.forecastSnapshot.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, select: { createdAt: true, forecastStartDate: true, forecastEndDate: true, projectedDays: true, includedAccountIds: true } }),
    prisma.actualBalanceObservation.findMany({ where: { userId }, orderBy: { observedAt: "desc" }, take: 500, select: { accountId: true, balanceCents: true, observedAt: true, createdAt: true } }),
    prisma.recurringSeries.findMany({
      where: {
        userId,
        status: "confirmed",
        nextExpected: { not: null, lt: end },
        frequency: { in: ["weekly", "biweekly", "monthly", "annual", "irregular"] },
      },
      orderBy: { nextExpected: "asc" },
      include: { exceptions: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: historyStart, lt: addUtcDays(start, 1) }, amountCents: { lt: 0 } },
      orderBy: { date: "asc" },
      select: { id: true, date: true, amountCents: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: monthStart, lt: addUtcDays(start, 1) }, amountCents: { lt: 0 } },
      select: { id: true, description: true, amountCents: true, category: { select: { name: true } } },
    }),
    prisma.creditCardSettings.findMany({
      where: { userId },
      include: {
        account: { select: { id: true, name: true } },
        paymentAccount: { select: { id: true, name: true } },
      },
    }),
    prisma.transactionTransfer.findMany({
      where: { userId, status: "confirmed" },
      include: {
        outgoingTransaction: { include: { account: { select: { isLiability: true } } } },
        incomingTransaction: { include: { account: { select: { isLiability: true } } } },
      },
    }),
  ])

  const anchoredAccounts = accounts.filter((account) => account.anchorBalanceCents !== null)
  if (anchoredAccounts.length === 0) return null

  const balanceRollForward = rollForwardAnchors(anchoredAccounts, transactions, start)
  const currentBalanceCents = balanceRollForward.totalCents
  const currentBalanceDate = anchoredAccounts
    .map((account) => account.anchorDate)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? start

  const creditCardAccountIds = new Set(creditCards.map((card) => card.account.id))
  const confirmedTransferTransactionIds = new Set(confirmedTransfers.flatMap((transfer) => [transfer.outgoingTransactionId, transfer.incomingTransactionId]))
  const cashToLiabilityTransferIds = new Set(confirmedTransfers
    .filter((transfer) => !transfer.outgoingTransaction.account?.isLiability && transfer.incomingTransaction.account?.isLiability)
    .map((transfer) => transfer.outgoingTransactionId))
  const cardPayments = creditCards.flatMap((card) => {
    const payment = buildKnownCardPayment(
      start,
      card.statementClosingDay,
      card.paymentDueDay,
      card.statementBalanceCents,
      transactions
        .filter((transaction) => transaction.accountId === card.account.id && !confirmedTransferTransactionIds.has(transaction.id))
        .map((transaction) => ({
          date: transaction.date,
          description: transaction.description,
          amountCents: transaction.amountCents,
        })),
    )
    if (payment.expectedPaymentCents <= 0 || new Date(`${payment.dueDate}T00:00:00.000Z`) >= end) return []
    return [{
      cardName: card.account.name,
      paymentAccountName: card.paymentAccount?.name ?? "an account FlowSight will identify",
      statementBalanceCents: card.statementBalanceCents,
      knownCycleChargesCents: payment.knownCycleChargesCents,
      expectedPaymentCents: payment.expectedPaymentCents,
      chargeCount: payment.chargeCount,
      cycleCloseDate: payment.cycleCloseDate,
      usesFallback: payment.usesFallback,
      dueDate: payment.dueDate,
      strategy: payment.usesFallback
        ? "Cold-start estimate — no card purchases are available for this cycle yet"
        : `Based on ${payment.chargeCount} ${payment.chargeCount === 1 ? "charge" : "charges"} recorded so far: ${shortMoney(card.statementBalanceCents)} unpaid statement + ${shortMoney(payment.knownCycleChargesCents)} current-cycle activity. More spending before ${shortDate(payment.cycleCloseDate)} will increase this payment`,
      paymentAccountId: card.paymentAccount?.id ?? null,
      cardAccountId: card.account.id,
      settingsId: card.id,
    }]
  })

  const plannedCardPayments = cardPayments.filter((payment) => {
    const matchingImportedPayment = transactions.some((transaction) => isMatchingCardPayment(transaction, payment))
    const matchingLinkedTransfer = confirmedTransfers.some((transfer) =>
      transfer.incomingTransaction.accountId === payment.cardAccountId
      && transfer.outgoingTransaction.amountCents === -payment.expectedPaymentCents
      && Math.abs((transfer.outgoingTransaction.date.getTime() - new Date(`${payment.dueDate}T00:00:00.000Z`).getTime()) / 86_400_000) <= 2,
    )
    return !matchingImportedPayment && !matchingLinkedTransfer
  })
  const events: FinancialEvent[] = [...transactions.filter((transaction) =>
    transaction.date >= start
    && !transaction.account?.isLiability
    && (!confirmedTransferTransactionIds.has(transaction.id) || cashToLiabilityTransferIds.has(transaction.id)),
  ).map((transaction) => ({
    id: transaction.id,
    date: dateKey(transaction.date),
    amountCents: transaction.amountCents,
    type: transaction.amountCents >= 0 ? "income" as const : "expense" as const,
    source: transaction.source ? "csv" as const : "transaction" as const,
    name: transaction.description,
    accountId: transaction.accountId ?? undefined,
    confidence: "confirmed" as const,
  })), ...recurring.filter((item) => item.frequency === "irregular" && item.nextExpected && !creditCardAccountIds.has(item.accountId ?? "")).map((item) => ({ id: item.id, date: dateKey(item.nextExpected!), amountCents: item.amountCents, type: "income" as const, source: "manual" as const, name: recurringDisplayName(item.name, item.type), accountId: item.accountId ?? undefined, confidence: item.dateConfidence === "confirmed" ? "confirmed" as const : "estimated" as const })),
  ...plannedCardPayments.map((payment) => ({
    id: `credit-card-payment:${payment.settingsId}`,
    date: payment.dueDate,
    amountCents: -payment.expectedPaymentCents,
    type: "expense" as const,
    source: "manual" as const,
    name: `${payment.cardName} payment`,
    accountId: payment.paymentAccountId ?? undefined,
    confidence: "estimated" as const,
  }))]

  const recurringRules: RecurringRule[] = recurring.filter((item) => item.frequency !== "irregular" && !creditCardAccountIds.has(item.accountId ?? "")).map((item) => ({
    id: item.id,
    name: recurringDisplayName(item.name, item.type),
    amountCents: item.amountCents,
    frequency: item.frequency as RecurringRule["frequency"],
    nextDate: dateKey(item.nextExpected!),
    anchorDayOfMonth: item.anchorDayOfMonth ?? undefined,
    accountId: item.accountId ?? undefined,
    confidence: item.dateConfidence === "confirmed" ? "confirmed" : "estimated",
    estimateEvidence: item.minAmountCents !== null && item.maxAmountCents !== null && item.occurrenceCount !== null ? { minAmountCents: item.minAmountCents, maxAmountCents: item.maxAmountCents, occurrenceCount: item.occurrenceCount, startDate: item.evidenceStartDate ? dateKey(item.evidenceStartDate) : undefined, endDate: item.evidenceEndDate ? dateKey(item.evidenceEndDate) : undefined } : undefined,
    exceptions: item.exceptions.map((exception) => ({ date: dateKey(exception.originalDate), movedDate: exception.movedDate ? dateKey(exception.movedDate) : undefined })),
  }))

  const input: ForecastInput = {
    startingBalanceCents: currentBalanceCents,
    events,
    recurringRules,
    settings: {
      startDate: dateKey(start),
      days,
      safetyBufferCents,
    },
  }
  const balanceAgeDays = Math.max(0, Math.floor((start.getTime() - currentBalanceDate.getTime()) / 86_400_000))
  const excludedEvents = recurring.flatMap((series) => series.exceptions
    .filter((exception) => exception.action === "skip" && exception.originalDate >= start && exception.originalDate < end)
    .map((exception) => ({ name: series.name, date: dateKey(exception.originalDate), amountCents: series.amountCents })))

  return {
    timezone,
    includedAccountIds: anchoredAccounts.map((account) => account.id).sort(),
    currentBalanceCents,
    currentBalanceDate: dateKey(currentBalanceDate),
    safetyBufferCents,
    safetyBufferConfigured: Boolean(profile?.safetyBufferConfiguredAt),
    safetyBufferPromptDismissed: Boolean(profile?.safetyBufferPromptDismissedAt),
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
      accountIds: Array.isArray(profile?.lastForecastAccountIds) ? profile.lastForecastAccountIds.filter((value): value is string => typeof value === "string") : [],
    },
    input,
    forecast: getForecast(input),
    spendingHistory: buildSpendingHistory(historicalTransactions.filter((transaction) => !confirmedTransferTransactionIds.has(transaction.id)), start),
    monthlySpending: buildMonthlySpending(monthlyTransactions.filter((transaction) => !confirmedTransferTransactionIds.has(transaction.id)).map((transaction) => ({ description: transaction.description, amountCents: transaction.amountCents, categoryName: transaction.category?.name }))),
    freshness: { balanceAgeDays, status: balanceAgeDays >= 7 ? "stale" : balanceAgeDays >= 3 ? "aging" : "fresh" },
    excludedEvents,
    balanceRollForward: balanceRollForward.items.map((item) => ({ accountName: item.accountName, anchorBalanceCents: item.anchorBalanceCents, anchorDate: dateKey(item.anchorDate ?? start), activityCents: item.activityCents, openingBalanceCents: item.openingBalanceCents })),
    cardPayments: cardPayments.map(({ cardName, paymentAccountName, statementBalanceCents, knownCycleChargesCents, expectedPaymentCents, chargeCount, cycleCloseDate, usesFallback, dueDate, strategy }) => ({ cardName, paymentAccountName, statementBalanceCents, knownCycleChargesCents, expectedPaymentCents, chargeCount, cycleCloseDate, usesFallback, dueDate, strategy })),
    trackRecord: measureForecasts(snapshots, observations, anchoredAccounts.map((account) => account.id)),
  }
}
