import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { applyAmountSignConvention, applyTransactionDirection, detectAmountColumns, detectDirectionColumn, findHeader, normalizeDate, normalizeMerchant, parseCsv, parseMoney, recurringEvidenceConfidence, suggestRecurring } from "../../lib/csv/parse"

const fixture = (name: string) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8")

describe("CSV parsing", () => {
  it("detects comma-delimited signed-amount exports and quoted values", () => {
    const parsed = parseCsv(fixture("chase-signed.csv"))
    expect(parsed.delimiter).toBe(",")
    expect(parsed.headers).toContain("Transaction Date")
    expect(parsed.rows).toHaveLength(7)
    expect(findHeader(parsed.headers, ["description"])).toBe("2")
  })

  it("detects split debit and credit columns", () => {
    const parsed = parseCsv(fixture("bank-split.csv"))
    expect(findHeader(parsed.headers, ["debit"])).toBe("2")
    expect(findHeader(parsed.headers, ["credit"])).toBe("3")
    expect(parseMoney(parsed.rows[1][2])).toBe(18_000)
  })

  it("prefers a signed amount column and only selects split mode when appropriate", () => {
    expect(detectAmountColumns(["Date", "Description", "Amount"])).toEqual({ mode: "signed", signed: "2", debit: "", credit: "" })
    expect(detectAmountColumns(["Date", "Description", "Debit", "Credit"])).toEqual({ mode: "split", signed: "", debit: "2", credit: "3" })
    expect(detectDirectionColumn(["Date", "Description", "Transaction Type", "Amount"])).toBe("2")
  })

  it("detects semicolon-delimited European exports", () => {
    const parsed = parseCsv(fixture("european-semicolon.csv"))
    expect(parsed.delimiter).toBe(";")
    expect(normalizeDate(parsed.rows[0][0], "dmy")).toBe("2026-06-01")
  })

  it("supports multiline quoted descriptions and escaped quotes", () => {
    const parsed = parseCsv('Date,Description,Amount\r\n07/01/2026,"Coffee shop\r\nDowntown",-12.50\r\n07/02/2026,"Refund from ""Market""",25.00')
    expect(parsed.rows).toEqual([
      ["07/01/2026", "Coffee shop\nDowntown", "-12.50"],
      ["07/02/2026", 'Refund from "Market"', "25.00"],
    ])
  })

  it("still reports a genuinely unclosed quoted value", () => {
    expect(() => parseCsv('Date,Description,Amount\n07/01/2026,"Coffee shop,-12.50')).toThrow("A quoted value in this CSV is not closed.")
  })

  it("normalizes supported dates and money formats", () => {
    expect(normalizeDate("07/04/2026", "mdy")).toBe("2026-07-04")
    expect(normalizeDate("07/04/2026", "dmy")).toBe("2026-04-07")
    expect(normalizeDate("2026-02-30")).toBeNull()
    expect(parseMoney("($1,234.56)")).toBe(-123_456)
    expect(parseMoney("123.45-")).toBe(-12_345)
    expect(parseMoney("-1650,00")).toBe(-165_000)
    expect(applyAmountSignConvention(1_996, "positive")).toBe(-1_996)
    expect(applyAmountSignConvention(-1_996, "negative")).toBe(-1_996)
    expect(applyTransactionDirection(1_996, "Purchase")).toBe(-1_996)
    expect(applyTransactionDirection(1_996, "Deposit")).toBe(1_996)
    expect(applyTransactionDirection(1_996, "Unknown")).toBeNull()
  })
})

describe("recurring suggestions", () => {
  it("confirms stable evidence and keeps materially variable amounts estimated", () => {
    expect(recurringEvidenceConfidence(-175_000, -175_000)).toBe("confirmed")
    expect(recurringEvidenceConfidence(195_000, 195_000)).toBe("confirmed")
    expect(recurringEvidenceConfidence(-1_799, -1_790)).toBe("confirmed")
    expect(recurringEvidenceConfidence(-14_830, -8_200)).toBe("estimated")
  })

  it("does not promote refunds, gifts, or transfers into recurring income", () => {
    const suggestions = suggestRecurring([
      { date: "2026-01-15", description: "IRS Tax Refund", amountCents: 90_000 },
      { date: "2026-02-15", description: "IRS Tax Refund", amountCents: 90_000 },
      { date: "2026-03-15", description: "IRS Tax Refund", amountCents: 90_000 },
    ], "account", "2026-03-20")
    expect(suggestions).toEqual([])
  })

  it("normalizes statement identifiers and requires three stable occurrences", () => {
    expect(normalizeMerchant("ACH DEBIT CITY APARTMENTS RENT 483920")).toBe("city apartments rent")
    const suggestions = suggestRecurring([
      { date: "2026-04-03", description: "CITY APARTMENTS RENT", amountCents: -165_000 },
      { date: "2026-05-01", description: "CITY APARTMENTS RENT", amountCents: -165_000 },
      { date: "2026-06-01", description: "CITY APARTMENTS RENT", amountCents: -167_500 },
    ], "account", new Date("2026-06-15T00:00:00Z"))
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].frequency).toBe("monthly")
    expect(suggestions[0].nextExpected).toBe("2026-07-01")
    expect(suggestions[0].type).toBe("bill")
    expect(suggestions[0]).toMatchObject({ minAmountCents: -167_500, maxAmountCents: -165_000, occurrenceCount: 3, evidenceStartDate: "2026-04-03", evidenceEndDate: "2026-06-01" })
  })

  it("keeps the calendar day when projecting monthly suggestions", () => {
    const suggestions = suggestRecurring([
      { date: "2026-01-31", description: "Month End Bill", amountCents: -10_000 },
      { date: "2026-02-28", description: "Month End Bill", amountCents: -11_000 },
      { date: "2026-03-31", description: "Month End Bill", amountCents: -9_000 },
    ], "account", "2026-04-01")
    expect(suggestions[0].nextExpected).toBe("2026-04-30")
    expect(suggestions[0].anchorDayOfMonth).toBe(31)
  })

  it("does not suggest irregular or two-occurrence activity", () => {
    expect(suggestRecurring([
      { date: "2026-04-01", description: "Store", amountCents: -1000 },
      { date: "2026-05-19", description: "Store", amountCents: -1200 },
    ], "account", new Date("2026-06-01T00:00:00Z"))).toHaveLength(0)
  })
})
