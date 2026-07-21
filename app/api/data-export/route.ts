import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [profile, accounts, transactions, categories, categoryRules, recurringSeries, recurringExceptions, forecastSnapshots, actualBalanceObservations] = await prisma.$transaction([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.categoryRule.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.recurringSeries.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.recurringException.findMany({ where: { userId: user.id }, orderBy: { originalDate: "asc" } }),
    prisma.forecastSnapshot.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.actualBalanceObservation.findMany({ where: { userId: user.id }, orderBy: { observedAt: "asc" } }),
  ])

  const body = JSON.stringify({
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    profile,
    accounts,
    transactions,
    categories,
    categoryRules,
    recurringSeries,
    recurringExceptions,
    forecastSnapshots,
    actualBalanceObservations,
  }, null, 2)

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="flowsight-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  })
}
