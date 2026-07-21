"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"

export interface PersonalizationPreferences {
  safetyBufferCents: number
  preferredCurrency: string
  alertSafetyBuffer: boolean
  alertKnownBill: boolean
  alertEstimateReview: boolean
  alertStaleBalance: boolean
  alertLeadDays: number
  dashboardEmphasis: "status" | "calendar" | "decision"
  dashboardDensity: "comfortable" | "compact"
  showSpendingHistory: boolean
}

export async function savePreferences(input: PersonalizationPreferences) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  if (!Number.isSafeInteger(input.safetyBufferCents) || input.safetyBufferCents < 0 || ![0, 1, 3, 7].includes(input.alertLeadDays)) return { ok: false as const, message: "Review your safety buffer and alert timing." }
  if (!["USD", "EUR", "GBP", "INR"].includes(input.preferredCurrency)) return { ok: false as const, message: "Choose a supported currency." }

  try {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: input,
      create: { userId: user.id, ...input },
    })
    revalidatePath("/app/settings")
    revalidatePath("/app/dashboard")
    revalidatePath("/app/forecast")
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to save preferences", error)
    return { ok: false as const, message: "We couldn’t save those preferences. Please try again." }
  }
}

export async function deleteFinancialData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }

  try {
    await prisma.$transaction([
      prisma.forecastSnapshot.deleteMany({ where: { userId: user.id } }),
      prisma.actualBalanceObservation.deleteMany({ where: { userId: user.id } }),
      prisma.recurringException.deleteMany({ where: { userId: user.id } }),
      prisma.recurringSeries.deleteMany({ where: { userId: user.id } }),
      prisma.transaction.deleteMany({ where: { userId: user.id } }),
      prisma.categoryRule.deleteMany({ where: { userId: user.id } }),
      prisma.category.deleteMany({ where: { userId: user.id } }),
      prisma.account.deleteMany({ where: { userId: user.id } }),
      prisma.userProfile.deleteMany({ where: { userId: user.id } }),
    ])
    revalidatePath("/app", "layout")
    return { ok: true as const }
  } catch (error) {
    console.error("Failed to delete financial data", error)
    return { ok: false as const, message: "We couldn’t delete your financial data. Nothing was partially removed. Please try again." }
  }
}
