import type { ForecastDay, ForecastRisk, MoneyCents } from "./types"

export function findLowestBalance(days: ForecastDay[]): { balanceCents: MoneyCents; date: string } {
  if (days.length === 0) throw new Error("Forecast must contain at least one day")
  return days.reduce(
    (lowest, day) => day.endingBalanceCents < lowest.balanceCents
      ? { balanceCents: day.endingBalanceCents, date: day.date }
      : lowest,
    { balanceCents: days[0].endingBalanceCents, date: days[0].date },
  )
}

export function calculateSafeToSpend(lowestBalanceCents: MoneyCents, safetyBufferCents: MoneyCents): MoneyCents {
  return Math.max(0, lowestBalanceCents - safetyBufferCents)
}

export function detectRisks(days: ForecastDay[], safetyBufferCents: MoneyCents): ForecastRisk[] {
  const risks: ForecastRisk[] = []

  for (const day of days) {
    if (day.endingBalanceCents < 0) {
      risks.push({
        type: "negative_balance",
        date: day.date,
        balanceCents: day.endingBalanceCents,
        severity: "critical",
      })
    } else if (day.endingBalanceCents < safetyBufferCents) {
      risks.push({
        type: "safety_buffer_breach",
        date: day.date,
        balanceCents: day.endingBalanceCents,
        severity: "warning",
      })
    }
  }

  return risks
}
