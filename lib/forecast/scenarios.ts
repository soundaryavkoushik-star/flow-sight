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
    riskChanged: baseline.risks.length !== scenario.risks.length ||
      baseline.risks.some((risk, index) => scenario.risks[index]?.type !== risk.type),
  }
}
