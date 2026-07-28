import { loadDashboardForecast } from "@/lib/data/forecast"
import { createClient } from "@/lib/supabase/server"
import ScenarioPlanner from "@/components/scenario-planner"

export default async function ScenariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const data = user ? await loadDashboardForecast(user.id) : null
  return <ScenarioPlanner data={data} />
}
