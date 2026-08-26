import { beforeEach, describe, expect, it, vi } from "vitest"

const deleteManyCalls: Array<{ model: string; where: unknown }> = []

function deleteManyFor(model: string) {
  return vi.fn(async ({ where }: { where: unknown }) => {
    deleteManyCalls.push({ model, where })
    return { count: 0 }
  })
}

const prismaMock = {
  rateLimitBucket: { upsert: vi.fn(async () => ({ count: 1 })), deleteMany: vi.fn(async () => ({ count: 0 })) },
  forecastSnapshot: { deleteMany: deleteManyFor("forecastSnapshot") },
  actualBalanceObservation: { deleteMany: deleteManyFor("actualBalanceObservation") },
  recurringException: { deleteMany: deleteManyFor("recurringException") },
  recurringSeries: { deleteMany: deleteManyFor("recurringSeries") },
  recurringSuggestionDecision: { deleteMany: deleteManyFor("recurringSuggestionDecision") },
  transaction: { deleteMany: deleteManyFor("transaction") },
  categoryRule: { deleteMany: deleteManyFor("categoryRule") },
  category: { deleteMany: deleteManyFor("category") },
  account: { deleteMany: deleteManyFor("account") },
  userProfile: { deleteMany: deleteManyFor("userProfile") },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}

vi.mock("@/lib/data/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } } as const)) },
  })),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("deleteFinancialData", () => {
  beforeEach(() => {
    deleteManyCalls.length = 0
    vi.clearAllMocks()
  })

  it("deletes RecurringSuggestionDecision rows along with every other user table", async () => {
    const { deleteFinancialData } = await import("../app/app/settings/actions")
    const result = await deleteFinancialData()
    expect(result.ok).toBe(true)

    const deletedModels = deleteManyCalls.map((call) => call.model)
    expect(deletedModels).toContain("recurringSuggestionDecision")
    expect(prismaMock.recurringSuggestionDecision.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } })

    // TransactionTransfer and CreditCardSettings aren't deleted explicitly — they cascade
    // from Account/Transaction deletion per the schema's onDelete: Cascade relations.
    for (const model of ["forecastSnapshot", "actualBalanceObservation", "recurringException", "recurringSeries", "transaction", "categoryRule", "category", "account", "userProfile"]) {
      expect(deletedModels).toContain(model)
    }
  })
})
