import type { ForecastDay, ForecastExplanation } from "./types"

export function explainLowestPoint(days: ForecastDay[], lowestDate: string): ForecastExplanation[] {
  const day = days.find((item) => item.date === lowestDate)
  if (!day) return []

  const expenses = day.events
    .filter((event) => event.amountCents < 0)
    .sort((a, b) => a.amountCents - b.amountCents)
    .slice(0, 3)

  if (expenses.length === 0) {
    return [{
      date: lowestDate,
      headline: "This is the lowest projected balance in the forecast window.",
      eventIds: day.events.map((event) => event.id),
    }]
  }

  return [{
    date: lowestDate,
    headline: `${expenses.map((event) => event.name).join(", ")} ${expenses.length === 1 ? "is" : "are"} driving the projected low point.`,
    eventIds: expenses.map((event) => event.id),
  }]
}
