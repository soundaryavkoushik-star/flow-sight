import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, ChartNoAxesCombined, CircleDollarSign, RefreshCcw, ShieldCheck, Split } from "lucide-react";

const features = [
  {
    icon: ChartNoAxesCombined,
    title: "30-day cash-flow forecast",
    copy: "See how your balance may change day by day, including the events that create the projected low point.",
  },
  {
    icon: CircleDollarSign,
    title: "Safe to Spend",
    copy: "Protect your chosen buffer and see the amount that remains available at the lowest point in the forecast.",
  },
  {
    icon: CalendarClock,
    title: "Recurring activity",
    copy: "Review detected paychecks, bills, and subscriptions before they enter your forecast.",
  },
  {
    icon: Split,
    title: "Confirmed and estimated",
    copy: "Known events stay separate from variable amounts and uncertain timing, with evidence shown for estimates.",
  },
  {
    icon: RefreshCcw,
    title: "Scenarios and reversible decisions",
    copy: "Preview a purchase or changed event without altering the real forecast until you explicitly save it.",
  },
  {
    icon: ShieldCheck,
    title: "Connection-free setup",
    copy: "Start with a bank CSV or manual entry. You do not need to hand over a bank login to build a forecast.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFDFC] text-[#111827]">
      <nav className="border-b border-[#EFE7DB] bg-white/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium"><ArrowLeft size={15} />FlowSight</Link>
          <Link href="/sign-up" className="rounded-xl bg-[#C96B43] px-4 py-2 text-sm font-medium text-[#111827] transition-colors hover:bg-[#B85B35]">Join Beta</Link>
        </div>
      </nav>

      <section className="relative px-5 py-20 sm:py-28">
        <div className="pointer-events-none absolute -right-40 -top-48 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(201,107,67,0.10),transparent_68%)]" />
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#C96B43]">FlowSight features</p>
            <h1 className="mt-4 text-[44px] font-medium leading-[1.05] tracking-tight sm:text-[60px]">Understand what&apos;s <span className="text-[#C96B43]">ahead</span>—and what creates it.</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-[#73766F]">FlowSight turns your current balance, income, bills, recurring activity, and account transfers into a forward-looking picture you can inspect and adjust.</p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            {features.map(({ icon: Icon, title, copy }, index) => (
              <article key={title} className="group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 rounded-3xl border border-[#EFE7DB]/70 bg-[#FCF9F5] p-7 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#C96B43]/35 hover:shadow-[0_20px_55px_rgba(28,28,34,0.08)]" style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#C96B43] shadow-sm transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105"><Icon size={18} /></span>
                <h2 className="mt-6 text-2xl font-medium">{title}</h2>
                <p className="mt-3 leading-relaxed text-[#73766F]">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-3xl bg-[#0C1628] px-7 py-10 text-white sm:flex sm:items-center sm:justify-between sm:px-10">
            <div><p className="text-2xl font-medium">Build your first forecast.</p><p className="mt-2 text-sm text-white/55">Start manually or import a CSV. Review everything before it is saved.</p></div>
            <Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C96B43] px-5 py-3 text-sm font-medium text-[#111827] sm:mt-0">Join Beta <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
