import { RotateCcw, Sparkles } from "lucide-react"

export default function RecurringPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Recurring</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Bills, subscriptions, and income patterns.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <RotateCcw className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Patterns emerge from data</h2>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          Once you import transactions, FlowSight automatically detects your recurring bills and income — rent, subscriptions, paychecks — and uses them to build your forecast.
        </p>
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-full px-3 py-1.5">
          <Sparkles className="h-3 w-3" /> Auto-detected from your transaction history
        </div>
      </div>
    </div>
  )
}
