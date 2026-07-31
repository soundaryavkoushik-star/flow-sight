"use client"

import { useState } from "react"
import { Building, CreditCard, Pencil, PiggyBank, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createAccount, deleteAccount, updateAccount } from "@/app/app/accounts/actions"

type PaymentStrategy = "full_statement" | "minimum" | "fixed"
interface CardSettings {
  paymentAccountId: string | null
  statementBalanceCents: number
  minimumPaymentCents: number | null
  statementClosingDay: number
  paymentDueDay: number
  paymentStrategy: string
  fixedPaymentCents: number | null
}
export interface ManagedAccount { id: string; name: string; type: string; source: string; balanceCents: number | null; balanceDate: string | null; transactionCount: number; cardSettings: CardSettings | null }
interface PaymentAccount { id: string; name: string }

export function AccountManager({ accounts, paymentAccounts }: { accounts: ManagedAccount[]; paymentAccounts: PaymentAccount[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<ManagedAccount | "new" | null>(null)
  const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
  const sourceLabel = (source: string) => source === "csv" ? "CSV import" : source === "manual" ? "Manual" : source.replaceAll("_", " ")
  return <>
    <div className="flex justify-end mb-5"><Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add account</Button></div>
    {accounts.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><Building className="h-7 w-7 text-primary" /></div><h2 className="text-lg font-semibold">Add the account you use day to day</h2><p className="text-sm text-muted-foreground max-w-sm mt-2 mb-5">Start with checking or savings. Add a credit card afterward so FlowSight can learn how its payments affect cash.</p><Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add your first account</Button></div> : <div className="grid sm:grid-cols-2 gap-4">{accounts.map((account) => <div key={account.id} className="group rounded-2xl border border-border bg-card p-5 transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(15,29,58,0.07)] focus-within:-translate-y-0.5 focus-within:border-primary/30 focus-within:shadow-[0_8px_24px_rgba(15,29,58,0.07)]"><div className="flex items-start justify-between gap-3"><div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center transition-colors duration-200 group-hover:bg-primary/15">{account.type === "credit_card" ? <CreditCard className="h-5 w-5 text-primary" /> : account.type === "savings" ? <PiggyBank className="h-5 w-5 text-primary" /> : <Building className="h-5 w-5 text-primary" />}</div><Button variant="ghost" size="icon" onClick={() => setEditing(account)} aria-label={`Edit ${account.name}`}><Pencil className="h-4 w-4" /></Button></div><h2 className="font-semibold mt-4">{account.name}</h2><p className="text-xs text-muted-foreground capitalize mt-1">{account.type.replace("_", " ")} · {sourceLabel(account.source)}</p><p className="text-[11px] text-muted-foreground/75 mt-1">{account.transactionCount} {account.transactionCount === 1 ? "transaction" : "transactions"}</p><p className="text-2xl font-bold font-mono mt-4">{account.balanceCents === null ? "No balance" : account.type === "credit_card" ? `${money(Math.abs(account.balanceCents))} owed` : money(account.balanceCents)}</p><p className="text-xs text-muted-foreground mt-1">{account.balanceDate ? `Balance as of ${new Date(`${account.balanceDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Add a balance date"}</p>{account.cardSettings ? <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Payment due day {account.cardSettings.paymentDueDay} · estimate improves with card activity</p> : account.type === "credit_card" ? <p className="mt-3 rounded-lg border border-dashed border-[hsl(var(--fs-amber))]/35 bg-[hsl(var(--fs-amber-bg))]/55 px-3 py-2 text-xs text-muted-foreground">Payment estimate pending transaction import</p> : null}</div>)}</div>}
    {editing && <AccountEditor account={editing} paymentAccounts={paymentAccounts} onClose={() => setEditing(null)} onSaved={(saved) => {
      setEditing(null)
      if (saved.isNew) {
        router.push(`/app/transactions?import=1&account=${encodeURIComponent(saved.accountId)}`)
        return
      }
      router.refresh()
    }} />}
  </>
}

function AccountEditor({ account, paymentAccounts, onClose, onSaved }: { account: ManagedAccount | "new"; paymentAccounts: PaymentAccount[]; onClose: () => void; onSaved: (saved: { isNew: boolean; accountId: string }) => void }) {
  const isNew = account === "new"
  const existingAccount = account === "new" ? null : account
  const existingCard = !isNew ? account.cardSettings : null
  const [name, setName] = useState(isNew ? "" : account.name)
  const [type, setType] = useState<"checking" | "savings" | "credit_card">(isNew ? "checking" : account.type === "credit_card" ? "credit_card" : account.type === "savings" ? "savings" : "checking")
  const [balance, setBalance] = useState(isNew || account.balanceCents === null ? "" : String(Math.abs(account.balanceCents) / 100))
  const [balanceDate, setBalanceDate] = useState(isNew || !account.balanceDate ? new Date().toISOString().slice(0, 10) : account.balanceDate)
  const [minimumPayment, setMinimumPayment] = useState(existingCard?.minimumPaymentCents ? String(existingCard.minimumPaymentCents / 100) : "")
  const [closingDay, setClosingDay] = useState(existingCard ? String(existingCard.statementClosingDay) : "")
  const [dueDay, setDueDay] = useState(String(existingCard?.paymentDueDay ?? 15))
  const [strategy, setStrategy] = useState<PaymentStrategy>((existingCard?.paymentStrategy as PaymentStrategy) ?? "full_statement")
  const [fixedPayment, setFixedPayment] = useState(existingCard?.fixedPaymentCents ? String(existingCard.fixedPaymentCents / 100) : "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="account-editor-title"><button className="absolute inset-0 bg-background/75 backdrop-blur-sm" onClick={onClose} aria-label="Close account editor" /><form className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onSubmit={async (event) => {
    event.preventDefault()
    const cents = Math.round(Number(balance) * 100)
    const minimumPaymentCents = minimumPayment ? Math.round(Number(minimumPayment) * 100) : undefined
    const fixedPaymentCents = fixedPayment ? Math.round(Number(fixedPayment) * 100) : undefined
    if (!Number.isSafeInteger(cents)) { setError("Enter a valid current balance."); return }
    setSaving(true)
    setError(null)
    const payload = { name, type, balanceCents: cents, balanceDate, statementBalanceCents: cents, minimumPaymentCents, statementClosingDay: closingDay ? Number(closingDay) : undefined, paymentDueDay: Number(dueDay), paymentStrategy: strategy, fixedPaymentCents }
    const result = isNew ? await createAccount(payload) : await updateAccount({ ...payload, accountId: account.id })
    setSaving(false)
    if (!result.ok) { setError(result.message); return }
    const savedAccountId = "accountId" in result && typeof result.accountId === "string" ? result.accountId : existingAccount!.id
    onSaved({ isNew, accountId: savedAccountId })
  }}>
    <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-primary font-mono mb-1">{isNew ? "New account" : "Account details"}</p><h2 id="account-editor-title" className="text-xl font-bold">{isNew ? "Add an account" : `Edit ${account.name}`}</h2></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button></div>
    <Field label="Account name" value={name} onChange={setName} placeholder={type === "credit_card" ? "Chase Visa" : "Everyday checking"} />
    <div><label htmlFor="account-type" className="text-xs text-muted-foreground block mb-1.5">Account type</label><select id="account-type" value={type} disabled={!isNew} onChange={(event) => setType(event.target.value as typeof type)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"><option value="checking">Checking</option><option value="savings">Savings</option><option value="credit_card" disabled={paymentAccounts.length === 0}>Credit card</option></select>{paymentAccounts.length === 0 && <p className="text-[11px] text-muted-foreground mt-1">Add checking or savings before adding a credit card.</p>}</div>
    <Field label={type === "credit_card" ? "Current card balance owed" : "Current balance"} value={balance} onChange={setBalance} type="number" placeholder="0.00" />
    <Field label="Balance as of" value={balanceDate} onChange={setBalanceDate} type="date" />
    {type === "credit_card" && isNew && <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
      <div><h3 className="font-medium text-sm">Payment timing</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">FlowSight uses your current balance as the first estimate, then refines it from card activity.</p></div>
      <Field label="Payment due day" value={dueDay} onChange={setDueDay} type="number" placeholder="15" min={1} max={31} step="1" />
      <details className="rounded-lg border border-border bg-background">
        <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium hover:bg-muted/40">Statement details (optional)</summary>
        <div className="border-t border-border p-3 space-y-2">
          <Field label="Statement closes (day)" value={closingDay} onChange={setClosingDay} type="number" placeholder="Optional" required={false} min={1} max={31} step="1" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">Your closing day isn’t always visible in transaction history. Adding it helps FlowSight assign purchases to the correct payment cycle. If omitted, FlowSight uses an estimated cycle.</p>
        </div>
      </details>
    </div>}
    {type === "credit_card" && !isNew && existingCard && <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
      <div><h3 className="font-medium text-sm">Card payment timing</h3><p className="text-xs text-muted-foreground mt-1">FlowSight starts with the current balance owed and refines the payment from card activity.</p></div>
      <Field label="Payment due day" value={dueDay} onChange={setDueDay} type="number" placeholder="15" min={1} max={31} step="1" />
      <p className="text-[11px] leading-relaxed text-muted-foreground">Credit card purchases explain what you spent. This payment is when cash actually leaves your account.</p>
      <details className="rounded-lg border border-border bg-background">
        <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium hover:bg-muted/40">Optional payment details</summary>
        <div className="border-t border-border p-3 space-y-3">
          <div><label className="text-xs text-muted-foreground block mb-1.5">How do you usually pay?</label><select value={strategy} onChange={(event) => setStrategy(event.target.value as PaymentStrategy)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="full_statement">Full statement balance</option><option value="minimum">Minimum payment</option><option value="fixed">Fixed amount</option></select></div>
          {strategy === "minimum" && <Field label="Minimum payment" value={minimumPayment} onChange={setMinimumPayment} type="number" placeholder="0.00" />}
          {strategy === "fixed" && <Field label="Fixed payment" value={fixedPayment} onChange={setFixedPayment} type="number" placeholder="0.00" />}
          <Field label="Statement closes (day)" value={closingDay} onChange={setClosingDay} type="number" placeholder="Optional" required={false} min={1} max={31} step="1" />
          <p className="text-[11px] text-muted-foreground">Closing day helps distinguish purchases due this cycle from purchases due next cycle. If omitted, FlowSight uses an estimated cycle.</p>
        </div>
      </details>
    </div>}
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : isNew ? "Add account" : "Save changes"}</Button>
    {!isNew && !existingCard && type === "credit_card" && <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">No payment is included in the forecast yet. Import card transactions so FlowSight can propose one from your history.</div>}
    {!isNew && <div className="border-t border-border pt-4"><Button type="button" variant="outline" className="w-full text-destructive" disabled={saving || account.transactionCount > 0} onClick={async () => { if (!window.confirm(`Remove ${account.name}?`)) return; setSaving(true); const result = await deleteAccount(account.id); setSaving(false); if (!result.ok) { setError(result.message); return } onSaved({ isNew: false, accountId: account.id }) }}>Remove account</Button>{account.transactionCount > 0 && <p className="text-[11px] text-muted-foreground mt-2">Accounts with transaction history can’t be removed because that would break traceability.</p>}</div>}
  </form></div>
}

function Field({ label, value, onChange, type = "text", placeholder, required = true, min, max, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: number; max?: number; step?: string }) {
  const id = `account-${label.toLowerCase().replace(/\s+/g, "-")}`
  return <div><label htmlFor={id} className="text-xs text-muted-foreground block mb-1.5">{label}</label><input id={id} value={value} onChange={(event) => onChange(event.target.value)} type={type} step={step ?? (type === "number" ? "0.01" : undefined)} min={min} max={max} placeholder={placeholder} required={required} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
}
