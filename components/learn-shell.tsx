import Link from "next/link"
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react"

export const SUPPORT_EMAIL = "support@flowsight.app"

export function LearnShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#FFFFFF] text-[#0F1D3A]">
    <header className="sticky top-0 z-20 border-b border-[#E7DDD1] bg-white/90 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#111111]"><TrendingUp className="h-5 w-5" />FlowSight</Link>
        <nav className="flex items-center gap-4 text-sm"><Link href="/learn" className="text-[#6B7280] transition-colors hover:text-[#111111]">Learn</Link><Link href="/sign-in" className="rounded-lg border border-[#E7DDD1] px-3 py-2 text-[#111111] transition-colors hover:border-[#D4754A]">Sign in</Link></nav>
      </div>
    </header>
    {children}
  </main>
}

export function ArticleShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <LearnShell>
    <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <Link href="/learn" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111111]"><ArrowLeft className="h-4 w-4" />All Learn topics</Link>
      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-[#D4754A]">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-medium leading-tight tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-[#4B5563]">{intro}</p>
      <div className="mt-10 space-y-12 text-[15px] leading-7 text-[#374151]">{children}</div>
      <footer className="mt-16 rounded-3xl bg-[#F8F5EE] p-7 sm:flex sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-medium text-[#0F1D3A]">Still confused?</h2><p className="mt-1 text-sm text-[#6B7280]">Tell us what doesn’t make sense and we’ll help.</p></div>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D4754A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#BE633D] sm:mt-0">Email us <ArrowRight className="h-4 w-4" /></a>
      </footer>
    </article>
  </LearnShell>
}

export function LearnSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-24"><h2 className="text-2xl font-medium text-[#0F1D3A]">{title}</h2><div className="mt-3 space-y-4">{children}</div></section>
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[#E7DDD1] bg-[#F8F5EE] p-5 text-sm leading-6">{children}</div>
}
