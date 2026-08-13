"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Something interrupted this view</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your data is still safe.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Cusp couldn’t finish loading this page. Try again, or return to your dashboard and continue from there.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}><RefreshCw className="h-4 w-4" /> Try again</Button>
          <Button asChild variant="outline"><Link href="/app/dashboard">Return to Dashboard</Link></Button>
        </div>
        {error.digest ? <p className="mt-5 text-[11px] text-muted-foreground">Reference: {error.digest}</p> : null}
      </section>
    </main>
  )
}
