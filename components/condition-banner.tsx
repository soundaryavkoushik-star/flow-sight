import type { ForecastCondition } from "@/lib/forecast/condition"

export function conditionTone(condition: ForecastCondition) {
  switch (condition) {
    case "clear":
      return "border-[oklch(var(--fs-green))]/30 bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]"
    case "watch":
      return "border-[oklch(var(--fs-amber))]/30 bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]"
    case "tight":
      return "border-[oklch(var(--fs-red))]/30 bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]"
    default:
      return "border-muted-foreground/25 bg-muted/60 text-muted-foreground"
  }
}

/** Keeps decision-room values aligned with the forecast condition vocabulary. */
export function safeToSpendTone(condition: ForecastCondition, safeToSpendCents: number) {
  if (condition === "tight") return "text-[oklch(var(--fs-red))]"
  if (condition === "watch" || safeToSpendCents <= 0) return "text-[oklch(var(--fs-amber))]"
  if (condition === "clear") return "text-[oklch(var(--fs-green))]"
  return "text-muted-foreground"
}

/**
 * Shared condition-colored result banner. Used on the dashboard/forecast
 * pages and the scenario planner so the Clear/Watch/Tight/Update-needed
 * treatment looks and behaves the same everywhere.
 */
export function ConditionBanner({ condition, badge, children, padding = "p-5" }: {
  condition: ForecastCondition
  badge?: React.ReactNode
  children: React.ReactNode
  padding?: string
}) {
  return (
    <section className={`rounded-2xl border ${padding} transition-[background-color,border-color,color] duration-300 ${conditionTone(condition)}`}>
      <div className="max-w-3xl">
        {badge}
        {children}
      </div>
    </section>
  )
}
