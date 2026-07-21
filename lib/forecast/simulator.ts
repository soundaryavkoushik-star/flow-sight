import type { FinancialEvent, ForecastDay, MoneyCents } from "./types"
import { addDays } from "./utils"

export function simulateDailyBalances(
  startingBalanceCents: MoneyCents,
  events: FinancialEvent[],
  startDate: string,
  days: number,
): ForecastDay[] {
  if (!Number.isInteger(startingBalanceCents)) throw new Error("startingBalanceCents must be an integer")
  if (!Number.isInteger(days) || days <= 0) throw new Error("days must be a positive integer")

  const eventsByDate = new Map<string, FinancialEvent[]>()
  for (const event of events) {
    if (!Number.isInteger(event.amountCents)) throw new Error(`Event ${event.id} amountCents must be an integer`)
    const list = eventsByDate.get(event.date) ?? []
    list.push(event)
    eventsByDate.set(event.date, list)
  }

  const result: ForecastDay[] = []
  let balance = startingBalanceCents

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(startDate, offset)
    const dayEvents = [...(eventsByDate.get(date) ?? [])].sort((a, b) => a.id.localeCompare(b.id))
    const openingBalanceCents = balance
    const netChangeCents = dayEvents.reduce((sum, event) => sum + event.amountCents, 0)
    balance += netChangeCents

    result.push({
      date,
      openingBalanceCents,
      events: dayEvents,
      netChangeCents,
      endingBalanceCents: balance,
    })
  }

  return result
}
