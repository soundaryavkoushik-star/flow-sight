import { beforeEach, describe, expect, it, vi } from "vitest"

interface FakeAccount {
  id: string
  userId: string
  name: string
  type: string
  source: string
  anchorBalanceCents: number | null
  anchorDate: Date | null
}

interface FakeTransaction {
  id: string
  userId: string
  accountId: string
  date: Date
  description: string
  amountCents: number
}

let accounts: FakeAccount[]
let transactions: FakeTransaction[]
let nextId = 0

function makeId() {
  nextId += 1
  return `id-${nextId}`
}

const fakeTx = {
  account: {
    findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string } }) =>
      accounts.find((account) => account.id === where.id && account.userId === where.userId) ?? null),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakeAccount> }) => {
      const account = accounts.find((a) => a.id === where.id)!
      Object.assign(account, data)
      return account
    }),
    create: vi.fn(async ({ data }: { data: Omit<FakeAccount, "id"> }) => {
      const account: FakeAccount = { id: makeId(), ...data }
      accounts.push(account)
      return account
    }),
  },
  actualBalanceObservation: {
    upsert: vi.fn(async () => ({})),
  },
  transaction: {
    findMany: vi.fn(async ({ where }: { where: { userId: string; accountId: string; date: { gte: Date; lte: Date } } }) =>
      transactions
        .filter((t) => t.userId === where.userId && t.accountId === where.accountId && t.date >= where.date.gte && t.date <= where.date.lte)
        .map((t) => ({ date: t.date, description: t.description, amountCents: t.amountCents }))),
    createMany: vi.fn(async ({ data }: { data: Array<Omit<FakeTransaction, "id">> }) => {
      transactions.push(...data.map((row) => ({ id: makeId(), ...row })))
      return { count: data.length }
    }),
  },
  categoryRule: {
    findMany: vi.fn(async () => []),
  },
  category: {
    upsert: vi.fn(async ({ create }: { create: { name: string } }) => ({ id: `cat-${create.name}` })),
  },
  userProfile: {
    upsert: vi.fn(async () => ({})),
  },
}

vi.mock("@/lib/data/prisma", () => ({
  prisma: {
    rateLimitBucket: {
      upsert: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    $transaction: async (callback: (tx: typeof fakeTx) => Promise<unknown>) => callback(fakeTx),
  },
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } } as const)) },
  })),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("importCsvTransactions anchor regression guard", () => {
  beforeEach(() => {
    accounts = []
    transactions = []
    nextId = 0
    vi.clearAllMocks()
  })

  it("sets the anchor correctly on the first import", async () => {
    const { importCsvTransactions } = await import("../app/app/transactions/actions")
    const result = await importCsvTransactions({
      filename: "first.csv",
      rows: [{ date: "2026-08-01", description: "Coffee", amountCents: -500 }],
      currentBalanceCents: 100_000,
      balanceDate: "2026-08-01",
      newAccountName: "Everyday checking",
      newAccountType: "checking",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("expected ok result")
    expect(result.anchorSkipped).toBe(false)
    const account = accounts.find((a) => a.id === result.accountId)!
    expect(account.anchorBalanceCents).toBe(100_000)
    expect(account.anchorDate?.toISOString().slice(0, 10)).toBe("2026-08-01")
  })

  it("does not regress the anchor when a later import has an older balance date, but still imports the rows", async () => {
    const { importCsvTransactions } = await import("../app/app/transactions/actions")
    const first = await importCsvTransactions({
      filename: "first.csv",
      rows: [{ date: "2026-08-01", description: "Coffee", amountCents: -500 }],
      currentBalanceCents: 100_000,
      balanceDate: "2026-08-01",
      newAccountName: "Everyday checking",
      newAccountType: "checking",
    })
    if (!first.ok) throw new Error("expected first import to succeed")

    const second = await importCsvTransactions({
      filename: "backfill.csv",
      rows: [{ date: "2026-07-01", description: "Old grocery run", amountCents: -4_200 }],
      currentBalanceCents: 50_000,
      balanceDate: "2026-07-15",
      accountId: first.accountId,
    })
    expect(second.ok).toBe(true)
    if (!second.ok) throw new Error("expected second import to succeed")
    expect(second.anchorSkipped).toBe(true)
    expect(second.imported).toBe(1)

    const account = accounts.find((a) => a.id === first.accountId)!
    expect(account.anchorBalanceCents).toBe(100_000)
    expect(account.anchorDate?.toISOString().slice(0, 10)).toBe("2026-08-01")
    expect(transactions.some((t) => t.description === "Old grocery run")).toBe(true)
  })

  it("updates the anchor normally when the new balance date is on or after the existing anchor", async () => {
    const { importCsvTransactions } = await import("../app/app/transactions/actions")
    const first = await importCsvTransactions({
      filename: "first.csv",
      rows: [{ date: "2026-08-01", description: "Coffee", amountCents: -500 }],
      currentBalanceCents: 100_000,
      balanceDate: "2026-08-01",
      newAccountName: "Everyday checking",
      newAccountType: "checking",
    })
    if (!first.ok) throw new Error("expected first import to succeed")

    const second = await importCsvTransactions({
      filename: "later.csv",
      rows: [{ date: "2026-08-10", description: "Rent", amountCents: -150_000 }],
      currentBalanceCents: 80_000,
      balanceDate: "2026-08-10",
      accountId: first.accountId,
    })
    expect(second.ok).toBe(true)
    if (!second.ok) throw new Error("expected second import to succeed")
    expect(second.anchorSkipped).toBe(false)

    const account = accounts.find((a) => a.id === first.accountId)!
    expect(account.anchorBalanceCents).toBe(80_000)
    expect(account.anchorDate?.toISOString().slice(0, 10)).toBe("2026-08-10")
  })
})
