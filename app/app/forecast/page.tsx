import { createClient } from "@/lib/supabase/server"
import { ForecastView } from "@/components/forecast-view"
import { loadDashboardForecast } from "@/lib/data/forecast"

export default async function ForecastPage({ searchParams }: { searchParams: Promise<{ date?: string; detail?: string }> }) {
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there"
  const data = user ? await loadDashboardForecast(user.id) : null

  const requestedDate = query.detail === "1" && /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : null
  const initialSelectedDate = requestedDate && data?.forecast.days.some((day) => day.date === requestedDate) ? requestedDate : null

  return <ForecastView name={name} data={data} view="forecast" initialSelectedDate={initialSelectedDate} />
}
