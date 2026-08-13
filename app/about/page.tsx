import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "About Cusp",
  description: "A note from Soundarya about why she is building Cusp.",
}

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <main className="fs-landing min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 px-5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5">
        <Link href="/" aria-label="Cusp home"><Image src="/cusp-logo.svg?v=2" alt="Cusp" width={125} height={29} loading="eager" className="h-7 w-auto" /></Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link href="/features" className="text-muted-foreground transition-colors hover:text-foreground">Features</Link>
          <Link href="/learn" className="text-muted-foreground transition-colors hover:text-foreground">Learn</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {!user && <Link href="/sign-in" className="hidden px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">Sign in</Link>}
          <Link href={user ? "/app/dashboard" : "/sign-up"} className="fs-brand-action inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium">{user ? "Open dashboard" : "Get early access"}<ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </header>

    <section className="fs-features-hero relative overflow-hidden px-5 py-16 sm:py-24">
      <article className="mx-auto max-w-3xl rounded-[30px] border border-border bg-card/95 p-7 shadow-[0_28px_90px_rgba(67,45,35,0.08)] sm:p-12 md:p-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">About</p>
        <h1 className="mt-5 text-[34px] font-medium leading-[1.08] tracking-[-0.025em] sm:text-[48px]">A note from the person <em className="font-serif font-normal text-primary">building this.</em></h1>

        <div className="mt-10 space-y-6 text-[16px] leading-8 text-muted-foreground sm:text-[17px]">
          <p className="text-xl leading-9 text-foreground">I built Cusp around one question I kept asking myself: <em className="font-serif text-[1.08em]">am I going to be okay until my next paycheck?</em></p>
          <p>Every finance app I tried answered something close to it—where my money went, what my net worth looked like, or how my spending broke down. None of them answered that question directly. So I started building something that would.</p>
          <p>Cusp doesn&apos;t budget for you, and it doesn&apos;t track your net worth. It looks at the income, bills, and patterns you give it, then shows you where the next few weeks could get tight—before you arrive there.</p>
          <p>I&apos;m keeping it focused on purpose. When I consider adding something, the test is simple: does this make the forecast more useful, more honest, or easier to act on? If it doesn&apos;t, it can wait.</p>
          <p>Cusp is in private beta and is still being shaped by the people using it. If a forecast ever looks wrong—or simply doesn&apos;t make sense—I want to hear about it. That feedback is a large part of how Cusp gets better from here.</p>
        </div>

        <div className="mt-10 border-t border-border pt-7">
          <p className="font-serif text-2xl italic text-foreground">— Soundarya</p>
          <p className="mt-1 text-sm text-muted-foreground">Founder, Cusp</p>
        </div>
      </article>
    </section>
  </main>
}
