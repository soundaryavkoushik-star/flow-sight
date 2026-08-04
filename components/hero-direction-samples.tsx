"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ChevronDown, TrendingUp } from "lucide-react"

const display = { fontFamily: "'Bricolage Grotesque', sans-serif" }
const mono = { fontFamily: "'DM Mono', monospace" }

const forecastPoints = "0,22 44,25 88,31 132,45 176,76 220,95 264,113 308,63 352,54 396,58 440,68 484,74"

function ForecastBriefing({ expanded = false }: { expanded?: boolean }) {
  return <div className={`relative overflow-hidden rounded-[28px] border border-[#D7E0EC] bg-white shadow-[0_30px_90px_rgba(15,29,58,0.13)] ${expanded ? "p-5 sm:p-7" : "p-4 sm:p-5"}`}>
    <div className="flex items-center justify-between border-b border-[#DCCBBA] pb-4">
      <div><p className="text-[10px] uppercase tracking-[0.15em] text-[#625852]" style={mono}>Your 30-day outlook</p><p className="mt-1 text-sm font-medium text-[#292522]">Today → August 20</p></div>
      <span className="rounded-full bg-[#CA8A04]/10 px-3 py-1.5 text-[10px] font-medium text-[#9A6A03]">Watch · Aug 3</span>
    </div>
    <div className={`grid gap-4 pt-5 ${expanded ? "md:grid-cols-[0.78fr_1.22fr]" : "sm:grid-cols-2"}`}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#F2F6FC] p-4"><p className="text-[10px] text-[#625852]">Current balance</p><p className="mt-2 text-xl font-medium text-[#292522]" style={mono}>$4,260</p></div>
        <div className="rounded-2xl bg-[#2D8B5A]/[0.08] p-4"><p className="text-[10px] text-[#625852]">Safe to Spend</p><p className="mt-2 text-xl font-medium text-[#2D8B5A]" style={mono}>$680</p></div>
        <div className="col-span-2 rounded-2xl border border-[#D7E0EC] p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] text-[#625852]">Projected low</p><p className="mt-1 text-lg font-medium text-[#BB6C43]" style={mono}>$420</p></div><div className="text-right"><p className="text-[10px] text-[#625852]">When</p><p className="mt-1 text-sm font-medium">August 3</p></div></div><p className="mt-3 text-xs leading-relaxed text-[#625852]">Rent, insurance, and your car payment arrive before payday.</p></div>
      </div>
      <div className="rounded-2xl border border-[#D7E0EC] bg-[#F7FAFF] p-4">
        <div className="mb-2 flex justify-between text-[9px] text-[#625852]"><span>Projected balance</span><span>30 days</span></div>
        <svg viewBox="0 0 484 138" className="h-[170px] w-full overflow-visible" role="img" aria-label="Forecast falling to 420 dollars before recovering">
          {[28, 68, 108].map((y) => <line key={y} x1="0" x2="484" y1={y} y2={y} stroke="#D7E0EC" />)}
          <line x1="0" x2="484" y1="106" y2="106" stroke="#CA8A04" strokeDasharray="5 4" /><text x="4" y="100" fill="#9A6A03" fontSize="9">$500 buffer</text>
          <polyline points={forecastPoints} fill="none" stroke="#BB6C43" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="fs-hero-sample-line" />
          <circle cx="264" cy="113" r="6" fill="#BB6C43" stroke="white" strokeWidth="3" className="fs-hero-sample-point" />
          <text x="270" y="130" fill="#BB6C43" fontSize="9">Aug 3 · $420</text>
        </svg>
        <div className={`grid gap-2 ${expanded ? "sm:grid-cols-3" : "grid-cols-1"}`}>
          {[["Rent", "−$1,650"], ["Insurance", "−$180"], ["Car payment", "−$410"]].map(([label, amount], index) => <div key={label} className="fs-hero-sample-event rounded-xl border border-[#D7E0EC] bg-white px-3 py-2 text-[10px]" style={{ animationDelay: `${850 + index * 130}ms` }}><span>{label}</span><span className="float-right font-medium" style={mono}>{amount}</span></div>)}
        </div>
      </div>
    </div>
  </div>
}

function HeroCopy() {
  return <div>
    <p className="mb-6 text-xs font-medium uppercase tracking-[0.15em] text-[#BB6C43]" style={mono}>Cash flow, with context</p>
    <h1 className="max-w-[620px] text-[48px] font-medium leading-[1.02] tracking-[-0.02em] text-[#292522] sm:text-[62px]" style={display}>Know what your money <span className="text-[#BB6C43]">does next.</span></h1>
    <p className="mt-6 max-w-[530px] text-[17px] leading-[1.7] text-[#566174]">FlowSight brings your balance, income, bills, and recent activity together to find the days that matter—and give you time to plan.</p>
    <div className="mt-8 flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-xl bg-[#BB6C43] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#A65D39]">Join the Beta <ArrowRight size={15} /></button><button className="rounded-xl border border-[#D7E0EC] bg-white px-5 py-3 text-sm font-medium text-[#292522] transition hover:border-[#BB6C43]/35">See how it works</button></div>
    <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#625852]">{["No bank connection required", "Transparent calculations"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 size={13} className="text-[#2D8B5A]" />{item}</span>)}</div>
  </div>
}

function OptionOne() {
  return <section className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_8%_12%,rgba(138,181,226,0.25),transparent_30rem),radial-gradient(circle_at_88%_16%,rgba(201,99,59,0.11),transparent_24rem),linear-gradient(145deg,#F7FAFF,#EEF4FB_52%,#F7FAFF)] px-5 py-20">
    <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[0.82fr_1.18fr]">
      <HeroCopy />
      <div className="fs-hero-sample-rise"><ForecastBriefing /></div>
    </div>
  </section>
}

function OptionTwo() {
  const sectionRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const available = Math.max(1, section.offsetHeight - window.innerHeight)
      setProgress(Math.max(0, Math.min(1, -rect.top / available)))
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update) }
  }, [])
  const scale = 0.86 + progress * 0.14
  const width = 62 + progress * 38
  return <section ref={sectionRef} className="relative h-[190vh] bg-[radial-gradient(circle_at_12%_10%,rgba(138,181,226,0.25),transparent_32rem),linear-gradient(145deg,#F7FAFF,#EEF4FB_58%,#FFF7F2)]">
    <div className="sticky top-0 flex min-h-screen flex-col justify-center overflow-hidden px-5 py-20">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="mx-auto text-center transition-[opacity,transform] duration-100" style={{ opacity: Math.max(0.18, 1 - progress * 1.25), transform: `translateY(${-32 * progress}px) scale(${1 - progress * 0.04})` }}><div className="mx-auto max-w-3xl"><HeroCopy /></div></div>
        <div className="mx-auto mt-12 origin-top transition-[width,transform] duration-100 ease-out" style={{ width: `${width}%`, transform: `scale(${scale}) translateY(${-38 * progress}px)` }}><ForecastBriefing expanded={progress > 0.42} /></div>
        <div className="pointer-events-none mx-auto mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#625852] transition-opacity" style={{ opacity: 1 - progress * 2 }}><ChevronDown size={13} />Scroll to expand the forecast</div>
        <div className="pointer-events-none mx-auto -mt-4 max-w-xl text-center transition-[opacity,transform]" style={{ opacity: Math.max(0, (progress - 0.62) * 2.7), transform: `translateY(${18 - progress * 18}px)` }}><p className="text-xs font-medium uppercase tracking-[0.15em] text-[#BB6C43]" style={mono}>Five days of warning</p><h2 className="mt-3 text-3xl font-medium text-[#292522]" style={display}>See it <span className="text-[#BB6C43]">before it arrives.</span></h2></div>
      </div>
    </div>
  </section>
}

export default function HeroDirectionSamples() {
  const [option, setOption] = useState<1 | 2>(1)
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }) }, [option])
  return <main className="min-h-screen bg-[#F7FAFF] text-[#292522]">
    <header className="sticky top-0 z-50 border-b border-[#D7E0EC] bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium"><TrendingUp size={18} />FlowSight</Link><div className="flex rounded-xl border border-[#D7E0EC] bg-[#F2F6FC] p-1"><button onClick={() => setOption(1)} className={`rounded-lg px-3 py-2 text-xs font-medium ${option === 1 ? "bg-white text-[#292522] shadow-sm" : "text-[#625852]"}`}>1 · Product-first</button><button onClick={() => setOption(2)} className={`rounded-lg px-3 py-2 text-xs font-medium ${option === 2 ? "bg-white text-[#292522] shadow-sm" : "text-[#625852]"}`}>2 · Scroll expansion</button></div></div></header>
    {option === 1 ? <OptionOne /> : <OptionTwo />}
  </main>
}
