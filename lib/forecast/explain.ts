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

  const nextIncomeExists = days
    .slice(lowestIndex + 1)
    .some((item) => item.events.some((event) => event.amountCents > 0))
  const names = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" })
    .format(expenses.map((event) => event.name))
  const date = new Date(`${lowestDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(day.endingBalanceCents / 100)

  return [{
    date: lowestDate,
    headline: `${names} ${expenses.length === 1 ? "is" : "are"} expected${nextIncomeExists ? " before your next income" : ""}, bringing your projected balance to its 30-day low of ${amount} on ${date}.`,
    eventIds: expenses.map((event) => event.id),
  }]
}
