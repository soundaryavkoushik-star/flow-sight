import { Bell, CheckCircle, AlertTriangle, Clock3 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { loadDashboardForecast } from "@/lib/data/forecast"

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const data = user ? await loadDashboardForecast(user.id) : null
  const estimates = data?.forecast.days.flatMap((day) => day.events.map((event) => ({ ...event, day: day.date }))).filter((event) => event.confidence === "estimated") ?? []
  const risks = data?.preferences.alertSafetyBuffer ? data.forecast.risks : []
  const visibleEstimates = data?.preferences.alertEstimateReview ? estimates : []
  const hasAlerts = risks.length > 0 || visibleEstimates.length > 0

  return <div className="p-6 max-w-5xl mx-auto"><div className="mb-8"><h1 className="text-2xl font-bold tracking-tight">Alerts</h1><p className="text-sm text-muted-foreground mt-0.5">A heads-up when something in your forecast may need attention.</p></div>{!data ? <EmptyAlerts title="Your forecast isn’t ready yet" detail="Add a current balance and upcoming activity to see meaningful forecast alerts." /> : !hasAlerts ? <EmptyAlerts title="Nothing needs your attention" detail="Your current 30-day forecast has no enabled risks or estimates waiting for review." /> : <div className="space-y-3">{risks.map((risk) => <div key={`${risk.type}-${risk.date}`} className="rounded-2xl border border-[hsl(var(--fs-amber))]/25 bg-[hsl(var(--fs-amber-bg))] p-5 flex items-start gap-4"><AlertTriangle className="h-5 w-5 text-[hsl(var(--fs-amber))] shrink-0 mt-0.5" /><div><p className="font-semibold">Your balance may fall below your safety buffer</p><p className="text-sm text-muted-foreground mt-1">The forecast reaches {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(risk.balanceCents / 100)} on {new Date(`${risk.date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.</p></div></div>)}{visibleEstimates.slice(0, 10).map((event) => <div key={event.id} className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4"><Clock3 className="h-5 w-5 text-primary shrink-0 mt-0.5" /><div className="flex-1"><p className="font-semibold">{event.name} is still estimated</p><p className="text-sm text-muted-foreground mt-1">Review the {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(event.amountCents) / 100)} amount or {new Date(`${event.day}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })} date when you know more.</p></div></div>)}</div>}</div>
}

function EmptyAlerts({ title, detail }: { title: string; detail: string }) { return <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><Bell className="h-8 w-8 text-primary" /></div><h2 className="text-xl font-semibold mb-2 flex items-center gap-2">{title === "Nothing needs your attention" && <CheckCircle className="h-5 w-5 text-[hsl(var(--fs-green))]" />}{title}</h2><p className="text-muted-foreground text-sm max-w-sm">{detail}</p></div> }
