import { calculateForecast, type ForecastInput, type ForecastResult } from "@/lib/forecast"

// Application boundary: server/data code prepares clean domain inputs here.
// The forecast engine remains pure and never imports Prisma, Supabase, React, or Plaid.
export function getForecast(input: ForecastInput): ForecastResult {
  return calculateForecast(input)
}
