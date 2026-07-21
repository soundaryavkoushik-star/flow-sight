import { describe, expect, it } from "vitest"
import { buildMonthlySpending, suggestSpendingCategory } from "../../lib/analytics/categories"

describe("spending categories", () => {
  it("suggests a category from recognizable merchant text", () => {
    expect(suggestSpendingCategory("NETFLIX.COM")).toBe("Subscriptions")
    expect(suggestSpendingCategory("Rent Payment - Meridian Apartments")).toBe("Housing")
    expect(suggestSpendingCategory("Unknown Merchant 123")).toBe("Other")
  })

  it("uses saved corrections and totals expenses only", () => {
    const result = buildMonthlySpending([
      { description: "Chipotle", amountCents: -2_500 },
      { description: "Chipotle", amountCents: -1_500, categoryName: "Groceries" },
      { description: "Payroll", amountCents: 200_000 },
    ])

    expect(result.totalCents).toBe(4_000)
    expect(result.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Dining", amountCents: 2_500 }),
      expect.objectContaining({ name: "Groceries", amountCents: 1_500 }),
    ]))
  })
})
