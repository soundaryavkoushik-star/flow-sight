import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"
import { SettingsPreferences } from "@/components/settings-preferences"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user ? await prisma.userProfile.findUnique({ where: { userId: user.id } }) : null
  return <div className="p-6 max-w-3xl mx-auto"><div className="mb-8"><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground mt-0.5">Make FlowSight feel right for the way you plan.</p></div><SettingsPreferences initial={{ safetyBufferCents: profile?.safetyBufferCents ?? 30000, preferredCurrency: profile?.preferredCurrency ?? "USD", alertSafetyBuffer: profile?.alertSafetyBuffer ?? true, alertKnownBill: profile?.alertKnownBill ?? true, alertEstimateReview: profile?.alertEstimateReview ?? true, alertStaleBalance: profile?.alertStaleBalance ?? true, alertLeadDays: profile?.alertLeadDays ?? 3, dashboardEmphasis: (profile?.dashboardEmphasis as "status" | "calendar" | "decision") ?? "status", dashboardDensity: (profile?.dashboardDensity as "comfortable" | "compact") ?? "comfortable", showSpendingHistory: profile?.showSpendingHistory ?? false }} /></div>
}
