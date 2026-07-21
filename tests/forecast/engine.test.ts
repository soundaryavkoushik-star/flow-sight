import { describe, expect, it } from "vitest"
import { calculateForecast, generateRecurringEvents, runScenario, type ForecastInput } from "../../lib/forecast"
import { riskSetChanged } from "../../lib/forecast/scenarios"
import { suppressMatchedRecurringEvents } from "../../lib/forecast/reconcile"
import { determineForecastCondition } from "../../lib/forecast/condition"
import { rollForwardAnchors } from "../../lib/forecast/anchors"
import { financialDateKey } from "../../lib/forecast/timezone"

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

describe("forecast integrity", () => {
  it("keeps the original monthly anchor after a short month", () => {
    const events = generateRecurringEvents([{ id: "rent", name: "Rent", amountCents: -100, frequency: "monthly", nextDate: "2027-01-31", anchorDayOfMonth: 31 }], "2027-01-01", "2027-05-31")
    expect(events.map((event) => event.date)).toEqual(["2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30", "2027-05-31"])
  })

  it("suppresses a recurring prediction when a matching posted transaction exists", () => {
    const posted = [{ id: "posted", date: "2026-08-01", amountCents: -165_000, type: "expense" as const, source: "csv" as const, name: "ACH Rent Payment", accountId: "checking", confidence: "confirmed" as const }]
    const recurring = [{ id: "predicted", date: "2026-08-02", amountCents: -165_000, type: "expense" as const, source: "recurring" as const, name: "Rent", accountId: "checking", confidence: "estimated" as const }]
    expect(suppressMatchedRecurringEvents(posted, recurring)).toHaveLength(0)
  })

  it("rolls account anchors forward through activity before today only", () => {
    const result = rollForwardAnchors([{ id: "a", name: "Checking", anchorBalanceCents: 100_000, anchorDate: new Date("2026-07-01T00:00:00Z") }], [
      { accountId: "a", amountCents: -10_000, date: new Date("2026-07-02T00:00:00Z") },
      { accountId: "a", amountCents: -5_000, date: new Date("2026-07-20T00:00:00Z") },
    ], new Date("2026-07-20T00:00:00Z"))
    expect(result.totalCents).toBe(90_000)
    expect(result.items[0].activityCents).toBe(-10_000)
  })

  it("compares risk identity by type and date", () => {
    expect(riskSetChanged([{ type: "safety_buffer_breach", date: "2026-07-20" }], [{ type: "safety_buffer_breach", date: "2026-07-21" }])).toBe(true)
  })

  it("uses stale freshness before balance risk for the user-facing condition", () => {
    const forecast = calculateForecast(baseInput)
    expect(determineForecastCondition(forecast, 30_000, "stale")).toBe("update_needed")
    expect(determineForecastCondition(forecast, 30_000, "aging")).toBe("watch")
  })

  it("computes financial today in the user's IANA timezone", () => {
    const instant = new Date("2026-07-21T02:00:00Z")
    expect(financialDateKey(instant, "America/Los_Angeles")).toBe("2026-07-20")
    expect(financialDateKey(instant, "Asia/Kolkata")).toBe("2026-07-21")
  })

  it("explains the low point using expenses since the last income", () => {
    const forecast = calculateForecast({
      startingBalanceCents: 300_000,
      settings: { startDate: "2026-07-20", days: 7, safetyBufferCents: 0 },
      events: [
        { id: "pay", date: "2026-07-20", amountCents: 100_000, type: "income", source: "manual", name: "Paycheck", confidence: "confirmed" },
        { id: "rent", date: "2026-07-21", amountCents: -165_000, type: "expense", source: "manual", name: "Rent", confidence: "confirmed" },
        { id: "insurance", date: "2026-07-23", amountCents: -20_000, type: "expense", source: "manual", name: "Insurance", confidence: "confirmed" },
      ],
    })
    expect(forecast.explanations[0].eventIds).toEqual(["rent", "insurance"])
    expect(forecast.explanations[0].headline).toContain("2026-07-23")
  })
})
