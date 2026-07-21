import { describe, expect, it } from "vitest"
import { buildSpendingHistory } from "../../lib/analytics/spending"

describe("buildSpendingHistory", () => {
  it("groups expenses into eight rolling weeks and ignores income", () => {
    const history = buildSpendingHistory([
      { date: new Date("2026-06-01T00:00:00Z"), amountCents: -2_000 },
      { date: new Date("2026-06-01T00:00:00Z"), amountCents: 10_000 },
      { date: new Date("2026-07-20T00:00:00Z"), amountCents: -5_000 },
    ], new Date("2026-07-20T00:00:00Z"))

    expect(history.weeks).toHaveLength(8)
    expect(history.transactionCount).toBe(2)
    expect(history.previousFourWeeksCents).toBe(2_000)
    expect(history.recentFourWeeksCents).toBe(5_000)
    expect(history.changePercent).toBe(150)
  })

  it("does not invent a comparison when the previous period has no spending", () => {
    const history = buildSpendingHistory([
      { date: new Date("2026-07-20T00:00:00Z"), amountCents: -5_000 },
    ], new Date("2026-07-20T00:00:00Z"))

    expect(history.changePercent).toBeNull()
  })
})
