import { GitBranch } from "lucide-react"

export default function ScenariosPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Scenarios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Test &ldquo;what if&rdquo; before you commit.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <GitBranch className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Scenario planner</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Add a forecast first, then test big purchases or income changes to see exactly how they affect your cash flow over the next 30–60 days.
        </p>
      </div>
    </div>
  )
}
