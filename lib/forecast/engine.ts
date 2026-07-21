import { explainLowestPoint } from "./explain"
import { calculateSafeToSpend, detectRisks, findLowestBalance } from "./metrics"
import { generateRecurringEvents } from "./recurring"
import { simulateDailyBalances } from "./simulator"
import type { ForecastInput, ForecastResult } from "./types"
import { addDays, isInRange } from "./utils"

export function calculateForecast(input: ForecastInput): ForecastResult {
  const { startingBalanceCents, settings } = input
  if (!Number.isInteger(settings.safetyBufferCents) || settings.safetyBufferCents < 0) {
    throw new Error("safetyBufferCents must be a non-negative integer")
  }

  const endDate = addDays(settings.startDate, settings.days - 1)
  const recurringEvents = generateRecurringEvents(
    input.recurringRules ?? [],
    settings.startDate,
    endDate,
  )

  const events = [...input.events, ...recurringEvents]
    .filter((event) => isInRange(event.date, settings.startDate, endDate))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  const days = simulateDailyBalances(
    startingBalanceCents,
    events,
    settings.startDate,
    settings.days,
  )

  const lowest = findLowestBalance(days)

  return {
    days,
    lowestBalanceCents: lowest.balanceCents,
    lowestBalanceDate: lowest.date,
    safeToSpendCents: calculateSafeToSpend(lowest.balanceCents, settings.safetyBufferCents),
    risks: detectRisks(days, settings.safetyBufferCents),
    explanations: explainLowestPoint(days, lowest.date),
  }
}
