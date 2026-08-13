interface RunwayPreviewPoint {
  key: "today" | "bills" | "low" | "recovery"
  label: string
  value: string
  detail: string
}

const defaultPoints: RunwayPreviewPoint[] = [
  { key: "today", label: "Today opens", value: "$2,740", detail: "Jul 24" },
  { key: "bills", label: "Next bill", value: "Rent", detail: "Aug 4" },
  { key: "low", label: "Lowest point", value: "$1,840", detail: "Aug 12" },
  { key: "recovery", label: "Recovers", value: "$2,950", detail: "Aug 20" },
]

export function RunwayPreview({
  points = defaultPoints,
  play = true,
  compact = false,
}: {
  points?: RunwayPreviewPoint[]
  play?: boolean
  compact?: boolean
}) {
  return (
    <div className={`relative ${compact ? "mt-5 pb-1 pt-1" : "mt-8 pb-2 pt-3"}`}>
      <div
        className={`absolute left-[6%] right-[6%] top-[22px] h-1 rounded-full bg-border transition-opacity duration-300 ${play ? "fs-runway-line" : "opacity-0"}`}
      />
      <div className="relative grid grid-cols-4">
        {points.map((point) => {
          const isLow = point.key === "low"
          return (
            <div key={point.key} className="flex min-w-0 flex-col items-center text-center">
              <span
                className={`relative block rounded-full border-[3px] border-card ${
                  isLow
                    ? `${play ? "fs-runway-low" : "opacity-0"} h-6 w-6 bg-[oklch(var(--fs-green))]`
                    : point.key === "bills"
                      ? "mt-1.5 h-3 w-3 bg-muted-foreground/40"
                      : point.key === "recovery"
                        ? "mt-1 h-4 w-4 bg-[oklch(var(--fs-green))]"
                        : "mt-1 h-4 w-4 bg-foreground"
                }`}
              />
              <span className={`${compact ? "mt-2" : "mt-3"} block text-xs ${isLow ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                {point.label}
              </span>
              <span className={`mt-0.5 block font-mono ${isLow ? `${compact ? "text-[24px]" : "text-[26px]"} font-bold leading-none text-foreground` : point.key === "bills" ? "text-[15px] font-medium text-muted-foreground" : "text-[15px] font-medium text-foreground"}`}>
                {point.value}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{point.detail}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
