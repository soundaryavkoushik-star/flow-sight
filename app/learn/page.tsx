import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CircleDollarSign, CreditCard, HelpCircle, LineChart } from "lucide-react"
import { LearnShell } from "@/components/learn-shell"

export const metadata: Metadata = { title: "Learn", description: "Understand how FlowSight calculates forecasts, Safe to Spend, credit-card payments, and more." }

const questions = [
  { href: "/learn/forecast", icon: LineChart, question: "How does FlowSight forecast my money?", detail: "See the daily calculation and what the forecast can—and cannot—know." },
  { href: "/learn/safe-to-spend", icon: CircleDollarSign, question: "What does Safe to Spend actually mean?", detail: "Follow the formula from projected low point to protected cushion." },
  { href: "/learn/credit-cards", icon: CreditCard, question: "How do credit cards work here?", detail: "Understand purchases, statement timing, payments, and transfers." },
  { href: "/learn/troubleshooting", icon: HelpCircle, question: "Why does my forecast look wrong?", detail: "Check freshness, missing activity, estimates, and unmatched transfers." },
]

const pages = [
  ["How your forecast is calculated", "/learn/forecast"],
  ["Safe to Spend explained", "/learn/safe-to-spend"],
  ["Credit cards and transfers", "/learn/credit-cards"],
  ["Importing a CSV", "/learn/csv-import"],
  ["Why does my forecast look wrong?", "/learn/troubleshooting"],
]

export default function LearnPage() {
  return <LearnShell>
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <div className="max-w-3xl"><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#D4754A]">Learn</p><h1 className="mt-4 text-5xl font-medium tracking-tight sm:text-6xl">How FlowSight works.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#4B5563]">Every forecast is built from calculations you can inspect. No black boxes—just your balance, timing, upcoming activity, and clearly labelled assumptions.</p></div>
      <h2 className="mt-16 text-2xl font-medium">Start with a question</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{questions.map(({href,icon:Icon,question,detail})=><Link key={href} href={href} className="group rounded-3xl border border-[#E7DDD1] bg-[#F8F5EE] p-6 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#D4754A]/45 hover:shadow-[0_16px_40px_rgba(15,29,58,0.07)]"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#D4754A]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-xl font-medium">{question}</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">{detail}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#D4754A]">Read the answer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div>
      <div className="mt-16 border-t border-[#E7DDD1] pt-10"><h2 className="text-2xl font-medium">All Learn pages</h2><div className="mt-5 divide-y divide-[#E7DDD1] border-y border-[#E7DDD1]">{pages.map(([label,href],index)=><Link key={href} href={href} className="flex items-center justify-between py-4 text-sm transition-colors hover:text-[#D4754A]"><span><span className="mr-4 font-mono text-xs text-[#9CA3AF]">0{index+1}</span>{label}</span><ArrowRight className="h-4 w-4" /></Link>)}</div></div>
    </section>
  </LearnShell>
}
