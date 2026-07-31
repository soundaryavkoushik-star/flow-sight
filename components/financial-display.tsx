"use client"

import { useEffect, useState } from "react"
import { formatCurrencyCents } from "@/lib/financial/currency"

export function ConfidencePill({ confidence }: { confidence: "confirmed" | "estimated" }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${confidence === "confirmed" ? "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))]" : "bg-[hsl(var(--fs-amber-bg))] text-[hsl(var(--fs-amber))]"}`}>{confidence === "confirmed" ? "Confirmed" : "Estimated"}</span>
}

export function AmountReveal({ cents, prefix = "", estimated = false, className = "" }: { cents: number; prefix?: string; estimated?: boolean; className?: string }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      const frame = requestAnimationFrame(() => setValue(cents))
      return () => cancelAnimationFrame(frame)
    }
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 650)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(cents * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [cents])
  return <span className={className}>{estimated ? "~" : ""}{prefix}{formatCurrencyCents(value)}</span>
}
