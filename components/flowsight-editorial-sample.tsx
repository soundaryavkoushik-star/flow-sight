"use client"

/* eslint-disable react-hooks/refs -- useMotionCue returns a callback ref, not a mutable React ref. */

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Check, ChevronDown, CircleHelp, CreditCard, FileSpreadsheet, Menu, Repeat2, ShieldCheck, Sparkles, X } from "lucide-react"

const ink = "#292522"
const rose = "#C8906D"
const border = "#DCCBBA"
const amber = "#B7791F"

const heroModes = [
  { label: "Clear month", condition: "Clear", balance: "$3,900", safe: "$3,100", low: "$1,420", path: "M0 28 C70 30 112 42 164 40 S256 66 326 70 S386 74 430 39 S478 36 520 38" },
  { label: "Tight week", condition: "Watch", balance: "$3,900", safe: "$680", low: "$420", path: "M0 24 C72 28 118 42 174 44 S250 70 310 88 S368 96 420 48 S474 40 520 42" },
  { label: "Variable income", condition: "Estimated", balance: "$3,900", safe: "$420–$1,160", low: "$920", path: "M0 28 C70 35 116 48 170 45 S252 75 310 71 S372 82 422 45 S472 30 520 42" },
] as const

const ahaEvents = [
  { label: "Starting balance", date: "Today", delta: "$3,900", balance: 3900 },
  { label: "Rent", date: "Aug 1", delta: "−$1,750", balance: 2150 },
  { label: "Insurance", date: "Aug 2", delta: "−$180", balance: 1970 },
  { label: "Car payment", date: "Aug 3", delta: "−$1,550", balance: 420 },
] as const

const scenarioChoices = [
  { label: "No purchase", amount: 0 },
  { label: "Weekend trip", amount: 650 },
  { label: "New laptop", amount: 1400 },
] as const

function useMotionCue(delay = 0) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!node) return
    let timer: number | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      timer = window.setTimeout(() => setActive(true), delay)
      observer.disconnect()
    }, { threshold: 0.3 })
    observer.observe(node)
    return () => {
      observer.disconnect()
      if (timer) window.clearTimeout(timer)
    }
  }, [delay, node])

  return { ref: setNode, active }
}

function ForecastLine({ path, estimated = false }: { path: string; estimated?: boolean }) {
  return <svg viewBox="0 0 520 118" className="h-36 w-full overflow-visible" role="img" aria-label="Projected balance line">
    {[26, 58, 90].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} stroke={border} strokeWidth="1" />)}
    <line x1="0" x2="520" y1="94" y2="94" stroke={amber} strokeDasharray="6 7" opacity=".75" />
    <text x="4" y="108" fill={amber} fontSize="9" fontFamily="var(--sample-mono)">$500 buffer</text>
    {estimated && <path d="M0 20 C70 28 116 37 170 35 S252 62 310 57 S372 68 422 32 S472 18 520 30 L520 54 C470 42 452 44 422 56 S370 94 310 85 S250 88 170 56 S70 48 0 38 Z" fill={rose} opacity=".08" />}
    <path d={path} fill="none" stroke={rose} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={estimated ? "8 6" : undefined} className="motion-safe:[stroke-dasharray:1000] motion-safe:[stroke-dashoffset:1000] motion-safe:animate-[editorial-draw_1.2s_ease-out_forwards]" />
  </svg>
}

function HeroPreview({ mode }: { mode: number }) {
  const item = heroModes[mode]
  return <div className="relative rounded-[28px] bg-[#EFE5D8] p-4 shadow-[0_30px_80px_rgba(74,65,60,.12)] sm:p-6">
    <div className="rounded-[20px] border border-[#DCCBBA] bg-[#FFFDFC] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[#756A63]">Your next 30 days</p><h3 className="mt-1 font-editorial text-3xl font-normal text-[#292522]">What happens next</h3></div><span className={`rounded-full px-3 py-1.5 text-xs ${item.condition === "Clear" ? "bg-[#E8F4ED] text-[#2D8B5A]" : "bg-[#F9F0DD] text-[#9A6719]"}`}>{item.condition}</span></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#F7F2EA] p-3"><p className="text-[11px] text-[#756A63]">Current balance</p><p key={`balance-${mode}`} className="mt-2 font-mono text-xl text-[#292522] motion-safe:animate-[number-roll_.55s_cubic-bezier(.19,1,.22,1)_both]">{item.balance}</p></div><div className="rounded-xl bg-[#EFE5D8] p-3"><p className="text-[11px] text-[#756A63]">Safe to Spend</p><p key={`safe-${mode}`} className="mt-2 font-mono text-xl text-[#BB6C43] motion-safe:animate-[number-roll_.55s_cubic-bezier(.19,1,.22,1)_both]">{item.safe}</p></div></div>
      <div className="mt-5 border-t border-[#DCCBBA] pt-4"><div className="flex justify-between text-[11px] text-[#756A63]"><span>Projected balance</span><span>Today → Aug 25</span></div><ForecastLine path={item.path} estimated={mode === 2} /></div>
      <div className="mt-1 flex items-center gap-2 text-xs text-[#625852]"><span className="h-2 w-2 rounded-full bg-[#C8906D]" />{mode === 1 ? "Rent, insurance and your car payment create the low point." : mode === 2 ? "Invoice timing creates a wider possible range." : "Your known income keeps the forecast above your buffer."}</div>
    </div>
  </div>
}

function AhaDiagram() {
  const [step, setStep] = useState(0)
  const cue = useMotionCue()
  useEffect(() => {
    if (!cue.active) return
    const timer = window.setInterval(() => setStep((current) => current < 3 ? current + 1 : current), 850)
    return () => window.clearInterval(timer)
  }, [cue.active])
  const points = [22, 53, 59, 88]
  const path = `M0 ${points[0]} C80 ${points[0]}, 105 ${points[1]}, 170 ${points[1]} S250 ${points[2]}, 330 ${points[2]} S410 ${points[3]}, 520 ${points[3]}`
  return <div ref={cue.ref} className="rounded-[28px] border border-[#DCCBBA] bg-[#FFFDFC] p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-[#756A63]">Example forecast · Jul 21 → Aug 3</p><p className="mt-1 font-editorial text-2xl text-[#292522]">Five days of warning</p></div><span className="rounded-full bg-[#F9F0DD] px-3 py-1.5 text-xs text-[#9A6719]">Watch · Aug 3</span></div>
    <div className="relative mt-6 overflow-hidden rounded-2xl bg-[#FFFDFC] px-4 pb-2 pt-5"><svg viewBox="0 0 520 132" className="h-44 w-full" role="img" aria-label="Balance falls as four events occur"><line x1="0" x2="520" y1="94" y2="94" stroke={amber} strokeDasharray="6 7" /><path d={path} fill="none" stroke={rose} strokeWidth="3" strokeLinecap="round" pathLength="3" strokeDasharray="3" strokeDashoffset={3 - step} className="transition-[stroke-dashoffset] duration-700 ease-out" />{ahaEvents.map((event, index) => { const x = [0,170,330,520][index]; const y = points[index]; return <g key={event.label} className={`transition-opacity ${index <= step ? "opacity-100" : "opacity-15"}`}><line x1={x} x2={x} y1={y + 7} y2="118" stroke={index === 0 ? ink : rose} strokeDasharray="3 4" opacity=".42" /><circle cx={x} cy={y} r={index === step ? 7 : 5} fill={index === 0 ? ink : rose} stroke="white" strokeWidth="3" /></g>})}<text x="4" y="108" fill={amber} fontSize="9" fontFamily="var(--sample-mono)">$500 safety buffer</text></svg></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-4">{ahaEvents.map((event,index)=><div key={event.label} className={`rounded-xl border p-3 text-left transition-all duration-500 ${step===index?"-translate-y-1 border-[#C8906D] bg-[#F4E8DE] shadow-[0_10px_25px_rgba(200,144,109,.08)]":index<step?"border-[#DCCBBA] bg-[#FFFDFC]":"border-[#DCCBBA] opacity-45"}`}><span className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{event.label}</span><span className="font-mono text-xs">{event.delta}</span></span><span className="mt-1 block text-[10px] text-[#756A63]">{event.date} · balance ${event.balance.toLocaleString()}</span></div>)}</div>
  </div>
}

function KnowledgePanel() {
  const cue = useMotionCue()
  const items = [
    { icon: Repeat2, title: "Recurring patterns", copy: "Rent and payroll repeat on a stable schedule.", note: "6 occurrences found", visual: <div className="flex items-end gap-2">{[34,34,34,34].map((h,i)=><span key={i} className="w-7 rounded-t bg-[#BB6C43]/75" style={{height:h}} />)}</div> },
    { icon: Sparkles, title: "Certainty labelled", copy: "Stable facts and variable estimates never look the same.", note: "Confirmed · Estimated", visual: <div className="flex gap-2"><span className="rounded-full bg-[#E8F4ED] px-3 py-1 text-xs text-[#2D8B5A]">Confirmed</span><span className="rounded-full border border-dashed border-[#B7791F]/50 bg-[#F9F0DD] px-3 py-1 text-xs text-[#9A6719]">Estimated</span></div> },
    { icon: CreditCard, title: "Card timing", copy: "Purchases explain spending; the payment shows when cash leaves.", note: "Due Aug 15", visual: <div className="relative h-12"><span className="absolute left-0 top-4 h-px w-full bg-[#DCCBBA]" /><span className="absolute left-[15%] top-2 h-5 w-5 rounded-full border-4 border-white bg-[#C8906D]" /><span className="absolute right-[18%] top-2 h-5 w-5 rounded-full border-4 border-white bg-[#BB6C43]" /></div> },
    { icon: Repeat2, title: "Transfers connected", copy: "Matching movements between your accounts are not counted twice.", note: "Strong match · reversible", visual: <div className="flex items-center justify-between gap-3 font-mono text-xs"><span>−$1,200</span><span className="text-[#C8906D]">— linked →</span><span>+$1,200</span></div> },
  ]
  return <div ref={cue.ref} className="grid gap-4 md:grid-cols-2">{items.map(({icon:Icon,title,copy,note,visual},index)=><article key={title} style={{transitionDelay:`${index*180}ms`}} className={`group rounded-[24px] border border-[#DCCBBA] p-6 transition-all duration-700 ${cue.active?"translate-y-0 opacity-100":"translate-y-8 opacity-0"} ${index===0||index===3?"bg-[#EFE5D8]":"bg-[#FFFDFC]"}`}><div className="flex items-start justify-between gap-4"><Icon className={`h-5 w-5 text-[#BB6C43] ${cue.active?'motion-safe:animate-[soft-pulse_1.2s_ease-out]':''}`}/><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#8A6F60]">{note}</span></div><h3 className="mt-7 font-editorial text-2xl text-[#292522]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#625852]">{copy}</p><div className="mt-8 rounded-xl border border-[#DCCBBA] bg-[#FFFDFC]/80 p-4">{visual}</div></article>)}</div>
}

function IncomeDiagram() {
  const [kind,setKind]=useState<"regular"|"variable"|"mixed">("regular")
  const cue = useMotionCue()
  useEffect(() => {
    if (!cue.active) return
    const kinds = ["regular", "variable", "mixed"] as const
    const timer = window.setInterval(() => setKind((current) => kinds[(kinds.indexOf(current) + 1) % kinds.length]), 3200)
    return () => window.clearInterval(timer)
  }, [cue.active])
  const bars = kind === "regular" ? [42,42,42,42] : kind === "variable" ? [25,56,36,66] : [42,24,42,58,42,32]
  return <div ref={cue.ref} className="rounded-[28px] border border-[#DCCBBA] bg-[#FFFDFC] p-5 sm:p-7"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center"><div><div className="space-y-2">{([['regular','Regular paycheck'],['variable','Variable income'],['mixed','A mix of both']] as const).map(([id,label])=><div key={id} className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all duration-500 ${kind===id?"bg-[#BB6C43] text-white":"text-[#756A63]"}`}><span>{label}</span><span className={`h-1.5 rounded-full transition-all duration-[3200ms] ${kind===id?'w-12 bg-[#E5CBB9]':'w-1.5 bg-[#DCCBBA]'}`}/></div>)}</div></div><div className="rounded-2xl bg-[#FFFDFC] p-6"><div className="flex h-40 items-end justify-around gap-4 border-b border-[#DCCBBA]">{bars.map((height,index)=><span key={`${kind}-${index}`} className={`relative w-8 rounded-t motion-safe:animate-[bar-rise_.65s_cubic-bezier(.19,1,.22,1)_both] ${kind==='mixed'&&index%2?"bg-[#C8906D]":"bg-[#BB6C43]"}`} style={{height,animationDelay:`${index*90}ms`}}>{kind==='variable'&&<span className="absolute -left-1 -right-1 -top-4 h-[calc(100%+1rem)] rounded-t border border-dashed border-[#C8906D]/60"/>}</span>)}</div><div className="mt-3 flex justify-between font-mono text-[10px] text-[#756A63]"><span>Today</span><span>Next 30 days</span></div><p key={kind} className="mt-5 text-sm text-[#625852] motion-safe:animate-[editorial-rise_.5s_ease-out_both]">{kind==='regular'?"Equal amounts arrive on a known rhythm.":kind==='variable'?"Timing and amount remain visibly estimated.":"A steady paycheck and variable invoices can coexist."}</p></div></div></div>
}

function ScenarioPanel() {
  const [choice,setChoice]=useState(0)
  const cue = useMotionCue()
  useEffect(() => {
    if (!cue.active) return
    const timer = window.setInterval(() => setChoice((current) => (current + 1) % scenarioChoices.length), 3400)
    return () => window.clearInterval(timer)
  }, [cue.active])
  const current=scenarioChoices[choice]
  const safe=Math.max(0,3100-current.amount)
  const y=38+current.amount/30
  const path=`M0 25 C72 30 122 42 172 40 S258 ${Math.min(94,y)} 326 ${Math.min(96,y+6)} S392 78 440 44 S486 39 520 41`
  return <div ref={cue.ref} className="rounded-[28px] bg-[#292522] p-5 text-white sm:p-8"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center"><div><div className="space-y-2">{scenarioChoices.map((item,index)=><div key={item.label} className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all duration-500 ${choice===index?"translate-x-2 border-[#E5CBB9] bg-[#C8906D]":"border-white/15 text-white/45"}`}>{item.label}{item.amount>0&&<span className="float-right font-mono">−${item.amount.toLocaleString()}</span>}</div>)}</div></div><div className="rounded-2xl bg-[#FFFDFC] p-5 text-[#292522]"><div className="flex justify-between gap-4"><div><p className="text-xs text-[#756A63]">With {current.label.toLowerCase()}</p><p className="mt-1 font-editorial text-2xl">Safe to Spend · <span key={safe} className="inline-block text-[#BB6C43] motion-safe:animate-[number-roll_.55s_cubic-bezier(.19,1,.22,1)_both]">${safe.toLocaleString()}</span></p></div><span className={`h-fit rounded-full px-3 py-1 text-xs transition-colors ${safe<1000?'bg-[#F9F0DD] text-[#9A6719]':'bg-[#E8F4ED] text-[#2D8B5A]'}`}>{safe<1000?'Watch':'Clear'}</span></div><ForecastLine path={path}/><div className="border-t border-[#DCCBBA] pt-3 text-xs text-[#625852]">This temporary scenario leaves a projected low of <span className="font-mono font-medium text-[#292522]">${(safe+500).toLocaleString()}</span>.</div></div></div></div>
}

function ShowWork() {
  const [open,setOpen]=useState(false)
  const cue = useMotionCue(500)
  useEffect(() => {
    if (!cue.active) return
    const timer = window.setTimeout(() => setOpen(true), 0)
    return () => window.clearTimeout(timer)
  }, [cue.active])
  return <div ref={cue.ref} className="mx-auto max-w-3xl rounded-[28px] border border-[#DCCBBA] bg-[#FFFDFC] p-6 sm:p-8"><div className="flex w-full items-center justify-between gap-5 text-left"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#C8906D]">Safe to Spend</p><p className="mt-2 font-editorial text-4xl text-[#292522]">$680</p><p className="mt-2 text-sm text-[#756A63]">Here is how FlowSight calculated it</p></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE5D8] text-[#BB6C43]"><ChevronDown className={`h-5 w-5 transition-transform duration-700 ${open?'rotate-180':''}`}/></span></div><div className={`grid transition-[grid-template-rows,opacity,margin] duration-700 ${open?'mt-6 grid-rows-[1fr] opacity-100':'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden"><div className="border-t border-[#DCCBBA] pt-5">{[['Opening balance','$4,260'],['Known income','+$2,400'],['Known bills','−$4,980'],['Estimated activity','−$500'],['Lowest projected balance','$1,180'],['Safety buffer','−$500']].map(([label,value],index)=><div key={label} style={{transitionDelay:`${index*90}ms`}} className={`flex justify-between border-b border-[#F3EADF] py-3 text-sm transition-all duration-500 ${open?'translate-y-0 opacity-100':'translate-y-3 opacity-0'}`}><span className="text-[#756A63]">{label}</span><span className="font-mono text-[#292522]">{value}</span></div>)}<div className="mt-4 flex justify-between rounded-xl bg-[#EFE5D8] p-4"><span className="font-medium">Safe to Spend</span><span className="font-mono text-[#BB6C43]">$680</span></div></div></div></div></div>
}

function ProcessDiagram() {
  const [step,setStep]=useState(0)
  const cue = useMotionCue()
  useEffect(() => {
    if (!cue.active) return
    const timer = window.setInterval(() => setStep((current) => (current + 1) % 3), 3000)
    return () => window.clearInterval(timer)
  }, [cue.active])
  const content=[{title:"Bring your numbers",copy:"Import a CSV or enter the essentials manually.",icon:FileSpreadsheet},{title:"Check what we found",copy:"Confirm recurring patterns and review estimates.",icon:Check},{title:"See what’s ahead",copy:"FlowSight places each event on your forecast.",icon:ArrowRight}][step]
  const Icon=content.icon
  return <div ref={cue.ref} className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div className="space-y-2">{["01 · Bring your numbers","02 · Check what we found","03 · See what’s ahead"].map((label,index)=><div key={label} className={`w-full border-l-2 px-5 py-4 text-left transition-all duration-500 ${step===index?'border-[#C8906D] bg-[#F4E8DE] text-[#292522]':'border-[#DCCBBA] text-[#756A63]'}`}>{label}</div>)}</div><div className="relative min-h-[300px] overflow-hidden rounded-[28px] border border-[#DCCBBA] bg-[#FFFDFC] p-7"><span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#C8906D]">Step 0{step+1}</span><div key={step} className="motion-safe:animate-[editorial-rise_.55s_ease-out_both]"><Icon className="mt-8 h-8 w-8 text-[#BB6C43]"/><h3 className="mt-5 font-editorial text-3xl text-[#292522]">{content.title}</h3><p className="mt-2 text-sm text-[#625852]">{content.copy}</p></div><div className="absolute bottom-7 left-7 right-7 flex items-center gap-2">{[0,1,2,3,4].map((n)=><span key={n} className={`h-10 flex-1 rounded-t border border-[#DCCBBA] transition-colors duration-500 ${n<=step+1?'bg-[#BB6C43]':'bg-[#FFFDFC]'}`} style={{height:26+n*8}}/>)}<ArrowRight className="ml-2 h-5 w-5 text-[#C8906D]"/></div></div></div>
}

const faqs=[
  ["Is FlowSight a budgeting app?","No. It forecasts your balance from known and estimated activity without asking you to maintain category budgets."],
  ["Do I need to connect my bank?","No. Start with a CSV or enter your details manually."],
  ["Why are some events estimated?","FlowSight labels variable amounts or uncertain timing instead of presenting them as facts."],
]

export default function FlowSightEditorialSample(){
  const [heroMode,setHeroMode]=useState(0)
  const [mobileOpen,setMobileOpen]=useState(false)
  const [faq,setFaq]=useState<number|null>(null)
  const heroLabel=useMemo(()=>heroModes[heroMode].label,[heroMode])
  useEffect(() => {
    const timer = window.setInterval(() => setHeroMode((current) => (current + 1) % heroModes.length), 4200)
    return () => window.clearInterval(timer)
  }, [])
  return <main className="editorial-sample min-h-screen overflow-hidden bg-[radial-gradient(circle_at_82%_4%,rgba(200,144,109,.10),transparent_25rem),linear-gradient(145deg,#FFFAF4_0%,#F7F2EA_52%,#EFE5D8_100%)] font-sans text-[#292522] [--font-editorial:var(--sample-editorial)] [--font-mono:var(--sample-mono)] [--font-sans:var(--sample-sans)]">
    <style>{`@keyframes editorial-draw{to{stroke-dashoffset:0}} @keyframes editorial-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}} @keyframes number-roll{from{opacity:0;transform:translateY(12px);filter:blur(3px)}to{opacity:1;transform:none;filter:blur(0)}} @keyframes bar-rise{from{opacity:.2;transform:scaleY(.15);transform-origin:bottom}to{opacity:1;transform:scaleY(1);transform-origin:bottom}} @keyframes soft-pulse{0%{transform:scale(.82);opacity:.35}55%{transform:scale(1.18);opacity:1}100%{transform:scale(1);opacity:1}} .font-editorial{font-family:var(--sample-editorial)} .font-mono{font-family:var(--sample-mono)} .font-sans{font-family:var(--sample-sans)} .editorial-sample [data-reveal]{animation:editorial-rise .6s ease-out both} @media(prefers-reduced-motion:reduce){.editorial-sample *{animation:none!important;scroll-behavior:auto!important;transition-duration:0ms!important}}`}</style>
    <nav className="relative z-20 border-b border-[#DCCBBA]/80 bg-[#FFFDFC]/75 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><Link href="/" className="flex items-center gap-2 font-medium"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#BB6C43] text-white">↗</span>FlowSight</Link><div className="hidden items-center gap-7 text-sm text-[#756A63] md:flex"><a href="#aha" className="hover:text-[#BB6C43]">Why it matters</a><a href="#knows" className="hover:text-[#BB6C43]">What it knows</a><a href="#scenario" className="hover:text-[#BB6C43]">Scenarios</a><a href="#security" className="hover:text-[#BB6C43]">Security</a></div><div className="hidden items-center gap-3 md:flex"><Link href="/sign-in" className="px-3 py-2 text-sm text-[#756A63]">Sign in</Link><Link href="/sign-up" className="rounded-lg bg-[#BB6C43] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#965436]">Join beta</Link></div><button type="button" className="md:hidden" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen?<X/>:<Menu/>}</button></div>{mobileOpen&&<div className="border-t border-[#DCCBBA] bg-[#FFFDFC] px-5 py-4 md:hidden"><div className="flex flex-col gap-3 text-sm"><a href="#aha">Why it matters</a><a href="#knows">What it knows</a><a href="#scenario">Scenarios</a><Link href="/sign-up" className="rounded-lg bg-[#BB6C43] px-4 py-2 text-center text-white">Join beta</Link></div></div>}</nav>

    <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-20 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:pt-28"><div data-reveal><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">Cash flow, with context</p><h1 className="mt-5 max-w-xl font-editorial text-5xl font-normal leading-[.98] tracking-[-.025em] sm:text-7xl">Know what your money does next.</h1><p className="mt-7 max-w-lg text-lg leading-relaxed text-[#625852]">FlowSight brings your balance, income, bills, and activity together, finds the days that matter, and gives you time to plan.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/sign-up" className="rounded-lg bg-[#BB6C43] px-5 py-3 text-sm font-medium text-white hover:bg-[#965436]">Build my forecast <ArrowRight className="ml-1 inline h-4 w-4"/></Link><a href="#aha" className="rounded-lg border border-[#DCCBBA] bg-[#FFFDFC] px-5 py-3 text-sm font-medium hover:border-[#C8906D]">See how it works</a></div><p className="mt-4 text-xs text-[#756A63]">CSV or manual setup · no bank connection required</p></div><div data-reveal><HeroPreview mode={heroMode}/><div className="mt-4 flex justify-center gap-2" aria-label="Forecast story progress">{heroModes.map((item,index)=><span key={item.label} className={`h-1.5 rounded-full transition-all duration-700 ${heroMode===index?'w-14 bg-[#BB6C43]':'w-4 bg-[#DCCBBA]'}`}><span className="sr-only">{item.label}</span></span>)}</div><p key={heroLabel} className="mt-2 text-center font-mono text-[10px] uppercase tracking-[.12em] text-[#8A6F60] motion-safe:animate-[editorial-rise_.45s_ease-out_both]">Now showing · {heroLabel}</p></div></section>

    <section id="aha" className="border-y border-[#DCCBBA] bg-[#F7F2EA] px-5 py-24"><div className="mx-auto max-w-6xl"><div className="mb-12 grid gap-5 md:grid-cols-[.7fr_1.3fr] md:items-end"><div><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">Five days of warning</p><h2 className="mt-4 font-editorial text-5xl font-normal">See it before it arrives.</h2></div><p className="max-w-2xl text-lg leading-relaxed text-[#625852]">Your balance drops to $420 on August 3. Rent, insurance, and your car payment all land before your next paycheck.</p></div><AhaDiagram/></div></section>

    <section id="knows" className="px-5 py-24"><div className="mx-auto max-w-6xl"><div className="mx-auto mb-12 max-w-3xl text-center"><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">What FlowSight knows</p><h2 className="mt-4 font-editorial text-5xl font-normal">The work happens quietly.<br/>The assumptions stay visible.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-[#625852]">FlowSight finds recurring patterns, separates confirmed events from estimates, matches transfers, and accounts for credit-card timing.</p></div><KnowledgePanel/></div></section>

    <section className="border-y border-[#DCCBBA] bg-[#EFE5D8]/55 px-5 py-24"><div className="mx-auto max-w-6xl"><div className="mb-12 max-w-2xl"><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">Income patterns</p><h2 className="mt-4 font-editorial text-5xl font-normal">Income doesn’t always arrive on schedule.</h2><p className="mt-5 text-lg text-[#625852]">Regular paychecks, variable invoices, or a mix—FlowSight reflects how your money actually comes in.</p></div><IncomeDiagram/></div></section>

    <section id="scenario" className="px-5 py-24"><div className="mx-auto max-w-6xl"><div className="mb-12 grid gap-5 md:grid-cols-[.75fr_1.25fr] md:items-end"><div><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">Scenario Planner</p><h2 className="mt-4 font-editorial text-5xl font-normal">Try the decision before you make it.</h2></div><p className="max-w-2xl text-lg text-[#625852]">Add a purchase, move a bill, or delay an invoice and see how the change affects what’s ahead.</p></div><ScenarioPanel/></div></section>

    <section className="border-y border-[#DCCBBA] bg-[#F7F2EA] px-5 py-24"><div className="mx-auto max-w-6xl"><div className="mx-auto mb-12 max-w-2xl text-center"><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">Show your work</p><h2 className="mt-4 font-editorial text-5xl font-normal">Every number has a reason.</h2><p className="mt-5 text-lg text-[#625852]">See the balance, upcoming activity, safety buffer, and assumptions behind your forecast.</p></div><ShowWork/></div></section>

    <section className="px-5 py-24"><div className="mx-auto max-w-6xl"><div className="mb-12 max-w-2xl"><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">How it works</p><h2 className="mt-4 font-editorial text-5xl font-normal">A forecast in three simple steps.</h2><p className="mt-5 text-lg text-[#625852]">Bring your numbers, check what FlowSight finds, and see the days ahead.</p></div><ProcessDiagram/></div></section>

    <section id="security" className="border-y border-[#DCCBBA] bg-[#FFFDFC] px-5 py-24"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">Security</p><h2 className="mt-4 font-editorial text-5xl font-normal">Start without sharing your bank login.</h2><p className="mt-5 text-lg text-[#625852]">Import a CSV or enter your details manually. You review what enters the forecast.</p></div><div className="grid gap-4 sm:grid-cols-2">{[[FileSpreadsheet,"Connection-free setup","Start with a CSV or manual entry."],[ShieldCheck,"Review before saving","Nothing enters the forecast without a review."],[CircleHelp,"Transparent calculations","Open a number to see what shaped it."],[CreditCard,"Payments understood","Purchases and card payments are not counted twice."]].map(([Icon,title,copy])=>{const C=Icon as typeof ShieldCheck;return <div key={String(title)} className="rounded-2xl border border-[#DCCBBA] bg-[#FFFDFC] p-5"><C className="h-5 w-5 text-[#BB6C43]"/><h3 className="mt-5 font-medium">{String(title)}</h3><p className="mt-2 text-sm text-[#756A63]">{String(copy)}</p></div>})}</div></div></section>

    <section className="px-5 py-24"><div className="mx-auto max-w-3xl"><div className="mb-10 text-center"><p className="font-mono text-xs uppercase tracking-[.16em] text-[#C8906D]">Common questions</p><h2 className="mt-4 font-editorial text-5xl font-normal">A few things worth knowing.</h2></div><div className="border-y border-[#DCCBBA]">{faqs.map(([q,a],index)=><div key={q} className="border-b border-[#DCCBBA] last:border-b-0"><button type="button" onClick={()=>setFaq(faq===index?null:index)} className="flex w-full items-center justify-between gap-4 py-5 text-left font-medium"><span>{q}</span><ChevronDown className={`h-4 w-4 text-[#BB6C43] transition-transform ${faq===index?'rotate-180':''}`}/></button><div className={`grid transition-[grid-template-rows,opacity] ${faq===index?'grid-rows-[1fr] opacity-100':'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden"><p className="pb-5 pr-10 text-sm leading-relaxed text-[#756A63]">{a}</p></div></div></div>)}</div></div></section>

    <section className="px-5 pb-20"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[#BB6C43] px-6 py-20 text-center text-white"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#C8906D]/35 blur-3xl"/><p className="relative font-mono text-xs uppercase tracking-[.16em] text-[#F1D8C8]">See what’s next</p><h2 className="relative mt-5 font-editorial text-5xl font-normal">Give yourself time to plan.</h2><p className="relative mx-auto mt-5 max-w-xl text-white/70">Bring your numbers. FlowSight will show you the days that matter before they arrive.</p><Link href="/sign-up" className="relative mt-8 inline-flex items-center rounded-lg bg-[#FFFDFC] px-5 py-3 text-sm font-medium text-[#BB6C43]">Join the beta <ArrowRight className="ml-2 h-4 w-4"/></Link></div></section>
    <footer className="border-t border-[#DCCBBA] px-5 py-10"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-[#756A63]"><span className="font-medium text-[#292522]">↗ FlowSight</span><span>Editorial sample · production landing unchanged</span><Link href="/design-sample" className="hover:text-[#BB6C43]">Previous sample</Link></div></footer>
  </main>
}
