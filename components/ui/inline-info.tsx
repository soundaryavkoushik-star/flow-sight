"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Info } from "lucide-react"

export function InlineInfo({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setOpen(false)
        return
      }
      if (event instanceof PointerEvent && !containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", close)
    document.addEventListener("pointerdown", close)
    return () => {
      document.removeEventListener("keydown", close)
      document.removeEventListener("pointerdown", close)
    }
  }, [open])

  return (
    <span
      ref={containerRef}
      className="relative inline-flex shrink-0 normal-case tracking-normal"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-7 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 text-left font-sans text-[11px] font-normal normal-case leading-relaxed tracking-normal text-muted-foreground shadow-xl sm:left-auto sm:right-0"
        >
          {children}
        </span>
      )}
    </span>
  )
}
