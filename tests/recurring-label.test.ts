import { describe, expect, it } from "vitest"
import { recurringDisplayName, recurringFrequencyLabel } from "../lib/financial/recurring-label"

describe("recurring item language", () => {
  it("removes contradictory legacy salary wording", () => {
    expect(recurringDisplayName("Monthly salary", "income")).toBe("Salary paycheck")
    expect(recurringDisplayName("Monthly salary", "bill")).toBe("Monthly salary")
  })

  it("describes biweekly cadence in plain language", () => {
    expect(recurringFrequencyLabel("biweekly")).toBe("Every two weeks")
  })
})
