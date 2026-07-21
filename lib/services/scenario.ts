import { runScenario, type FinancialEvent, type ForecastInput, type ScenarioComparison } from "@/lib/forecast"

export function compareScenario(
  input: ForecastInput,
  hypotheticalEvents: FinancialEvent[],
): ScenarioComparison {
  return runScenario(input, hypotheticalEvents)
}
