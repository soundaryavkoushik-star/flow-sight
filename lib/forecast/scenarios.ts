import { calculateForecast } from "./engine"
import type { FinancialEvent, ForecastInput, ScenarioComparison } from "./types"

export function runScenario(input: ForecastInput, hypotheticalEvents: FinancialEvent[]): ScenarioComparison {
  const baseline = calculateForecast(input)
  const scenario = calculateForecast({
    ...input,
    events: [...input.events, ...hypotheticalEvents.map((event) => ({ ...event, source: "scenario" as const }))],
  })

  return {
    baseline,
    scenario,
    lowestBalanceDeltaCents: scenario.lowestBalanceCents - baseline.lowestBalanceCents,
    safeToSpendDeltaCents: scenario.safeToSpendCents - baseline.safeToSpendCents,
    riskChanged: riskSetChanged(baseline.risks, scenario.risks),
  }
}

export function riskSetChanged(baseline: Array<{ type: string; date: string }>, scenario: Array<{ type: string; date: string }>) {
  const left = new Set(baseline.map((risk) => `${risk.type}:${risk.date}`))
  const right = new Set(scenario.map((risk) => `${risk.type}:${risk.date}`))
  return left.size !== right.size || [...left].some((risk) => !right.has(risk))
}
