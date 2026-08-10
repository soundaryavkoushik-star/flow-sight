import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { localDateKey } from "../lib/forecast/local-date"

describe("localDateKey", () => {
  const originalTz = process.env.TZ

  beforeEach(() => {
    process.env.TZ = "America/Los_Angeles"
  })

  afterEach(() => {
    process.env.TZ = originalTz
  })

  it("returns the local calendar date, not the UTC date, when they differ", () => {
    // 2026-08-09T23:30:00-07:00 (Los Angeles) is 2026-08-10T06:30:00Z in UTC.
    const date = new Date("2026-08-10T06:30:00.000Z")
    expect(date.toISOString().slice(0, 10)).toBe("2026-08-10")
    expect(localDateKey(date)).toBe("2026-08-09")
  })

  it("uses the passed-in date's local fields directly", () => {
    const date = new Date("2026-01-05T12:00:00.000Z")
    expect(localDateKey(date)).toBe(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`)
  })
})
