import { createClient } from "@/lib/supabase/server"
import { ForecastView } from "@/components/forecast-view"
import { loadDashboardForecast } from "@/lib/data/forecast"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there"
  const data = user ? await loadDashboardForecast(user.id) : null

  return <ForecastView name={name} data={data} view="dashboard" />
}
