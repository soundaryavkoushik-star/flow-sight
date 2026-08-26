import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
const upsert = vi.fn()
vi.mock("@/lib/data/prisma", () => ({
  prisma: {
    rateLimitBucket: {
      upsert,
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}))

describe("rate-limit presentation", () => {
  it("rounds the retry window up to a human-readable minute", async () => {
    const { rateLimitMessage } = await import("../lib/security/rate-limit")
    expect(rateLimitMessage({ allowed: false, retryAfterSeconds: 61 })).toContain("2 minutes")
    expect(rateLimitMessage({ allowed: false, retryAfterSeconds: 1 })).toContain("1 minute")
  })

  it("allows requests through the limit and blocks the next one", async () => {
    const { checkRateLimit } = await import("../lib/security/rate-limit")
    const policy = { action: "test", limit: 2, windowSeconds: 60 }
    const now = new Date("2026-08-20T12:00:30.000Z")

    upsert.mockResolvedValueOnce({ count: 2 }).mockResolvedValueOnce({ count: 3 })
    await expect(checkRateLimit("user-1", policy, now)).resolves.toEqual({ allowed: true, remaining: 0 })
    await expect(checkRateLimit("user-1", policy, now)).resolves.toEqual({ allowed: false, retryAfterSeconds: 30 })
  })
})
