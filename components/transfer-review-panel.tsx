"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Link2, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reviewTransferSuggestion, undoTransferDecision } from "@/app/app/transactions/actions"

export interface TransferReviewItem {
  outgoingTransactionId: string
  incomingTransactionId: string
  outgoingDescription: string
  incomingDescription: string
  outgoingAccountName: string
  incomingAccountName: string
  amountCents: number
  date: string
  confidence: "high" | "possible"
  reason: string
}

export interface ConfirmedTransferItem {
  id: string
  outgoingDescription: string
  incomingDescription: string
  outgoingAccountName: string
  incomingAccountName: string
  amountCents: number
  date: string
  status: "confirmed" | "rejected"
}

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)

export function TransferReviewPanel({ suggestions, confirmed }: { suggestions: TransferReviewItem[]; confirmed: ConfirmedTransferItem[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [linking, setLinking] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function decide(item: TransferReviewItem, decision: "confirmed" | "rejected") {
    const itemKey = `${item.outgoingTransactionId}:${item.incomingTransactionId}`
    setSaving(`${item.outgoingTransactionId}:${decision}`)
    setMessage(null)
    if (decision === "confirmed") {
      setLinking(itemKey)
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await new Promise((resolve) => window.setTimeout(resolve, 620))
      }
    }
    const result = await reviewTransferSuggestion(item.outgoingTransactionId, item.incomingTransactionId, decision)
    setSaving(null)
    if (!result.ok) {
      setLinking(null)
      return setMessage(result.message)
    }
    router.refresh()
  }

  async function undo(id: string) {
    setSaving(`undo:${id}`)
    setMessage(null)
    const result = await undoTransferDecision(id)
    setSaving(null)
    if (!result.ok) return setMessage(result.message)
    router.refresh()
  }

  if (suggestions.length === 0 && confirmed.length === 0) return null

  return <section className="mb-5 rounded-2xl border border-border bg-card overflow-hidden">
    <div className="px-4 sm:px-5 py-4 border-b border-border">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-primary/10 p-2"><Link2 className="h-4 w-4 text-primary" /></div>
        <div><h2 className="text-sm font-semibold">Transfers between your accounts</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">A transfer moves money but is not new income or new spending. FlowSight only links a pair when both sides appear in accounts you added.</p></div>
      </div>
    </div>
    {suggestions.length > 0 && <div className="divide-y divide-border">
      {suggestions.map((item) => {
        const itemKey = `${item.outgoingTransactionId}:${item.incomingTransactionId}`
        const isLinking = linking === itemKey
        return <div key={itemKey} className={`p-4 sm:p-5 transition-[background-color,opacity] duration-300 ${isLinking ? "fs-transfer-linking bg-primary/[0.035]" : ""}`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="text-xs font-medium uppercase tracking-wider text-primary">{item.confidence === "high" ? "Likely transfer" : "Possible transfer"}</span><span className="text-xs text-muted-foreground">{new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-lg border px-2.5 py-1 font-medium transition-colors duration-300 ${isLinking ? "border-primary/35 bg-primary/10" : "border-transparent"}`}>{item.outgoingAccountName}</span>
              <span className="relative inline-flex h-7 w-10 items-center justify-center" aria-hidden="true">
                <svg viewBox="0 0 40 18" className="absolute inset-0 h-full w-full overflow-visible">
                  <path className={isLinking ? "fs-transfer-link-path" : ""} d="M2 9 C11 2 29 16 38 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" pathLength="1" />
                </svg>
                {!isLinking && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </span>
              <span className={`rounded-lg border px-2.5 py-1 font-medium transition-colors duration-300 ${isLinking ? "border-primary/35 bg-primary/10" : "border-transparent"}`}>{item.incomingAccountName}</span>
              <span className="font-mono">{money(item.amountCents)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.outgoingDescription} ↔ {item.incomingDescription}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.reason}. Is this money moving between your own accounts?</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" disabled={saving !== null} onClick={() => decide(item, "confirmed")}><Check className="h-3.5 w-3.5 mr-1.5" />{isLinking ? "Linking…" : "Yes, link"}</Button>
            <Button size="sm" variant="outline" disabled={saving !== null} onClick={() => decide(item, "rejected")}><X className="h-3.5 w-3.5 mr-1.5" />Not a transfer</Button>
          </div>
        </div>
      </div>})}
    </div>}
    {confirmed.length > 0 && <details className="border-t border-border">
      <summary className="cursor-pointer px-4 sm:px-5 py-3 text-xs font-medium hover:bg-muted/40">Reviewed matches ({confirmed.length})</summary>
      <div className="divide-y divide-border border-t border-border">
        {confirmed.map((item) => <div key={item.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div><span className={`mr-2 inline-flex rounded-full px-2 py-0.5 ${item.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{item.status === "confirmed" ? "Linked" : "Not a transfer"}</span><span className="font-medium">{item.outgoingAccountName}</span> <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" /> <span className="font-medium">{item.incomingAccountName}</span><span className="ml-2 font-mono">{money(item.amountCents)}</span><p className="mt-1 text-muted-foreground">{item.outgoingDescription} ↔ {item.incomingDescription}</p></div>
          <Button size="sm" variant="ghost" disabled={saving !== null} onClick={() => undo(item.id)}><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Undo decision</Button>
        </div>)}
      </div>
    </details>}
    {message && <p className="px-4 sm:px-5 py-3 border-t border-border text-xs text-destructive">{message}</p>}
  </section>
}
