import type { FinancialEvent, RecurringRule } from "./types"
import { addDays, addMonthsClamped } from "./utils"

function nextOccurrence(date: string, frequency: RecurringRule["frequency"]): string {
  switch (frequency) {
    case "weekly": return addDays(date, 7)
    case "biweekly": return addDays(date, 14)
    case "monthly": return addMonthsClamped(date, 1)
    case "annual": return addMonthsClamped(date, 12)
  }
}

export function generateRecurringEvents(
  rules: RecurringRule[],
  startDate: string,
  endDate: string,
): FinancialEvent[] {
  const events: FinancialEvent[] = []

  for (const rule of rules) {
    let date = rule.nextDate
    let occurrence = 0

    while (date <= endDate) {
      const exception = rule.exceptions?.find((item) => item.date === date)
      const eventDate = exception?.movedDate ?? date
      if (!exception?.movedDate && exception) {
        date = nextOccurrence(date, rule.frequency)
        occurrence += 1
        continue
      }
      if (eventDate >= startDate && eventDate <= endDate) {
        events.push({
          id: `recurring:${rule.id}:${date}:${occurrence}`,
          date: eventDate,
          amountCents: rule.amountCents,
          type: rule.amountCents >= 0 ? "income" : "expense",
          source: "recurring",
          name: rule.name,
          accountId: rule.accountId,
          recurring: true,
          confidence: rule.confidence ?? "confirmed",
        })
      }
      date = nextOccurrence(date, rule.frequency)
      occurrence += 1
    }
  }

  return events
}
