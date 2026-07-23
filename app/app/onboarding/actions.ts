"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { calculateForecast, type FinancialEvent, type RecurringRule } from "@/lib/forecast"
import { determineForecastCondition, type ForecastCondition } from "@/lib/forecast/condition"
import { financialDateKey, isValidTimeZone } from "@/lib/forecast/timezone"

type Frequency = "weekly" | "biweekly" | "monthly" | "annual"

export interface OnboardingRecurringItem {
  name: string
  amountCents: number
  frequency: Frequency
  nextDate: string | null
  kind?: "regular" | "variable"
  earliestDate?: string | null
  latestDate?: string | null
  confidence?: "certain" | "likely" | "possible"
}

export interface OnboardingPayload {
  balanceCents: number
  safetyBufferCents: number
  income: OnboardingRecurringItem[]
  bills: OnboardingRecurringItem[]
  incomePattern: "regular" | "variable" | "mixed"
  timezone: string
}

export interface OnboardingForecastSummary {
  safeToSpendCents: number
  lowestBalanceCents: number
  lowestBalanceDate: string
  condition: ForecastCondition
  confirmedEventCount: number
  estimatedEventCount: number
}

export type SaveOnboardingResult =
  | { ok: true; forecast: OnboardingForecastSummary }
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

  const timezone = isValidTimeZone(payload.timezone) ? payload.timezone : "UTC"
  const todayKey = financialDateKey(new Date(), timezone)
  const today = new Date(`${todayKey}T00:00:00.000Z`)
  const items = [...payload.income, ...payload.bills]
  if (!isMoney(payload.balanceCents) || !isMoney(payload.safetyBufferCents)) {
    return { ok: false, message: "Balance and safety buffer must be valid amounts." }
  }
  if (!["regular", "variable", "mixed"].includes(payload.incomePattern)) return { ok: false, message: "Choose how money usually comes in." }
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
        update: { safetyBufferCents: payload.safetyBufferCents, incomePattern: payload.incomePattern, incomePatternSource: "onboarding", incomePatternUpdatedAt: new Date(), timezone },
        create: { userId: user.id, safetyBufferCents: payload.safetyBufferCents, incomePattern: payload.incomePattern, incomePatternSource: "onboarding", incomePatternUpdatedAt: new Date(), timezone },
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
            frequency: item.kind === "variable" ? "irregular" : item.frequency,
            nextExpected: parseDate(item.nextDate) ?? estimatedIncomeDate(today, item.frequency),
            earliestExpected: parseDate(item.earliestDate ?? null),
            latestExpected: parseDate(item.latestDate ?? null),
            incomeConfidence: item.kind === "variable" ? item.confidence ?? "likely" : null,
            dateConfidence: item.kind === "variable" ? (item.confidence === "certain" ? "confirmed" : "estimated") : item.nextDate ? "confirmed" : "estimated",
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

    const forecastEvents: FinancialEvent[] = payload.income.filter((item) => item.kind === "variable").map((item, index) => ({ id: `onboarding:variable:${index}`, name: item.name.trim(), date: item.nextDate ?? todayKey, amountCents: item.amountCents, type: "income", source: "manual", confidence: item.confidence === "certain" ? "confirmed" : "estimated" }))
    const recurringRules: RecurringRule[] = [
      ...payload.income.filter((item) => item.kind !== "variable").map((item, index) => ({ id: `onboarding:income:${index}`, name: item.name.trim(), amountCents: item.amountCents, frequency: item.frequency, nextDate: item.nextDate ?? todayKey, confidence: item.nextDate ? "confirmed" as const : "estimated" as const })),
      ...payload.bills.map((item, index) => ({ id: `onboarding:bill:${index}`, name: item.name.trim(), amountCents: -item.amountCents, frequency: item.frequency, nextDate: item.nextDate ?? todayKey, confidence: item.nextDate ? "confirmed" as const : "estimated" as const })),
    ]
    const forecast = calculateForecast({ startingBalanceCents: payload.balanceCents, events: forecastEvents, recurringRules, settings: { startDate: todayKey, days: 30, safetyBufferCents: payload.safetyBufferCents } })
    const included = forecast.days.flatMap((day) => day.events)
    revalidatePath("/app/dashboard")
    return { ok: true, forecast: { safeToSpendCents: forecast.safeToSpendCents, lowestBalanceCents: forecast.lowestBalanceCents, lowestBalanceDate: forecast.lowestBalanceDate, condition: determineForecastCondition(forecast, payload.safetyBufferCents, "fresh"), confirmedEventCount: included.filter((event) => event.confidence === "confirmed").length, estimatedEventCount: included.filter((event) => event.confidence === "estimated").length } }
  } catch (error) {
    console.error("Failed to save onboarding", error)
    return { ok: false, message: "We couldn't save your forecast setup. Please try again." }
  }
}

export async function saveIncomePattern(pattern: "regular" | "variable" | "mixed", timezone: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  if (!["regular", "variable", "mixed"].includes(pattern)) return { ok: false as const, message: "Choose how money usually comes in." }
  const safeTimezone = isValidTimeZone(timezone) ? timezone : "UTC"
  await prisma.userProfile.upsert({ where: { userId: user.id }, update: { incomePattern: pattern, incomePatternSource: "csv_confirmed", incomePatternUpdatedAt: new Date(), timezone: safeTimezone }, create: { userId: user.id, incomePattern: pattern, incomePatternSource: "csv_confirmed", incomePatternUpdatedAt: new Date(), timezone: safeTimezone } })
  revalidatePath("/app/dashboard")
  return { ok: true as const }
}
