const mono = { fontFamily: "'DM Mono', monospace" }

export function ForecastMathIllustration() {
  return <figure className="rounded-3xl border border-[#E7DDD1] bg-[#F8F5EE] p-5" aria-labelledby="forecast-math-caption"><div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]"><Metric label="Opening balance" value="$4,200" /><Operator>+</Operator><Metric label="Income and bills" value="−$1,180" /><Operator>=</Operator><Metric label="Projected low" value="$3,020" accent /></div><div className="mt-5 flex h-20 items-end gap-1.5" aria-hidden="true">{[72,68,64,58,48,40,34,52,49,46,42,38].map((height,index)=><span key={index} className={`flex-1 rounded-t ${index===6?"bg-[#D4754A]":"bg-[#CCD5E2]"}`} style={{height:`${height}%`}} />)}</div><figcaption id="forecast-math-caption" className="mt-3 text-xs text-[#6B7280]">FlowSight applies each known or estimated event on its expected day, then carries the balance forward.</figcaption></figure>
}

export function SafeToSpendIllustration() {
  return <figure className="rounded-3xl border border-[#E7DDD1] bg-white p-5 shadow-[0_12px_36px_rgba(15,29,58,0.06)]" aria-labelledby="safe-caption"><div className="space-y-3"><Row label="Lowest projected balance" value="$1,901" /><Row label="Protected safety buffer" value="−$1,000" muted /><div className="border-t border-[#E7DDD1] pt-3"><Row label="Safe to Spend" value="$901" accent /></div></div><figcaption id="safe-caption" className="mt-4 rounded-xl bg-[#F8F5EE] p-3 text-xs text-[#6B7280]">The calculation uses the lowest point in the forecast—not just today’s balance.</figcaption></figure>
}

export function CardFlowIllustration() {
  return <figure className="rounded-3xl border border-[#E7DDD1] bg-[#F8F5EE] p-5" aria-labelledby="card-caption"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Card purchases" value="$720" /><div className="flex items-center justify-center font-mono text-[#D4754A]">→</div><Metric label="Checking payment" value="Aug 15" accent /></div><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-white p-4 text-sm"><span>Checking −$720</span><span className="text-[#D4754A]">↔</span><span className="text-right">Card +$720</span></div><figcaption id="card-caption" className="mt-3 text-xs text-[#6B7280]">Purchases explain what you spent. The linked payment explains when cash moves.</figcaption></figure>
}

export function CsvIllustration() {
  return <figure className="overflow-hidden rounded-3xl border border-[#E7DDD1] bg-white" aria-labelledby="csv-caption"><div className="grid grid-cols-[0.8fr_1.5fr_0.7fr] bg-[#F8F5EE] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#6B7280]"><span>Date</span><span>Description</span><span className="text-right">Amount</span></div>{[["07/05","NETFLIX.COM","−$17.99"],["07/12","PAYROLL","+$1,950"],["07/15","CARD PAYMENT","−$720"]].map(row=><div key={row[1]} className="grid grid-cols-[0.8fr_1.5fr_0.7fr] border-t border-[#E7DDD1] px-4 py-3 text-sm"><span>{row[0]}</span><span>{row[1]}</span><span className="text-right font-mono">{row[2]}</span></div>)}<figcaption id="csv-caption" className="border-t border-[#E7DDD1] px-4 py-3 text-xs text-[#6B7280]">Date, description, and either a signed amount or separate debit and credit columns.</figcaption></figure>
}

export function TroubleshootingIllustration() {
  const items=[["Balance","Updated 12 days ago","Update needed"],["Recurring items","2 estimates","Review"],["Card payment","Source not matched","Check accounts"]]
  return <figure className="rounded-3xl border border-[#E7DDD1] bg-[#F8F5EE] p-4" aria-labelledby="trouble-caption"><div className="space-y-2">{items.map(([label,detail,action])=><div key={label} className="grid gap-1 rounded-xl bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><span className="font-medium text-[#0F1D3A]">{label}</span><span className="text-xs text-[#6B7280]">{detail}</span><span className="text-xs font-medium text-[#D4754A]">{action}</span></div>)}</div><figcaption id="trouble-caption" className="mt-3 px-1 text-xs text-[#6B7280]">Start with freshness, then check missing activity and account-to-account movements.</figcaption></figure>
}

function Metric({label,value,accent=false}:{label:string;value:string;accent?:boolean}) { return <div className="rounded-xl bg-white p-4"><p className="text-[11px] text-[#6B7280]">{label}</p><p className={`mt-2 text-lg font-medium ${accent?"text-[#D4754A]":"text-[#0F1D3A]"}`} style={mono}>{value}</p></div> }
function Operator({children}:{children:React.ReactNode}) { return <span className="flex items-center justify-center font-mono text-[#6B7280]">{children}</span> }
function Row({label,value,accent=false,muted=false}:{label:string;value:string;accent?:boolean;muted?:boolean}) { return <div className="flex items-center justify-between gap-4"><span className={muted?"text-[#6B7280]":"text-[#374151]"}>{label}</span><span className={accent?"font-mono font-medium text-[#D4754A]":"font-mono text-[#0F1D3A]"}>{value}</span></div> }
