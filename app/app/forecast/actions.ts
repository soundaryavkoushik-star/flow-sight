"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { createHash } from "node:crypto"
import { isValidTimeZone } from "@/lib/forecast/timezone"

export interface ForecastEventUpdate {
  eventId: string
  name: string
  amountCents: number
  date: string
  confidence: "confirmed" | "estimated"
}

export type ForecastEventUpdateResult = { ok: true } | { ok: false; message: string }
export type SafetyBufferUpdateResult = ForecastEventUpdateResult

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

export async function updateForecastEvent(input: ForecastEventUpdate): Promise<ForecastEventUpdateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "Your session expired. Please sign in again." }

  const date = parseDate(input.date)
  if (!input.name.trim() || !Number.isSafeInteger(input.amountCents) || input.amountCents === 0 || !date) {
    return { ok: false, message: "Add a name, non-zero amount, and valid date." }
  }

  try {
    if (input.eventId.startsWith("recurring:")) {
      const [, recurringId, originalDateValue] = input.eventId.split(":")
      const originalDate = parseDate(originalDateValue)
      const existing = await prisma.recurringSeries.findFirst({ where: { id: recurringId, userId: user.id } })
      if (!existing || !originalDate) return { ok: false, message: "We couldn’t find that recurring event." }
      await prisma.recurringSeries.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim(),
          amountCents: input.amountCents,
          dateConfidence: input.confidence,
        },
      })
      if (input.date === originalDateValue) {
        await prisma.recurringException.deleteMany({ where: { recurringSeriesId: existing.id, originalDate } })
      } else {
        await prisma.recurringException.upsert({
          where: { recurringSeriesId_originalDate: { recurringSeriesId: existing.id, originalDate } },
          update: { action: "move", movedDate: date },
          create: { userId: user.id, recurringSeriesId: existing.id, originalDate, action: "move", movedDate: date },
        })
      }
    } else {
      const existing = await prisma.transaction.findFirst({ where: { id: input.eventId, userId: user.id } })
      if (!existing) return { ok: false, message: "We couldn’t find that transaction." }
      await prisma.transaction.update({
        where: { id: existing.id },
        data: { description: input.name.trim(), amountCents: input.amountCents, date },
      })
    }

    revalidatePath("/app/dashboard")
    revalidatePath("/app/forecast")
    return { ok: true }
  } catch (error) {
    console.error("Failed to update forecast event", error)
    return { ok: false, message: "We couldn’t save that change. Please try again." }
  }
}

export async function skipForecastOccurrence(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const [, recurringId, originalDateValue] = eventId.split(":")
  const originalDate = parseDate(originalDateValue)
  if (!eventId.startsWith("recurring:") || !recurringId || !originalDate) return { ok: false as const, message: "That occurrence can’t be skipped." }
  const series = await prisma.recurringSeries.findFirst({ where: { id: recurringId, userId: user.id } })
  if (!series) return { ok: false as const, message: "We couldn’t find that recurring event." }
  await prisma.recurringException.upsert({
    where: { recurringSeriesId_originalDate: { recurringSeriesId: series.id, originalDate } },
    update: { action: "skip", movedDate: null },
    create: { userId: user.id, recurringSeriesId: series.id, originalDate, action: "skip" },
  })
  revalidateForecastPaths()
  return { ok: true as const }
}

export async function stopRecurringEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  const recurringId = eventId.split(":")[1]
  const series = await prisma.recurringSeries.findFirst({ where: { id: recurringId, userId: user.id } })
  if (!series) return { ok: false as const, message: "We couldn’t find that recurring event." }
  await prisma.recurringSeries.update({ where: { id: series.id }, data: { status: "dismissed" } })
  revalidateForecastPaths()
  return { ok: true as const }
}

export async function deleteForecastTransaction(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  if (eventId.startsWith("recurring:")) return { ok: false as const, message: "Stop this recurring event instead of deleting a single generated transaction." }
  const result = await prisma.transaction.deleteMany({ where: { id: eventId, userId: user.id } })
  if (result.count === 0) return { ok: false as const, message: "We couldn’t find that transaction." }
  revalidateForecastPaths()
  return { ok: true as const }
}

export async function confirmForecastEstimate(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Your session expired. Please sign in again." }
  if (!eventId.startsWith("recurring:")) return { ok: true as const }
  const recurringId = eventId.split(":")[1]
  const result = await prisma.recurringSeries.updateMany({ where: { id: recurringId, userId: user.id }, data: { dateConfidence: "confirmed" } })
  if (result.count === 0) return { ok: false as const, message: "We couldn’t find that estimate." }
  revalidateForecastPaths()
  return { ok: true as const }
}

function revalidateForecastPaths() {
  revalidatePath("/app/dashboard")
  revalidatePath("/app/forecast")
  revalidatePath("/app/transactions")
  revalidatePath("/app/alerts")
}

export async function updateSafetyBuffer(safetyBufferCents: number): Promise<SafetyBufferUpdateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "Your session expired. Please sign in again." }
  if (!Number.isSafeInteger(safetyBufferCents) || safetyBufferCents < 0 || safetyBufferCents > 10_000_000) {
    return { ok: false, message: "Choose a safety buffer between $0 and $100,000." }
  }

  try {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { safetyBufferCents },
      create: { userId: user.id, safetyBufferCents },
    })
    revalidatePath("/app/dashboard")
    revalidatePath("/app/forecast")
    return { ok: true }
  } catch (error) {
    console.error("Failed to update safety buffer", error)
    return { ok: false, message: "We couldn’t save your safety buffer. Please try again." }
  }
}

export interface ForecastSnapshotInput {
  timezone?: string
  startDate: string
  startingBalanceCents: number
  safetyBufferCents: number
  safeToSpendCents: number
  lowestBalanceCents: number
  lowestBalanceDate: string
  days: Array<{ date: string; endingBalanceCents: number }>
  events: Array<{ id: string; date: string; name: string; amountCents: number; confidence: "confirmed" | "estimated"; source: string }>
}

export async function recordForecastVisit(input: ForecastSnapshotInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const startDate = parseDate(input.startDate)
  const lowestDate = parseDate(input.lowestBalanceDate)
  const endDate = input.days.length > 0 ? parseDate(input.days.at(-1)!.date) : null
  const moneyValues = [input.startingBalanceCents, input.safetyBufferCents, input.safeToSpendCents, input.lowestBalanceCents]
  if (!user || !startDate || !lowestDate || !endDate || input.days.length > 62 || input.events.length > 1000 || moneyValues.some((value) => !Number.isSafeInteger(value))) return
  if (input.days.some((day) => !parseDate(day.date) || !Number.isSafeInteger(day.endingBalanceCents)) || input.events.some((event) => !parseDate(event.date) || !event.name.trim() || !Number.isSafeInteger(event.amountCents))) return
  const snapshot = {
    startDate: input.startDate,
    startingBalanceCents: input.startingBalanceCents,
    safetyBufferCents: input.safetyBufferCents,
    days: input.days,
    events: input.events,
  }
  const inputFingerprint = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
  const confirmedEventCount = input.events.filter((event) => event.confidence === "confirmed").length
  const estimatedEventCount = input.events.length - confirmedEventCount
  const now = new Date()
  const timezone = input.timezone && isValidTimeZone(input.timezone) ? input.timezone : undefined
  await prisma.$transaction([
    prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { lastForecastViewedAt: now, lastSafeToSpendCents: input.safeToSpendCents, lastLowestBalanceCents: input.lowestBalanceCents, ...(timezone ? { timezone } : {}) },
      create: { userId: user.id, lastForecastViewedAt: now, lastSafeToSpendCents: input.safeToSpendCents, lastLowestBalanceCents: input.lowestBalanceCents, ...(timezone ? { timezone } : {}) },
    }),
    prisma.forecastSnapshot.upsert({
      where: { userId_inputFingerprint: { userId: user.id, inputFingerprint } },
      update: {},
      create: { userId: user.id, inputFingerprint, forecastStartDate: startDate, forecastEndDate: endDate, startingBalanceCents: input.startingBalanceCents, safetyBufferCents: input.safetyBufferCents, safeToSpendCents: input.safeToSpendCents, lowestBalanceCents: input.lowestBalanceCents, lowestBalanceDate: lowestDate, confirmedEventCount, estimatedEventCount, projectedDays: input.days, includedEvents: input.events },
    }),
  ])
}
