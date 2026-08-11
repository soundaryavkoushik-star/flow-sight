import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const SUPPORT_EMAIL = "support@cusp.app"

export async function LearnShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 px-5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5">
        <Link href="/" aria-label="Cusp home"><Image src="/cusp-logo.svg?v=2" alt="Cusp" width={125} height={29} loading="eager" className="h-7 w-auto" /></Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link href="/features" className="text-muted-foreground transition-colors hover:text-foreground">Features</Link>
          <Link href="/learn" aria-current="page" className="border-b border-primary py-2 font-medium text-foreground">Learn</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {!user && <Link href="/sign-in" className="hidden px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">Sign in</Link>}
          <Link href={user ? "/app/dashboard" : "/sign-up"} className="fs-brand-action inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium">{user ? "Open dashboard" : "Get early access"}</Link>
        </div>
      </div>
    </header>
    {children}
  </main>
}

export function ArticleShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <LearnShell>
    <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <Link href="/learn" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All Learn topics</Link>
      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-medium leading-tight tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{intro}</p>
      <div className="mt-10 space-y-12 text-[15px] leading-7 text-muted-foreground">{children}</div>
      <footer className="mt-16 rounded-3xl border border-border bg-muted/45 p-7 sm:flex sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-medium text-foreground">Still confused?</h2><p className="mt-1 text-sm text-muted-foreground">Tell us what doesn’t make sense and we’ll help.</p></div>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:mt-0">Email us <ArrowRight className="h-4 w-4" /></a>
      </footer>
    </article>
  </LearnShell>
}

export function LearnSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-24"><h2 className="text-2xl font-medium text-foreground">{title}</h2><div className="mt-3 space-y-4">{children}</div></section>
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-muted/45 p-5 text-sm leading-6">{children}</div>
}
