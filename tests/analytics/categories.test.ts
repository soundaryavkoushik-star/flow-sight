import { describe, expect, it } from "vitest"
import { buildMonthlySpending, exactDescriptionRuleKey, suggestMoneyInCategory, suggestSpendingCategory } from "../../lib/analytics/categories"

describe("spending categories", () => {
  it("suggests a category from recognizable merchant text", () => {
    expect(suggestSpendingCategory("NETFLIX.COM")).toBe("Subscriptions")
    expect(suggestSpendingCategory("Rent Payment - Meridian Apartments")).toBe("Housing")
    expect(suggestSpendingCategory("Unknown Merchant 123")).toBe("Other")
  })

  it("distinguishes earned income from gifts and refunds", () => {
    expect(suggestMoneyInCategory("Payroll Direct Deposit - Meridian Corp")).toBe("Regular paycheck")
    expect(suggestMoneyInCategory("ACH CREDIT NORTHSTAR STUDIO PAYROL DIR DEP")).toBe("Regular paycheck")
    expect(suggestMoneyInCategory("Venmo - Birthday Gift")).toBe("Gift")
    expect(suggestMoneyInCategory("IRS Tax Refund")).toBe("Refund / Reimbursement")
    expect(suggestMoneyInCategory("Invoice 1042 - Corner Bakery")).toBe("Variable / side income")
    expect(suggestMoneyInCategory("Deposit from ACME 4839")).toBe("Income — needs review")
  })

  it("scopes remembered corrections to exact normalized descriptions and direction", () => {
    expect(exactDescriptionRuleKey("  Venmo - Birthday   Gift ", 7_500)).toBe("description:money_in:venmo - birthday gift")
    expect(exactDescriptionRuleKey("Venmo - Birthday Gift", -7_500)).toBe("description:money_out:venmo - birthday gift")
    expect(exactDescriptionRuleKey("Venmo - Client Payment", 7_500)).not.toBe(exactDescriptionRuleKey("Venmo - Birthday Gift", 7_500))
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
