import type { ForecastResult } from "./types"

export type ForecastCondition = "clear" | "watch" | "tight" | "update_needed"

export function determineForecastCondition(result: ForecastResult, safetyBufferCents: number, freshness: "fresh" | "aging" | "stale"): ForecastCondition {
  if (freshness === "stale") return "update_needed"
  if (result.risks.length > 0) return "tight"
  const watchMarginCents = Math.max(20_000, Math.round(safetyBufferCents * 0.25))
  if (result.lowestBalanceCents <= safetyBufferCents + watchMarginCents) return "watch"
  return "clear"
}
