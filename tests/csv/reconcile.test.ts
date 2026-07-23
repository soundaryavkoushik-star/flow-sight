import { describe, expect, it } from "vitest"
import { reconcileRecurringSuggestions, type ExistingRecurringItem } from "../../lib/csv/reconcile"
import type { RecurringSuggestion } from "../../lib/csv/parse"

const suggestion = (overrides: Partial<RecurringSuggestion> = {}): RecurringSuggestion => ({
  id: "netflix",
  accountId: "checking",
  name: "NETFLIX.COM",
  amountCents: -1599,
  frequency: "monthly",
  nextExpected: "2026-08-05",
  type: "bill",
  minAmountCents: -1599,
  maxAmountCents: -1599,
  occurrenceCount: 6,
  evidenceStartDate: "2026-02-05",
  evidenceEndDate: "2026-07-05",
  ...overrides,
})

const existing = (overrides: Partial<ExistingRecurringItem> = {}): ExistingRecurringItem => ({
  id: "existing-netflix",
  name: "Netflix",
  amountCents: -1599,
  frequency: "monthly",
  type: "bill",
  nextExpected: "2026-08-05",
  accountId: "checking",
  isManual: true,
  ...overrides,
})

describe("reconcileRecurringSuggestions", () => {
  it("marks a strong one-to-one match as already included", () => {
    expect(reconcileRecurringSuggestions([suggestion()], [existing()])[0].status).toBe("already_included")
  })

  it("uses amount, cadence, timing, and direction for differently named possible matches", () => {
    const result = reconcileRecurringSuggestions(
      [suggestion({ id: "zelle", name: "ZELLE PAYMENT", amountCents: -165000, nextExpected: "2026-08-01" })],
      [existing({ id: "rent", name: "Rent", amountCents: -165000, nextExpected: "2026-08-02" })],
    )
    expect(result[0].status).toBe("needs_review")
    expect(result[0].existing[0].id).toBe("rent")
  })

  it("groups a broad manual estimate with several CSV patterns", () => {
    const result = reconcileRecurringSuggestions(
      [
        suggestion(),
        suggestion({ id: "hulu", name: "Hulu", amountCents: -1799 }),
        suggestion({ id: "spotify", name: "Spotify", amountCents: -1099 }),
      ],
      [existing({ id: "subscriptions", name: "Subscriptions", amountCents: -5000 })],
    )
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe("needs_review")
    expect(result[0].suggestions).toHaveLength(3)
  })
})
