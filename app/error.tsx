"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="max-w-xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page couldn’t finish loading.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Try once more. If the problem continues, return to Cusp and start again from a familiar place.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>Try again</Button>
          <Button asChild variant="outline"><Link href="/">Return home</Link></Button>
        </div>
      </section>
    </main>
  )
}
