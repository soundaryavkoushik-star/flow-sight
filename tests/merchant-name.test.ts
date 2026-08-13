import { describe, expect, it } from "vitest"
import { merchantDisplayName } from "@/lib/financial/merchant-name"

describe("merchantDisplayName", () => {
  it.each([
    ["RECURRING PAYMENT SPOTIFY USA", "Spotify"],
    ["ACH DEBIT HARBOR VIEW APTS RENT 8834910", "Harbor View Apartments"],
    ["INTERNET PURCHASE AMAZON.COM AMZN.COM/BILL", "Amazon"],
    ["RECURRING DEBIT NETFLIX.COM 866-579-7172 CA", "Netflix"],
    ["ACH DEBIT CITY POWER LIGHT UTIL PYMT", "City Power & Light"],
    ["ACH CREDIT NORTHSTAR STUDIO PAYROL DIR DEP", "Northstar Studio Payroll"],
  ])("turns %s into %s", (raw, expected) => {
    expect(merchantDisplayName(raw)).toBe(expected)
  })

  it("keeps an unfamiliar merchant readable without changing stored evidence", () => {
    expect(merchantDisplayName("POS DEBIT NORTHSTAR COFFEE 49281 MA")).toBe("Northstar Coffee")
  })
})
