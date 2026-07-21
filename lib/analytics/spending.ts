export interface SpendingTransaction {
  date: Date
  amountCents: number
}

export interface SpendingWeek {
  startDate: string
  endDate: string
  spendingCents: number
  transactionCount: number
}

export interface SpendingHistory {
  weeks: SpendingWeek[]
  recentFourWeeksCents: number
  previousFourWeeksCents: number
  changePercent: number | null
  transactionCount: number
}

function startOfUtcDay(date: Date) {
  const result = new Date(date)
  result.setUTCHours(0, 0, 0, 0)
  return result
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function buildSpendingHistory(transactions: SpendingTransaction[], asOf = new Date()): SpendingHistory {
  const tomorrow = addUtcDays(startOfUtcDay(asOf), 1)
  const rangeStart = addUtcDays(tomorrow, -56)
  const weeks = Array.from({ length: 8 }, (_, index): SpendingWeek => {
    const start = addUtcDays(rangeStart, index * 7)
    const end = addUtcDays(start, 7)
    const expenses = transactions.filter((transaction) => transaction.amountCents < 0 && transaction.date >= start && transaction.date < end)
    return {
      startDate: dateKey(start),
      endDate: dateKey(addUtcDays(end, -1)),
      spendingCents: Math.abs(expenses.reduce((total, transaction) => total + transaction.amountCents, 0)),
      transactionCount: expenses.length,
    }
  })
  const previousFourWeeksCents = weeks.slice(0, 4).reduce((total, week) => total + week.spendingCents, 0)
  const recentFourWeeksCents = weeks.slice(4).reduce((total, week) => total + week.spendingCents, 0)
  const changePercent = previousFourWeeksCents === 0
    ? null
    : Math.round(((recentFourWeeksCents - previousFourWeeksCents) / previousFourWeeksCents) * 100)

  return {
    weeks,
    recentFourWeeksCents,
    previousFourWeeksCents,
    changePercent,
    transactionCount: weeks.reduce((total, week) => total + week.transactionCount, 0),
  }
}
