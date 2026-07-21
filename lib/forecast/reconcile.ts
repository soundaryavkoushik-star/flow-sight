import type { FinancialEvent } from "./types"

function normalizedName(value: string) {
  return value.toLowerCase().replace(/\b(pos|debit|credit|purchase|payment|card|ach|online|recurring)\b/g, " ").replace(/\b\d{3,}\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim()
}

function dateDistance(left: string, right: string) {
  return Math.abs((new Date(`${left}T00:00:00Z`).getTime() - new Date(`${right}T00:00:00Z`).getTime()) / 86_400_000)
}

export function suppressMatchedRecurringEvents(events: FinancialEvent[], recurringEvents: FinancialEvent[]) {
  const posted = events.filter((event) => event.source === "csv" || event.source === "transaction")
  return recurringEvents.filter((recurring) => !posted.some((transaction) => {
    if (transaction.accountId && recurring.accountId && transaction.accountId !== recurring.accountId) return false
    const amountTolerance = Math.max(500, Math.round(Math.abs(recurring.amountCents) * 0.1))
    return normalizedName(transaction.name) === normalizedName(recurring.name) && dateDistance(transaction.date, recurring.date) <= 2 && Math.abs(transaction.amountCents - recurring.amountCents) <= amountTolerance
  }))
}
