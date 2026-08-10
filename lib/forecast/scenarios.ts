import { calculateForecast } from "./engine"
import type { FinancialEvent, ForecastInput, ScenarioComparison } from "./types"

export function runScenario(input: ForecastInput, hypotheticalEvents: FinancialEvent[]): ScenarioComparison {
  const baseline = calculateForecast(input)
  const scenario = calculateForecast({
    ...input,
    events: [...input.events, ...hypotheticalEvents.map((event) => ({ ...event, source: "scenario" as const }))],
  })
  const comparisonStartDate = hypotheticalEvents.length > 0
    ? hypotheticalEvents.reduce((earliest, event) => event.date < earliest ? event.date : earliest, hypotheticalEvents[0].date)
    : input.settings.startDate
  const baselineComparisonLow = findLowestOnOrAfter(baseline, comparisonStartDate)
  const scenarioComparisonLow = findLowestOnOrAfter(scenario, comparisonStartDate)
  const scenarioComparisonSafeToSpendCents = Math.max(0, scenarioComparisonLow.balanceCents - input.settings.safetyBufferCents)
  const baselineComparisonSafeToSpendCents = Math.max(0, baselineComparisonLow.balanceCents - input.settings.safetyBufferCents)

  return {
    baseline,
    scenario,
    comparisonStartDate,
    baselineComparisonLowCents: baselineComparisonLow.balanceCents,
    baselineComparisonLowDate: baselineComparisonLow.date,
    scenarioComparisonLowCents: scenarioComparisonLow.balanceCents,
    scenarioComparisonLowDate: scenarioComparisonLow.date,
    scenarioComparisonSafeToSpendCents,
    lowestBalanceDeltaCents: scenarioComparisonLow.balanceCents - baselineComparisonLow.balanceCents,
    safeToSpendDeltaCents: scenarioComparisonSafeToSpendCents - baselineComparisonSafeToSpendCents,
    riskChanged: riskSetChanged(baseline.risks, scenario.risks),
  }
}

function findLowestOnOrAfter(result: ScenarioComparison["baseline"], startDate: string) {
  const days = result.days.filter((day) => day.date >= startDate)
  if (days.length === 0) throw new Error(`Scenario comparison date ${startDate} is outside the forecast window`)
  return days.reduce((lowest, day) => day.endingBalanceCents < lowest.balanceCents
    ? { balanceCents: day.endingBalanceCents, date: day.date }
    : lowest, { balanceCents: days[0].endingBalanceCents, date: days[0].date })
}

export function riskSetChanged(baseline: Array<{ type: string; date: string }>, scenario: Array<{ type: string; date: string }>) {
  const left = new Set(baseline.map((risk) => `${risk.type}:${risk.date}`))
  const right = new Set(scenario.map((risk) => `${risk.type}:${risk.date}`))
  return left.size !== right.size || [...left].some((risk) => !right.has(risk))
}
