import { describe, expect, it } from "vitest"
import { calculateForecast, runScenario, type ForecastInput } from "../../lib/forecast"

const baseInput: ForecastInput = {
  startingBalanceCents: 200_000,
  events: [
    {
      id: "rent",
      date: "2026-07-25",
      amountCents: -150_000,
      type: "expense",
      source: "manual",
      name: "Rent",
      confidence: "confirmed",
    },
    {
      id: "paycheck",
      date: "2026-07-30",
      amountCents: 250_000,
      type: "income",
      source: "manual",
      name: "Paycheck",
      confidence: "confirmed",
    },
  ],
  settings: {
    startDate: "2026-07-20",
    days: 30,
    safetyBufferCents: 30_000,
  },
}

describe("calculateForecast", () => {
  it("calculates the daily low point and safe-to-spend deterministically", () => {
    const forecast = calculateForecast(baseInput)

    expect(forecast.lowestBalanceCents).toBe(50_000)
    expect(forecast.lowestBalanceDate).toBe("2026-07-25")
    expect(forecast.safeToSpendCents).toBe(20_000)
    expect(forecast.risks).toHaveLength(0)
  })

  it("generates recurring events inside the forecast window", () => {
    const forecast = calculateForecast({
      ...baseInput,
      events: [],
      recurringRules: [{
        id: "salary",
        name: "Salary",
        amountCents: 100_000,
        frequency: "biweekly",
        nextDate: "2026-07-24",
      }],
    })

    const recurring = forecast.days.flatMap((day) => day.events)
    expect(recurring.map((event) => event.date)).toEqual(["2026-07-24", "2026-08-07"])
  })

  it("skips only the selected recurring occurrence", () => {
    const forecast = calculateForecast({
      ...baseInput,
      events: [],
      recurringRules: [{
        id: "salary",
        name: "Salary",
        amountCents: 100_000,
        frequency: "weekly",
        nextDate: "2026-07-24",
        exceptions: [{ date: "2026-07-31" }],
      }],
    })

    expect(forecast.days.flatMap((day) => day.events).map((event) => event.date))
      .toEqual(["2026-07-24", "2026-08-07", "2026-08-14"])
  })

  it("moves one recurring occurrence without shifting the series", () => {
    const forecast = calculateForecast({
      ...baseInput,
      events: [],
      recurringRules: [{
        id: "rent",
        name: "Rent",
        amountCents: -100_000,
        frequency: "weekly",
        nextDate: "2026-07-24",
        exceptions: [{ date: "2026-07-31", movedDate: "2026-08-02" }],
      }],
    })

    expect(forecast.days.flatMap((day) => day.events).map((event) => event.date))
      .toEqual(["2026-07-24", "2026-08-02", "2026-08-07", "2026-08-14"])
  })

  it("never returns negative safe-to-spend", () => {
    const forecast = calculateForecast({
      ...baseInput,
      startingBalanceCents: 200_000,
      settings: { ...baseInput.settings, safetyBufferCents: 180_000 },
    })

    expect(forecast.safeToSpendCents).toBe(0)
    expect(forecast.risks.some((risk) => risk.type === "safety_buffer_breach")).toBe(true)
  })
})

describe("runScenario", () => {
  it("reuses the same forecast engine without mutating the baseline", () => {
    const comparison = runScenario(baseInput, [{
      id: "laptop",
      date: "2026-07-22",
      amountCents: -40_000,
      type: "expense",
      source: "scenario",
      name: "Laptop",
      confidence: "confirmed",
    }])

    expect(comparison.baseline.lowestBalanceCents).toBe(50_000)
    expect(comparison.scenario.lowestBalanceCents).toBe(10_000)
    expect(comparison.lowestBalanceDeltaCents).toBe(-40_000)
    expect(comparison.baseline.days.flatMap((day) => day.events).some((event) => event.id === "laptop")).toBe(false)
  })
})
