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

  const nextIncomeIndex = days.findIndex((item, index) => index > lowestIndex && item.events.some((event) => event.amountCents > 0))
  const formatEventDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const timing = lastIncomeIndex >= 0 && nextIncomeIndex >= 0
    ? ` after income on ${formatEventDate(days[lastIncomeIndex].date)} and before the next income on ${formatEventDate(days[nextIncomeIndex].date)}`
    : nextIncomeIndex >= 0
      ? ` before income on ${formatEventDate(days[nextIncomeIndex].date)}`
      : lastIncomeIndex >= 0
        ? ` after income on ${formatEventDate(days[lastIncomeIndex].date)}`
        : ""
  const names = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" })
    .format(expenses.map((event) => event.name))
  const lowPointDate = formatEventDate(lowestDate)
  const allRecurring = expenses.every((event) => event.recurring || event.source === "recurring")
  const allConfirmed = expenses.every((event) => event.confidence === "confirmed")
  const allEstimated = expenses.every((event) => event.confidence === "estimated")
  const timingVerb = !allRecurring ? (expenses.length === 1 ? "lands" : "land") : allConfirmed ? "are due" : allEstimated ? "are expected" : "include confirmed and estimated charges"

  return [{
    date: lowestDate,
    headline: `${names} ${expenses.length === 1 && allRecurring && allConfirmed ? "is due" : expenses.length === 1 && allRecurring && allEstimated ? "is expected" : timingVerb}${timing}, bringing your projected balance to its low on ${lowPointDate}.`,
    eventIds: expenses.map((event) => event.id),
  }]
}
