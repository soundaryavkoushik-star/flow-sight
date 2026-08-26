"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { checkRateLimit, RATE_LIMITS, rateLimitMessage } from "@/lib/security/rate-limit"

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

async function userId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

function revalidateAccounts() {
  revalidatePath("/app/accounts")
  revalidatePath("/app/transactions")
  revalidatePath("/app/dashboard")
  revalidatePath("/app/forecast")
}

interface AccountInput {
  name: string
  type: "checking" | "savings" | "credit_card"
  balanceCents: number
  balanceDate: string
  paymentAccountId?: string
  statementBalanceCents?: number
  statementBalanceDate?: string
  minimumPaymentCents?: number
  statementClosingDay?: number
  paymentDueDay?: number
  paymentStrategy?: "full_statement" | "minimum" | "fixed"
  fixedPaymentCents?: number
}

function validCardSettings(input: AccountInput) {
  return Boolean(
    Number.isSafeInteger(input.statementBalanceCents)
    && input.statementBalanceCents! >= 0
    && (input.statementClosingDay === undefined || (Number.isInteger(input.statementClosingDay) && input.statementClosingDay >= 1 && input.statementClosingDay <= 31))
    && Number.isInteger(input.paymentDueDay)
    && input.paymentDueDay! >= 1
    && input.paymentDueDay! <= 31
    && ["full_statement", "minimum", "fixed"].includes(input.paymentStrategy ?? "")
    && (input.paymentStrategy !== "minimum" || (Number.isSafeInteger(input.minimumPaymentCents) && input.minimumPaymentCents! > 0))
    && (input.paymentStrategy !== "fixed" || (Number.isSafeInteger(input.fixedPaymentCents) && input.fixedPaymentCents! > 0)),
  )
}

function estimatedClosingDay(paymentDueDay: number) {
  return ((paymentDueDay + 6) % 31) + 1
}

export async function createAccount(input: AccountInput) {
  const id = await userId()
  if (!id) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const rateLimit = await checkRateLimit(id, RATE_LIMITS.dataCreation)
  if (!rateLimit.allowed) return { ok: false as const, message: rateLimitMessage(rateLimit) }
  const date = parseDate(input.balanceDate)
  if (!input.name.trim() || !date || !Number.isSafeInteger(input.balanceCents)) return { ok: false as const, message: "Add a name, current balance, and balance date." }
  if (input.type === "credit_card" && !validCardSettings(input)) return { ok: false as const, message: "Add a current balance and payment due day from 1 to 31." }
  try {
    const duplicate = await prisma.account.findFirst({ where: { userId: id, name: { equals: input.name.trim(), mode: "insensitive" } }, select: { id: true } })
    if (duplicate) return { ok: false as const, message: "You already have an account with that name." }
    const account = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({ data: { userId: id, name: input.name.trim(), type: input.type, isLiability: input.type === "credit_card", source: "manual", anchorBalanceCents: input.balanceCents, anchorDate: date } })
      await tx.actualBalanceObservation.create({ data: { userId: id, accountId: account.id, balanceCents: input.balanceCents, observedAt: date } })
      if (input.type === "credit_card") {
        const statementBalanceDate = (input.statementBalanceDate ? parseDate(input.statementBalanceDate) : null) ?? date
        await tx.creditCardSettings.create({ data: { userId: id, accountId: account.id, statementBalanceCents: input.statementBalanceCents!, statementBalanceDate, minimumPaymentCents: input.minimumPaymentCents, statementClosingDay: input.statementClosingDay ?? estimatedClosingDay(input.paymentDueDay!), paymentDueDay: input.paymentDueDay!, paymentStrategy: input.paymentStrategy!, fixedPaymentCents: input.fixedPaymentCents } })
      }
      return account
    })
    await prisma.userProfile.upsert({ where: { userId: id }, update: {}, create: { userId: id } })
    revalidateAccounts()
    return { ok: true as const, accountId: account.id, accountType: account.type }
  } catch (error) {
    console.error("Failed to create account", error)
    return { ok: false as const, message: "We couldn’t create that account." }
  }
}

export async function confirmCardPaymentProposal(input: { accountId: string; expectedPaymentCents: number; nextPaymentDate: string; statementBalanceDate?: string }) {
  const id = await userId()
  if (!id) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const date = parseDate(input.nextPaymentDate)
  if (!date || !Number.isSafeInteger(input.expectedPaymentCents) || input.expectedPaymentCents <= 0) {
    return { ok: false as const, message: "Add a valid expected payment and date." }
  }
  const statementBalanceDate = (input.statementBalanceDate ? parseDate(input.statementBalanceDate) : null) ?? new Date()
  const account = await prisma.account.findFirst({ where: { id: input.accountId, userId: id, type: "credit_card" }, select: { id: true } })
  if (!account) return { ok: false as const, message: "Credit-card account not found." }
  try {
    await prisma.creditCardSettings.upsert({
      where: { accountId: account.id },
      update: { statementBalanceCents: input.expectedPaymentCents, statementBalanceDate, paymentDueDay: date.getUTCDate(), paymentStrategy: "full_statement" },
      create: {
        userId: id,
        accountId: account.id,
        statementBalanceCents: input.expectedPaymentCents,
        statementBalanceDate,
        statementClosingDay: 1,
        paymentDueDay: date.getUTCDate(),
        paymentStrategy: "full_statement",
      },
    })
    revalidateAccounts()
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to confirm card payment proposal", error)
    return { ok: false as const, message: "We couldn’t add that payment to your forecast." }
  }
}

export async function updateAccount(input: AccountInput & { accountId: string }) {
  const id = await userId()
  if (!id) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const date = parseDate(input.balanceDate)
  if (!input.name.trim() || !date || !Number.isSafeInteger(input.balanceCents)) return { ok: false as const, message: "Add a name, current balance, and balance date." }
  const account = await prisma.account.findFirst({ where: { id: input.accountId, userId: id }, select: { id: true, type: true, creditCardSettings: { select: { id: true } } } })
  if (!account) return { ok: false as const, message: "Account not found." }
  if (account.type === "credit_card" && account.creditCardSettings && !validCardSettings(input)) return { ok: false as const, message: "Add the expected payment amount and due date." }
  try {
    const duplicate = await prisma.account.findFirst({ where: { userId: id, id: { not: account.id }, name: { equals: input.name.trim(), mode: "insensitive" } }, select: { id: true } })
    if (duplicate) return { ok: false as const, message: "You already have an account with that name." }
    await prisma.$transaction(async (tx) => {
      await tx.account.update({ where: { id: account.id }, data: { name: input.name.trim(), anchorBalanceCents: input.balanceCents, anchorDate: date } })
      await tx.actualBalanceObservation.upsert({ where: { accountId_observedAt: { accountId: account.id, observedAt: date } }, update: { balanceCents: input.balanceCents }, create: { userId: id, accountId: account.id, balanceCents: input.balanceCents, observedAt: date } })
      if (account.type === "credit_card" && account.creditCardSettings) {
        const statementClosingDay = input.statementClosingDay ?? estimatedClosingDay(input.paymentDueDay!)
        const statementBalanceDate = (input.statementBalanceDate ? parseDate(input.statementBalanceDate) : null) ?? date
        await tx.creditCardSettings.upsert({ where: { accountId: account.id }, update: { statementBalanceCents: input.statementBalanceCents!, statementBalanceDate, minimumPaymentCents: input.minimumPaymentCents, statementClosingDay, paymentDueDay: input.paymentDueDay!, paymentStrategy: input.paymentStrategy!, fixedPaymentCents: input.fixedPaymentCents }, create: { userId: id, accountId: account.id, statementBalanceCents: input.statementBalanceCents!, statementBalanceDate, minimumPaymentCents: input.minimumPaymentCents, statementClosingDay, paymentDueDay: input.paymentDueDay!, paymentStrategy: input.paymentStrategy!, fixedPaymentCents: input.fixedPaymentCents } })
      }
    })
    revalidateAccounts()
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to update account", error)
    return { ok: false as const, message: "We couldn’t update that account." }
  }
}

export async function deleteAccount(accountId: string) {
  const id = await userId()
  if (!id) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const account = await prisma.account.findFirst({ where: { id: accountId, userId: id }, select: { id: true, _count: { select: { transactions: true } } } })
  if (!account) return { ok: false as const, message: "Account not found." }
  if (account._count.transactions > 0) return { ok: false as const, message: "This account still has transactions. Keep it for now so your history and forecast remain traceable." }
  const recurringCount = await prisma.recurringSeries.count({ where: { userId: id, accountId: account.id, status: "confirmed" } })
  if (recurringCount > 0) return { ok: false as const, message: "Stop or move this account’s recurring events before removing it." }
  try {
    await prisma.account.delete({ where: { id: account.id } })
    revalidateAccounts()
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to delete account", error)
    return { ok: false as const, message: "We couldn’t remove that account." }
  }
}
