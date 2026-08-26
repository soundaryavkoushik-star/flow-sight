import { loadDashboardForecast } from "@/lib/data/forecast"
import { createClient } from "@/lib/supabase/server"
import ScenarioPlanner from "@/components/scenario-planner"

export const metadata: Metadata = { title: "Scenario Planner" }

function horizon(value: string | undefined) {
  return value === "60" || value === "90" ? Number(value) : 30
}

export default async function ScenariosPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const data = user ? await loadDashboardForecast(user.id, horizon(query.range)) : null
  return <ScenarioPlanner data={data} />
}
import type { Metadata } from "next"
