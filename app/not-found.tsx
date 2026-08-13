import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="fs-landing flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">404 · Page not found</p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">This isn’t part of the forecast.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">The page may have moved, or the address may be incomplete. Head back to Cusp and keep going.</p>
        <Button asChild className="mt-7"><Link href="/"><ArrowLeft className="h-4 w-4" /> Return home</Link></Button>
      </section>
    </main>
  )
}
