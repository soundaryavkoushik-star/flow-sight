"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { SPENDING_CATEGORIES } from "@/lib/analytics/categories"

export interface CsvTransactionInput {
  date: string
  description: string
  amountCents: number
}

export interface CsvImportInput {
  filename: string
  rows: CsvTransactionInput[]
  currentBalanceCents: number
  balanceDate: string
  accountId?: string
  newAccountName?: string
  newAccountType?: "checking" | "savings"
}

export type CsvImportResult =
  | { ok: true; imported: number; duplicates: number; accountId: string }
  | { ok: false; message: string }

export interface RecurringConfirmationInput {
  accountId: string
  name: string
  amountCents: number
  frequency: "weekly" | "biweekly" | "monthly" | "annual"
  nextExpected: string
  type: "income" | "bill"
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

function duplicateKey(date: Date, description: string, amountCents: number) {
  return `${date.toISOString().slice(0, 10)}|${description.trim().toLowerCase().replace(/\s+/g, " ")}|${amountCents}`
}

export async function importCsvTransactions(input: CsvImportInput): Promise<CsvImportResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "Your session expired. Please sign in again." }
  if (!input.filename.toLowerCase().endsWith(".csv")) return { ok: false, message: "Choose a CSV file to continue." }
  if (input.rows.length === 0 || input.rows.length > 10_000) return { ok: false, message: "The file must contain between 1 and 10,000 valid transactions." }

  const balanceDate = parseDate(input.balanceDate)
  if (!balanceDate || !Number.isSafeInteger(input.currentBalanceCents)) return { ok: false, message: "Add a valid current balance and balance date." }
  const parsedRows = input.rows.map((row) => ({ ...row, parsedDate: parseDate(row.date) }))
  if (parsedRows.some((row) => !row.parsedDate || !row.description.trim() || !Number.isSafeInteger(row.amountCents) || row.amountCents === 0)) {
    return { ok: false, message: "One or more transactions has an invalid date, description, or amount." }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      let account = input.accountId
        ? await tx.account.findFirst({ where: { id: input.accountId, userId: user.id, isLiability: false } })
        : null
      if (input.accountId && !account) throw new Error("Selected account not found")
      if (!account) {
        if (!input.newAccountName?.trim() || !["checking", "savings"].includes(input.newAccountType ?? "")) throw new Error("New account details are missing")
        account = await tx.account.create({
          data: {
            userId: user.id,
            name: input.newAccountName.trim(),
            type: input.newAccountType!,
            source: "csv",
            anchorBalanceCents: input.currentBalanceCents,
            anchorDate: balanceDate,
          },
        })
      } else {
        account = await tx.account.update({
          where: { id: account.id },
          data: { anchorBalanceCents: input.currentBalanceCents, anchorDate: balanceDate, source: account.source === "manual" ? "csv" : account.source },
        })
      }

      await tx.actualBalanceObservation.upsert({ where: { accountId_observedAt: { accountId: account.id, observedAt: balanceDate } }, update: { balanceCents: input.currentBalanceCents }, create: { userId: user.id, accountId: account.id, balanceCents: input.currentBalanceCents, observedAt: balanceDate } })

      const dates = parsedRows.map((row) => row.parsedDate!)
      const existing = await tx.transaction.findMany({
        where: { userId: user.id, accountId: account.id, date: { gte: new Date(Math.min(...dates.map((date) => date.getTime()))), lte: new Date(Math.max(...dates.map((date) => date.getTime()))) } },
        select: { date: true, description: true, amountCents: true },
      })
      const existingKeys = new Set(existing.map((row) => duplicateKey(row.date, row.description, row.amountCents)))
      const seen = new Set<string>()
      const uniqueRows = parsedRows.filter((row) => {
        const key = duplicateKey(row.parsedDate!, row.description, row.amountCents)
        if (existingKeys.has(key) || seen.has(key)) return false
        seen.add(key)
        return true
      })

      if (uniqueRows.length > 0) {
        await tx.transaction.createMany({
          data: uniqueRows.map((row) => ({
            userId: user.id,
            accountId: account.id,
            date: row.parsedDate!,
            description: row.description.trim(),
            amountCents: row.amountCents,
            source: input.filename,
          })),
        })
      }

      await tx.userProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } })
      return { ok: true as const, imported: uniqueRows.length, duplicates: input.rows.length - uniqueRows.length, accountId: account.id }
    })
  } catch (error) {
    console.error("CSV import failed", error)
    return { ok: false, message: "We couldn’t import that file. Your existing transactions were not changed." }
  } finally {
    revalidatePath("/app/transactions")
    revalidatePath("/app/dashboard")
    revalidatePath("/app/forecast")
  }
}

export interface ManualTransactionInput {
  accountId?: string
  newAccountName?: string
  newAccountType?: "checking" | "savings"
  newAccountBalanceCents?: number
  newAccountBalanceDate?: string
  date: string
  description: string
  amountCents: number
}

export async function createManualTransaction(input: ManualTransactionInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const date = parseDate(input.date)
  if (!date || !input.description.trim() || !Number.isSafeInteger(input.amountCents) || input.amountCents === 0) return { ok: false as const, message: "Add a valid date, description, and amount." }

  try {
    await prisma.$transaction(async (tx) => {
      let account = input.accountId ? await tx.account.findFirst({ where: { id: input.accountId, userId: user.id, isLiability: false } }) : null
      if (input.accountId && !account) throw new Error("Selected account not found")
      if (!account) {
        const balanceDate = input.newAccountBalanceDate ? parseDate(input.newAccountBalanceDate) : null
        if (!input.newAccountName?.trim() || !["checking", "savings"].includes(input.newAccountType ?? "") || !Number.isSafeInteger(input.newAccountBalanceCents) || !balanceDate) throw new Error("New account details are missing")
        account = await tx.account.create({ data: { userId: user.id, name: input.newAccountName.trim(), type: input.newAccountType!, source: "manual", anchorBalanceCents: input.newAccountBalanceCents, anchorDate: balanceDate } })
        await tx.actualBalanceObservation.create({ data: { userId: user.id, accountId: account.id, balanceCents: input.newAccountBalanceCents!, observedAt: balanceDate } })
      }
      await tx.transaction.create({ data: { userId: user.id, accountId: account.id, date, description: input.description.trim(), amountCents: input.amountCents } })
      await tx.userProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } })
    })
    revalidatePath("/app/transactions")
    revalidatePath("/app/dashboard")
    revalidatePath("/app/forecast")
    return { ok: true as const }
  } catch (error) {
    console.error("Manual transaction creation failed", error)
    return { ok: false as const, message: "We couldn’t save that transaction. Please review the account details and try again." }
  }
}

export async function setTransactionCategory(transactionId: string, categoryName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const definition = SPENDING_CATEGORIES.find((category) => category.name === categoryName)
  if (!definition) return { ok: false as const, message: "Choose a valid category." }
  const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, userId: user.id }, select: { id: true } })
  if (!transaction) return { ok: false as const, message: "Transaction not found." }
  try {
    const category = await prisma.category.upsert({ where: { userId_name: { userId: user.id, name: definition.name } }, update: { color: definition.color }, create: { userId: user.id, name: definition.name, color: definition.color } })
    await prisma.transaction.update({ where: { id: transaction.id }, data: { categoryId: category.id } })
    revalidatePath("/app/transactions")
    revalidatePath("/app/dashboard")
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to update transaction category", error)
    return { ok: false as const, message: "We couldn’t update that category." }
  }
}

export async function setTransactionsCategory(transactionIds: string[], categoryName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const definition = SPENDING_CATEGORIES.find((category) => category.name === categoryName)
  const ids = [...new Set(transactionIds)].slice(0, 100)
  if (!definition || ids.length === 0) return { ok: false as const, message: "Choose transactions and a valid category." }
  try {
    const category = await prisma.category.upsert({ where: { userId_name: { userId: user.id, name: definition.name } }, update: { color: definition.color }, create: { userId: user.id, name: definition.name, color: definition.color } })
    await prisma.transaction.updateMany({ where: { id: { in: ids }, userId: user.id, amountCents: { lt: 0 } }, data: { categoryId: category.id } })
    revalidatePath("/app/transactions")
    revalidatePath("/app/dashboard")
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to update transaction categories", error)
    return { ok: false as const, message: "We couldn’t update those categories." }
  }
}

export async function confirmRecurringSuggestions(items: RecurringConfirmationInput[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  if (items.length > 100) return { ok: false as const, message: "Too many recurring items were selected." }

  for (const item of items) {
    const date = parseDate(item.nextExpected)
    if (!date || !item.name.trim() || !Number.isSafeInteger(item.amountCents) || item.amountCents === 0) return { ok: false as const, message: "Review the selected recurring items and try again." }
    const account = await prisma.account.findFirst({ where: { id: item.accountId, userId: user.id } })
    if (!account) return { ok: false as const, message: "We couldn’t find the account for those suggestions." }
    const normalizedKey = `csv:${item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    await prisma.recurringSeries.upsert({
      where: { userId_normalizedKey: { userId: user.id, normalizedKey } },
      update: { name: item.name.trim(), amountCents: item.amountCents, frequency: item.frequency, nextExpected: date, dateConfidence: "estimated", status: "confirmed", accountId: item.accountId },
      create: { userId: user.id, normalizedKey, name: item.name.trim(), type: item.type, amountCents: item.amountCents, frequency: item.frequency, nextExpected: date, dateConfidence: "estimated", status: "confirmed", accountId: item.accountId },
    })
  }

  revalidatePath("/app/dashboard")
  revalidatePath("/app/forecast")
  return { ok: true as const }
}
