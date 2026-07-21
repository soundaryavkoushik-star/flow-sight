"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"

type Frequency = "weekly" | "biweekly" | "monthly" | "annual"

export interface OnboardingRecurringItem {
  name: string
  amountCents: number
  frequency: Frequency
  nextDate: string | null
}

export interface OnboardingPayload {
  balanceCents: number
  safetyBufferCents: number
  income: OnboardingRecurringItem[]
  bills: OnboardingRecurringItem[]
}

export type SaveOnboardingResult =
  | { ok: true }
  | { ok: false; message: string }

function isMoney(value: number) {
  return Number.isSafeInteger(value) && value >= 0
}

function isFrequency(value: string): value is Frequency {
  return ["weekly", "biweekly", "monthly", "annual"].includes(value)
}

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

function estimatedIncomeDate(start: Date, frequency: Frequency) {
  const date = new Date(start)
  const days = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : frequency === "annual" ? 365 : 30
  date.setUTCDate(date.getUTCDate() + days)
  return date
}

export async function saveOnboarding(payload: OnboardingPayload): Promise<SaveOnboardingResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: "Your session expired. Please sign in again." }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const items = [...payload.income, ...payload.bills]
  if (!isMoney(payload.balanceCents) || !isMoney(payload.safetyBufferCents)) {
    return { ok: false, message: "Balance and safety buffer must be valid amounts." }
  }
  if (items.some((item) => {
    const date = parseDate(item.nextDate)
    return !item.name.trim() || !isMoney(item.amountCents) || item.amountCents === 0 || !isFrequency(item.frequency) || (item.nextDate !== null && (!date || date < today))
  })) {
    return { ok: false, message: "One or more recurring items is invalid." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId: user.id },
        update: { safetyBufferCents: payload.safetyBufferCents },
        create: { userId: user.id, safetyBufferCents: payload.safetyBufferCents },
      })

      const existingAccount = await tx.account.findFirst({
        where: { userId: user.id, source: "onboarding" },
        orderBy: { createdAt: "asc" },
      })

      const account = existingAccount
        ? await tx.account.update({
            where: { id: existingAccount.id },
            data: { name: "Primary checking", anchorBalanceCents: payload.balanceCents, anchorDate: today },
          })
        : await tx.account.create({
            data: {
              userId: user.id,
              name: "Primary checking",
              type: "checking",
              source: "onboarding",
              anchorBalanceCents: payload.balanceCents,
              anchorDate: today,
            },
          })

      await tx.recurringSeries.deleteMany({
        where: { userId: user.id, normalizedKey: { startsWith: "onboarding:" } },
      })

      await tx.recurringSeries.createMany({
        data: [
          ...payload.income.map((item, index) => ({
            userId: user.id,
            normalizedKey: `onboarding:income:${index}`,
            name: item.name.trim(),
            type: "income",
            amountCents: item.amountCents,
            frequency: item.frequency,
            nextExpected: parseDate(item.nextDate) ?? estimatedIncomeDate(today, item.frequency),
            dateConfidence: item.nextDate ? "confirmed" : "estimated",
            status: "confirmed",
            isManual: true,
            accountId: account.id,
          })),
          ...payload.bills.map((item, index) => ({
            userId: user.id,
            normalizedKey: `onboarding:bill:${index}`,
            name: item.name.trim(),
            type: "bill",
            amountCents: -item.amountCents,
            frequency: item.frequency,
            // Unknown bill dates are placed at the start of the window so the
            // forecast stays conservative instead of overstating safe-to-spend.
            nextExpected: parseDate(item.nextDate) ?? today,
            dateConfidence: item.nextDate ? "confirmed" : "estimated",
            status: "confirmed",
            isManual: true,
            accountId: account.id,
          })),
        ],
      })
    })

    revalidatePath("/app/dashboard")
    return { ok: true }
  } catch (error) {
    console.error("Failed to save onboarding", error)
    return { ok: false, message: "We couldn't save your forecast setup. Please try again." }
  }
}
