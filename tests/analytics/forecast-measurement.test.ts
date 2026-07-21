import { describe, expect, it } from "vitest"
import { measureForecasts } from "../../lib/analytics/forecast-measurement"

describe("forecast measurement", () => {
  it("evaluates only dates with observations for every active account", () => {
    const snapshots = [{ createdAt: new Date("2026-07-01T12:00:00Z"), forecastStartDate: new Date("2026-07-01T00:00:00Z"), forecastEndDate: new Date("2026-07-30T00:00:00Z"), projectedDays: [{ date: "2026-07-10", endingBalanceCents: 100_000 }] }]
    const partial = measureForecasts(snapshots, [{ accountId: "a", balanceCents: 60_000, observedAt: new Date("2026-07-10T00:00:00Z"), createdAt: new Date("2026-07-11T00:00:00Z") }], ["a", "b"])
    expect(partial.eligibleDays).toBe(0)
    const complete = measureForecasts(snapshots, [
      { accountId: "a", balanceCents: 60_000, observedAt: new Date("2026-07-10T00:00:00Z"), createdAt: new Date("2026-07-11T00:00:00Z") },
      { accountId: "b", balanceCents: 45_000, observedAt: new Date("2026-07-10T00:00:00Z"), createdAt: new Date("2026-07-11T00:00:00Z") },
    ], ["a", "b"])
    expect(complete.eligibleDays).toBe(1)
    expect(complete.meanAbsoluteErrorCents).toBe(5_000)
  })
})
