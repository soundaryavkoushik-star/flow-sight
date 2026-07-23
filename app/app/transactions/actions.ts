"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { categoriesForDirection, SPENDING_CATEGORIES, suggestTransactionCategory, TRANSACTION_CATEGORIES } from "@/lib/analytics/categories"
import { randomUUID } from "node:crypto"
import { recurringEvidenceConfidence } from "@/lib/csv/parse"

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
  id?: string
  accountId: string
  name: string
  amountCents: number
  frequency: "weekly" | "biweekly" | "monthly" | "annual"
  nextExpected: string
  type: "income" | "bill"
  anchorDayOfMonth?: number
  minAmountCents: number
  maxAmountCents: number
  occurrenceCount: number
  evidenceStartDate: string
  evidenceEndDate: string
}

export interface RecurringReplacementInput {
  existingIds: string[]
  suggestionIds: string[]
  filename: string
}

export interface RecurringSeriesInput {
  id?: string
  name: string
  type: "bill" | "income"
  amountCents: number
  frequency: "weekly" | "biweekly" | "monthly" | "annual"
  nextExpected: string
  accountId?: string | null
  confidence: "confirmed" | "estimated"
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
        const suggestedNames = [...new Set(uniqueRows.map((row) => suggestTransactionCategory(row.description, row.amountCents)))]
        const categoryIds = new Map<string, string>()
        for (const name of suggestedNames) {
          const definition = TRANSACTION_CATEGORIES.find((category) => category.name === name)!
          const category = await tx.category.upsert({
            where: { userId_name: { userId: user.id, name } },
            update: { color: definition.color },
            create: { userId: user.id, name, color: definition.color },
          })
          categoryIds.set(name, category.id)
        }
        await tx.transaction.createMany({
          data: uniqueRows.map((row) => ({
            userId: user.id,
            accountId: account.id,
            date: row.parsedDate!,
            description: row.description.trim(),
            amountCents: row.amountCents,
            categoryId: categoryIds.get(suggestTransactionCategory(row.description, row.amountCents)),
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
  categoryName?: string
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
      const suggestedName = input.categoryName ?? suggestTransactionCategory(input.description, input.amountCents)
      const allowed = categoriesForDirection(input.amountCents < 0 ? "money_out" : "money_in")
      const definition = allowed.find((category) => category.name === suggestedName)
      if (!definition) throw new Error("Invalid category for transaction direction")
      const category = await tx.category.upsert({ where: { userId_name: { userId: user.id, name: definition.name } }, update: { color: definition.color }, create: { userId: user.id, name: definition.name, color: definition.color } })
      await tx.transaction.create({ data: { userId: user.id, accountId: account.id, date, description: input.description.trim(), amountCents: input.amountCents, categoryId: category.id } })
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
  const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, userId: user.id }, select: { id: true, amountCents: true } })
  if (!transaction) return { ok: false as const, message: "Transaction not found." }
  const definition = categoriesForDirection(transaction.amountCents < 0 ? "money_out" : "money_in").find((category) => category.name === categoryName)
  if (!definition) return { ok: false as const, message: "Choose a category that matches the transaction direction." }
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

export async function saveRecurringSeries(input: RecurringSeriesInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const nextExpected = parseDate(input.nextExpected)
  const signedAmount = Math.abs(input.amountCents) * (input.type === "bill" ? -1 : 1)
  if (!input.name.trim() || !nextExpected || !Number.isSafeInteger(input.amountCents) || input.amountCents === 0 || !["weekly", "biweekly", "monthly", "annual"].includes(input.frequency)) {
    return { ok: false as const, message: "Add a name, amount, frequency, and next date." }
  }
  if (input.accountId) {
    const account = await prisma.account.findFirst({ where: { id: input.accountId, userId: user.id, isLiability: false }, select: { id: true } })
    if (!account) return { ok: false as const, message: "Choose a valid account." }
  }
  try {
    if (input.id) {
      const result = await prisma.recurringSeries.updateMany({
        where: { id: input.id, userId: user.id },
        data: { name: input.name.trim(), type: input.type, amountCents: signedAmount, frequency: input.frequency, nextExpected, accountId: input.accountId || null, dateConfidence: input.confidence, status: "confirmed" },
      })
      if (result.count === 0) return { ok: false as const, message: "We couldn’t find that recurring item." }
    } else {
      await prisma.recurringSeries.create({
        data: { userId: user.id, normalizedKey: `manual:${randomUUID()}`, name: input.name.trim(), type: input.type, amountCents: signedAmount, frequency: input.frequency, nextExpected, accountId: input.accountId || null, dateConfidence: input.confidence, status: "confirmed", isManual: true },
      })
    }
    revalidateRecurringPaths()
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to save recurring item", error)
    return { ok: false as const, message: "We couldn’t save that recurring item." }
  }
}

export async function setRecurringSeriesActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const result = await prisma.recurringSeries.updateMany({ where: { id, userId: user.id, status: { in: ["confirmed", "dismissed"] } }, data: { status: active ? "confirmed" : "dismissed" } })
  if (result.count === 0) return { ok: false as const, message: "We couldn’t find that recurring item." }
  revalidateRecurringPaths()
  return { ok: true as const }
}

export async function deleteRecurringSeries(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const result = await prisma.recurringSeries.deleteMany({ where: { id, userId: user.id } })
  if (result.count === 0) return { ok: false as const, message: "We couldn’t find that recurring item." }
  revalidateRecurringPaths()
  return { ok: true as const }
}

function revalidateRecurringPaths() {
  revalidatePath("/app/transactions")
  revalidatePath("/app/dashboard")
  revalidatePath("/app/forecast")
  revalidatePath("/app/accounts")
}

export async function confirmRecurringSuggestions(items: RecurringConfirmationInput[], replacements: RecurringReplacementInput[] = []) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  if (items.length > 100 || replacements.length > 25) return { ok: false as const, message: "Too many recurring items were selected." }

  for (const item of items) {
    const date = parseDate(item.nextExpected)
    const evidenceStartDate = parseDate(item.evidenceStartDate)
    const evidenceEndDate = parseDate(item.evidenceEndDate)
    if (!date || !evidenceStartDate || !evidenceEndDate || !item.name.trim() || !Number.isSafeInteger(item.amountCents) || item.amountCents === 0 || !Number.isSafeInteger(item.minAmountCents) || !Number.isSafeInteger(item.maxAmountCents) || !Number.isSafeInteger(item.occurrenceCount) || item.occurrenceCount < 3) return { ok: false as const, message: "Review the selected recurring items and try again." }
    const account = await prisma.account.findFirst({ where: { id: item.accountId, userId: user.id } })
    if (!account) return { ok: false as const, message: "We couldn’t find the account for those suggestions." }
  }

  try {
    const reconciliationIds = await prisma.$transaction(async (tx) => {
      const saved = new Map<string, { seriesId: string; created: boolean }>()
      for (const item of items) {
        const normalizedKey = `csv:${item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
        const dateConfidence = recurringEvidenceConfidence(item.minAmountCents, item.maxAmountCents)
        const prior = await tx.recurringSeries.findUnique({ where: { userId_normalizedKey: { userId: user.id, normalizedKey } }, select: { id: true } })
        const series = await tx.recurringSeries.upsert({
          where: { userId_normalizedKey: { userId: user.id, normalizedKey } },
          update: { name: item.name.trim(), amountCents: item.amountCents, frequency: item.frequency, nextExpected: parseDate(item.nextExpected)!, anchorDayOfMonth: item.anchorDayOfMonth, minAmountCents: item.minAmountCents, maxAmountCents: item.maxAmountCents, occurrenceCount: item.occurrenceCount, evidenceStartDate: parseDate(item.evidenceStartDate)!, evidenceEndDate: parseDate(item.evidenceEndDate)!, dateConfidence, status: "confirmed", accountId: item.accountId },
          create: { userId: user.id, normalizedKey, name: item.name.trim(), type: item.type, amountCents: item.amountCents, frequency: item.frequency, nextExpected: parseDate(item.nextExpected)!, anchorDayOfMonth: item.anchorDayOfMonth, minAmountCents: item.minAmountCents, maxAmountCents: item.maxAmountCents, occurrenceCount: item.occurrenceCount, evidenceStartDate: parseDate(item.evidenceStartDate)!, evidenceEndDate: parseDate(item.evidenceEndDate)!, dateConfidence, status: "confirmed", accountId: item.accountId },
        })
        if (item.id) saved.set(item.id, { seriesId: series.id, created: !prior })
      }

      const createdReconciliations: string[] = []
      for (const replacement of replacements) {
        const existingIds = [...new Set(replacement.existingIds)].slice(0, 20)
        const suggestionIds = [...new Set(replacement.suggestionIds)].slice(0, 20)
        const replacementSeries = suggestionIds.map((id) => saved.get(id)).filter((item): item is { seriesId: string; created: boolean } => Boolean(item))
        if (existingIds.length === 0 || replacementSeries.length !== suggestionIds.length || replacementSeries.some((item) => !item.created)) throw new Error("Invalid reconciliation replacement")
        const existing = await tx.recurringSeries.findMany({ where: { id: { in: existingIds }, userId: user.id, status: "confirmed" }, select: { id: true, name: true } })
        if (existing.length !== existingIds.length) throw new Error("Existing recurring item not found")
        const reconciliationId = randomUUID()
        const newSeriesIds = replacementSeries.map((item) => item.seriesId)
        const newItems = items.filter((item) => item.id && suggestionIds.includes(item.id))
        const replacedAt = new Date()
        const replacementNames = newItems.map((item) => item.name.trim()).join(", ")
        await tx.recurringSeries.updateMany({
          where: { id: { in: existingIds }, userId: user.id },
          data: { status: "replaced", reconciliationId, replacedAt, replacedByImport: replacement.filename.slice(0, 255), replacementNote: `Replaced during CSV import by ${replacementNames}.` },
        })
        await tx.recurringSeries.updateMany({ where: { id: { in: newSeriesIds }, userId: user.id }, data: { reconciliationId } })
        createdReconciliations.push(reconciliationId)
      }
      return createdReconciliations
    })
    revalidatePath("/app/transactions")
    revalidatePath("/app/dashboard")
    revalidatePath("/app/forecast")
    return { ok: true as const, reconciliationIds }
  } catch (error) {
    console.error("Recurring confirmation failed", error)
    return { ok: false as const, message: "We couldn’t save those recurring decisions. Your existing forecast was not changed." }
  }
}

export async function undoRecurringReconciliation(reconciliationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !/^[0-9a-f-]{36}$/i.test(reconciliationId)) return { ok: false as const, message: "That reconciliation could not be found." }
  try {
    await prisma.$transaction(async (tx) => {
      const replaced = await tx.recurringSeries.findMany({ where: { userId: user.id, reconciliationId, status: "replaced" } })
      const replacements = await tx.recurringSeries.findMany({ where: { userId: user.id, reconciliationId, status: "confirmed" } })
      if (replaced.length === 0) throw new Error("Reconciliation not found")
      if (replacements.some((item) => item.updatedAt.getTime() - item.createdAt.getTime() > 2_000)) throw new Error("Replacement was edited")
      await tx.recurringSeries.updateMany({ where: { id: { in: replaced.map((item) => item.id) } }, data: { status: "confirmed", replacementNote: "Restored after undoing a CSV reconciliation." } })
      await tx.recurringSeries.updateMany({ where: { id: { in: replacements.map((item) => item.id) } }, data: { status: "dismissed" } })
    })
    revalidatePath("/app/transactions")
    revalidatePath("/app/dashboard")
    revalidatePath("/app/forecast")
    return { ok: true as const }
  } catch {
    return { ok: false as const, message: "This replacement has changed since import. Restore the old item without removing the newer patterns." }
  }
}
