"use client"

import { CheckCircle, Info, X } from "lucide-react"

export function ActionToast({ message, tone = "success", action, onAction, onDismiss }: { message: string; tone?: "success" | "info" | "error"; action?: string; onAction?: () => void; onDismiss?: () => void }) {
  const toneClass = tone === "error" ? "border-destructive/25 bg-[hsl(var(--fs-red-bg))]" : tone === "info" ? "border-border bg-muted" : "border-[hsl(var(--fs-green))]/25 bg-[hsl(var(--fs-green-bg))]"
  const Icon = tone === "info" ? Info : CheckCircle
  return <div role={tone === "error" ? "alert" : "status"} className={`flex animate-in fade-in slide-in-from-bottom-2 items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_10px_30px_rgba(15,29,58,0.08)] ${toneClass}`}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 text-muted-foreground">{message}</span>{action && onAction && <button type="button" onClick={onAction} className="shrink-0 text-xs font-medium underline underline-offset-2">{action}</button>}{onDismiss && <button type="button" onClick={onDismiss} className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-black/5" aria-label="Dismiss notification"><X className="h-4 w-4" /></button>}</div>
}
