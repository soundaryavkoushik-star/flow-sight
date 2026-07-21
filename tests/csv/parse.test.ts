import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { detectAmountColumns, findHeader, normalizeDate, normalizeMerchant, parseCsv, parseMoney, suggestRecurring } from "../../lib/csv/parse"

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
  })

  it("detects semicolon-delimited European exports", () => {
    const parsed = parseCsv(fixture("european-semicolon.csv"))
    expect(parsed.delimiter).toBe(";")
    expect(normalizeDate(parsed.rows[0][0], "dmy")).toBe("2026-06-01")
  })

  it("normalizes supported dates and money formats", () => {
    expect(normalizeDate("07/04/2026", "mdy")).toBe("2026-07-04")
    expect(normalizeDate("07/04/2026", "dmy")).toBe("2026-04-07")
    expect(normalizeDate("2026-02-30")).toBeNull()
    expect(parseMoney("($1,234.56)")).toBe(-123_456)
    expect(parseMoney("123.45-")).toBe(-12_345)
    expect(parseMoney("-1650,00")).toBe(-165_000)
  })
})

describe("recurring suggestions", () => {
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
  })

  it("does not suggest irregular or two-occurrence activity", () => {
    expect(suggestRecurring([
      { date: "2026-04-01", description: "Store", amountCents: -1000 },
      { date: "2026-05-19", description: "Store", amountCents: -1200 },
    ], "account", new Date("2026-06-01T00:00:00Z"))).toHaveLength(0)
  })
})
