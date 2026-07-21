"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"

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

export async function createAccount(input: { name: string; type: "checking" | "savings"; balanceCents: number; balanceDate: string }) {
  const id = await userId()
  if (!id) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const date = parseDate(input.balanceDate)
  if (!input.name.trim() || !date || !Number.isSafeInteger(input.balanceCents)) return { ok: false as const, message: "Add a name, current balance, and balance date." }
  try {
    const duplicate = await prisma.account.findFirst({ where: { userId: id, name: { equals: input.name.trim(), mode: "insensitive" } }, select: { id: true } })
    if (duplicate) return { ok: false as const, message: "You already have an account with that name." }
    const account = await prisma.account.create({ data: { userId: id, name: input.name.trim(), type: input.type, source: "manual", anchorBalanceCents: input.balanceCents, anchorDate: date } })
    await prisma.actualBalanceObservation.create({ data: { userId: id, accountId: account.id, balanceCents: input.balanceCents, observedAt: date } })
    await prisma.userProfile.upsert({ where: { userId: id }, update: {}, create: { userId: id } })
    revalidateAccounts()
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to create account", error)
    return { ok: false as const, message: "We couldn’t create that account." }
  }
}

export async function updateAccount(input: { accountId: string; name: string; balanceCents: number; balanceDate: string }) {
  const id = await userId()
  if (!id) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const date = parseDate(input.balanceDate)
  if (!input.name.trim() || !date || !Number.isSafeInteger(input.balanceCents)) return { ok: false as const, message: "Add a name, current balance, and balance date." }
  const account = await prisma.account.findFirst({ where: { id: input.accountId, userId: id }, select: { id: true } })
  if (!account) return { ok: false as const, message: "Account not found." }
  try {
    const duplicate = await prisma.account.findFirst({ where: { userId: id, id: { not: account.id }, name: { equals: input.name.trim(), mode: "insensitive" } }, select: { id: true } })
    if (duplicate) return { ok: false as const, message: "You already have an account with that name." }
    await prisma.$transaction([
      prisma.account.update({ where: { id: account.id }, data: { name: input.name.trim(), anchorBalanceCents: input.balanceCents, anchorDate: date } }),
      prisma.actualBalanceObservation.upsert({ where: { accountId_observedAt: { accountId: account.id, observedAt: date } }, update: { balanceCents: input.balanceCents }, create: { userId: id, accountId: account.id, balanceCents: input.balanceCents, observedAt: date } }),
    ])
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
