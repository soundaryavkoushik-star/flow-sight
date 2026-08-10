import { beforeEach, describe, expect, it, vi } from "vitest"

const tables = [
  ["account", "accounts"],
  ["transaction", "transactions"],
  ["category", "categories"],
  ["categoryRule", "categoryRules"],
  ["recurringSeries", "recurringSeries"],
  ["recurringException", "recurringExceptions"],
  ["forecastSnapshot", "forecastSnapshots"],
  ["actualBalanceObservation", "actualBalanceObservations"],
  ["recurringSuggestionDecision", "recurringSuggestionDecisions"],
  ["transactionTransfer", "transactionTransfers"],
  ["creditCardSettings", "creditCardSettings"],
] as const

function findManyFor(table: string) {
  return vi.fn(async () => [{ id: `${table}-row` }])
}

const prismaMock = {
  userProfile: { findUnique: vi.fn(async () => ({ userId: "user-1" })) },
  account: { findMany: findManyFor("account") },
  transaction: { findMany: findManyFor("transaction") },
  category: { findMany: findManyFor("category") },
  categoryRule: { findMany: findManyFor("categoryRule") },
  recurringSeries: { findMany: findManyFor("recurringSeries") },
  recurringException: { findMany: findManyFor("recurringException") },
  forecastSnapshot: { findMany: findManyFor("forecastSnapshot") },
  actualBalanceObservation: { findMany: findManyFor("actualBalanceObservation") },
  recurringSuggestionDecision: { findMany: findManyFor("recurringSuggestionDecision") },
  transactionTransfer: { findMany: findManyFor("transactionTransfer") },
  creditCardSettings: { findMany: findManyFor("creditCardSettings") },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}

vi.mock("@/lib/data/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } } as const)) },
  })),
}))

describe("GET /api/data-export", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("includes every user-owned table in the export payload, including the ones added for the credit-card and transfer fixes", async () => {
    const { GET } = await import("../app/api/data-export/route")
    const response = await GET()
    const body = await response.json()

    expect(body.profile).toEqual({ userId: "user-1" })
    for (const [table, key] of tables) {
      expect(body, `expected export payload to include "${key}"`).toHaveProperty(key, [{ id: `${table}-row` }])
    }
  })
})
