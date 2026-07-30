export type CreditCardPaymentStrategy = "full_statement" | "minimum" | "fixed"

export interface CreditCardPaymentPlan {
  statementBalanceCents: number
  minimumPaymentCents: number | null
  fixedPaymentCents: number | null
  paymentStrategy: string
  paymentDueDay: number
}

export interface CardPaymentHistoryItem {
  date: string
  description: string
  amountCents: number
}

export interface CardCycleTransaction {
  date: Date
  description: string
  amountCents: number
}

export interface KnownCardPayment {
  cycleStartDate: string
  cycleCloseDate: string
  dueDate: string
  unpaidStatementBalanceCents: number
  knownCycleChargesCents: number
  expectedPaymentCents: number
  chargeCount: number
  usesFallback: boolean
}

export function suggestCardPaymentFromHistory(items: CardPaymentHistoryItem[]) {
  const payments = items
    .filter((item) => item.amountCents > 0 && /\b(payment received|autopay payment|payment thank|thank you payment)\b/i.test(item.description))
    .sort((a, b) => a.date.localeCompare(b.date))
  if (payments.length < 2) return null
  const amounts = payments.map((item) => item.amountCents)
  const latest = payments.at(-1)!
  const latestDate = new Date(`${latest.date}T00:00:00.000Z`)
  const nextDate = new Date(Date.UTC(
    latestDate.getUTCFullYear(),
    latestDate.getUTCMonth() + 1,
    Math.min(latestDate.getUTCDate(), daysInUtcMonth(latestDate.getUTCFullYear(), latestDate.getUTCMonth() + 1)),
  ))
  return {
    expectedPaymentCents: Math.round(amounts.reduce((total, amount) => total + amount, 0) / amounts.length),
    minPaymentCents: Math.min(...amounts),
    maxPaymentCents: Math.max(...amounts),
    occurrenceCount: payments.length,
    nextPaymentDate: nextDate.toISOString().slice(0, 10),
  }
}

function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function utcDateForDay(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, Math.min(day, daysInUtcMonth(year, month))))
}

function isCardPaymentDescription(description: string) {
  return /\b(payment received|autopay payment|payment thank|thank you payment|card payment)\b/i.test(description)
}

export function buildKnownCardPayment(
  start: Date,
  statementClosingDay: number,
  paymentDueDay: number,
  unpaidStatementBalanceCents: number,
  transactions: CardCycleTransaction[],
): KnownCardPayment {
  let closeYear = start.getUTCFullYear()
  let closeMonth = start.getUTCMonth()
  let closeDate = utcDateForDay(closeYear, closeMonth, statementClosingDay)
  if (closeDate < start) {
    closeMonth += 1
    if (closeMonth > 11) {
      closeMonth = 0
      closeYear += 1
    }
    closeDate = utcDateForDay(closeYear, closeMonth, statementClosingDay)
  }

  let previousCloseMonth = closeMonth - 1
  let previousCloseYear = closeYear
  if (previousCloseMonth < 0) {
    previousCloseMonth = 11
    previousCloseYear -= 1
  }
  const previousCloseDate = utcDateForDay(previousCloseYear, previousCloseMonth, statementClosingDay)
  const cycleStartDate = new Date(previousCloseDate)
  cycleStartDate.setUTCDate(cycleStartDate.getUTCDate() + 1)

  let dueYear = closeYear
  let dueMonth = closeMonth
  let dueDate = utcDateForDay(dueYear, dueMonth, paymentDueDay)
  if (dueDate <= closeDate) {
    dueMonth += 1
    if (dueMonth > 11) {
      dueMonth = 0
      dueYear += 1
    }
    dueDate = utcDateForDay(dueYear, dueMonth, paymentDueDay)
  }

  const cycleActivity = transactions.filter((transaction) =>
    transaction.date >= cycleStartDate
    && transaction.date <= start
    && transaction.date <= closeDate
    && !isCardPaymentDescription(transaction.description),
  )
  const knownCycleChargesCents = Math.max(0, -cycleActivity.reduce((total, transaction) => total + transaction.amountCents, 0))
  const chargeCount = cycleActivity.filter((transaction) => transaction.amountCents < 0).length
  const usesFallback = cycleActivity.length === 0

  return {
    cycleStartDate: cycleStartDate.toISOString().slice(0, 10),
    cycleCloseDate: closeDate.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    unpaidStatementBalanceCents,
    knownCycleChargesCents,
    expectedPaymentCents: usesFallback ? unpaidStatementBalanceCents : unpaidStatementBalanceCents + knownCycleChargesCents,
    chargeCount,
    usesFallback,
  }
}

export function nextCardPaymentDate(start: Date, dueDay: number) {
  let year = start.getUTCFullYear()
  let month = start.getUTCMonth()
  const dateForMonth = () => new Date(Date.UTC(year, month, Math.min(dueDay, daysInUtcMonth(year, month))))
  let dueDate = dateForMonth()
  if (dueDate < start) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
    dueDate = dateForMonth()
  }
  return dueDate
}

export function expectedCardPaymentCents(plan: CreditCardPaymentPlan) {
  if (plan.paymentStrategy === "minimum") return plan.minimumPaymentCents ?? 0
  if (plan.paymentStrategy === "fixed") return plan.fixedPaymentCents ?? 0
  return plan.statementBalanceCents
}

export function cardPaymentStrategyLabel(strategy: string) {
  if (strategy === "minimum") return "Minimum payment"
  if (strategy === "fixed") return "Fixed payment"
  return "Full statement balance"
}

export function isMatchingCardPayment(
  transaction: { date: Date; amountCents: number; accountId: string | null; description: string },
  payment: { dueDate: string; expectedPaymentCents: number; paymentAccountId: string | null; cardName: string },
) {
  if (!payment.paymentAccountId) return false
  if (transaction.accountId !== payment.paymentAccountId || transaction.amountCents !== -payment.expectedPaymentCents) return false
  const dayDifference = Math.abs((transaction.date.getTime() - new Date(`${payment.dueDate}T00:00:00.000Z`).getTime()) / 86_400_000)
  if (dayDifference > 2) return false
  const description = transaction.description.toLowerCase()
  const cardWords = payment.cardName.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 4)
  return /\b(card|credit|payment|autopay)\b/.test(description) || cardWords.some((word) => description.includes(word))
}
