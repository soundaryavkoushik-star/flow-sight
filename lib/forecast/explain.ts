import type { ForecastDay, ForecastExplanation } from "./types"

export function explainLowestPoint(days: ForecastDay[], lowestDate: string): ForecastExplanation[] {
  const day = days.find((item) => item.date === lowestDate)
  if (!day) return []

  const lowestIndex = days.findIndex((item) => item.date === lowestDate)
  let lastIncomeIndex = -1
  for (let index = 0; index <= lowestIndex; index += 1) {
    if (days[index].events.some((event) => event.amountCents > 0)) lastIncomeIndex = index
  }
  const relevantDays = days.slice(Math.max(0, lastIncomeIndex), lowestIndex + 1)
  const expenses = relevantDays.flatMap((item) => item.events)
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
    headline: `${expenses.map((event) => event.name).join(", ")} ${expenses.length === 1 ? "is" : "are"} the main spending before the low point on ${lowestDate}, when your balance may reach its forecast low.`,
    eventIds: expenses.map((event) => event.id),
  }]
}
