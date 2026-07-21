"use client"

import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createManualTransaction } from "@/app/app/transactions/actions"
import type { TransactionAccountOption } from "@/components/csv-import-panel"

export function ManualTransactionPanel({ accounts, variant = "default" }: { accounts: TransactionAccountOption[]; variant?: "default" | "outline" }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [accountChoice, setAccountChoice] = useState(accounts[0]?.id ?? "new")
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountType, setNewAccountType] = useState<"checking" | "savings">("checking")
  const [newAccountBalance, setNewAccountBalance] = useState("")
  const [newAccountBalanceDate, setNewAccountBalanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<"expense" | "income">("expense")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown) }
  }, [open])

  return <><Button size="sm" variant={variant} onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add transaction</Button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="manual-transaction-title"><button className="absolute inset-0 bg-background/75 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close manual transaction" /><form className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto" onSubmit={async (event) => { event.preventDefault(); const numericAmount = Number(amount); const numericBalance = Number(newAccountBalance); if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError("Enter an amount greater than zero."); return } if (accountChoice === "new" && (!newAccountName.trim() || newAccountBalance.trim() === "" || !Number.isFinite(numericBalance))) { setError("Name the new account and add its current balance."); return } setSaving(true); setError(null); const result = await createManualTransaction({ accountId: accountChoice === "new" ? undefined : accountChoice, newAccountName: accountChoice === "new" ? newAccountName : undefined, newAccountType: accountChoice === "new" ? newAccountType : undefined, newAccountBalanceCents: accountChoice === "new" ? Math.round(numericBalance * 100) : undefined, newAccountBalanceDate: accountChoice === "new" ? newAccountBalanceDate : undefined, date, description, amountCents: Math.round(numericAmount * 100) * (type === "expense" ? -1 : 1) }); setSaving(false); if (!result.ok) { setError(result.message); return } setOpen(false); router.refresh() }}><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-primary font-mono mb-1">Manual entry</p><h2 id="manual-transaction-title" className="text-xl font-bold">Add a transaction</h2></div><Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></Button></div><div><label htmlFor="manual-account" className="text-xs text-muted-foreground block mb-1.5">Account</label><select id="manual-account" value={accountChoice} onChange={(event) => setAccountChoice(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.type.replace("_", " ")}</option>)}<option value="new">Create a new account</option></select></div>{accountChoice === "new" && <div className="grid sm:grid-cols-2 gap-3"><Field label="Account name" value={newAccountName} onChange={setNewAccountName} placeholder="Everyday checking" /><div><label htmlFor="manual-account-type" className="text-xs text-muted-foreground block mb-1.5">Account type</label><select id="manual-account-type" value={newAccountType} onChange={(event) => setNewAccountType(event.target.value as "checking" | "savings")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="checking">Checking</option><option value="savings">Savings</option></select></div><Field label="Current balance" value={newAccountBalance} onChange={setNewAccountBalance} type="number" placeholder="0.00" /><Field label="Balance as of" value={newAccountBalanceDate} onChange={setNewAccountBalanceDate} type="date" /></div>}<div className="grid sm:grid-cols-2 gap-3"><Field label="Date" value={date} onChange={setDate} type="date" /><div><label htmlFor="manual-type" className="text-xs text-muted-foreground block mb-1.5">Type</label><select id="manual-type" value={type} onChange={(event) => setType(event.target.value as "expense" | "income")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="expense">Expense</option><option value="income">Income</option></select></div></div><Field label="Description" value={description} onChange={setDescription} placeholder="Rent, paycheck, groceries…" /><Field label="Amount" value={amount} onChange={setAmount} type="number" placeholder="0.00" />{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Save transaction"}</Button></form></div>}</>
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  const id = `manual-${label.toLowerCase().replace(/\s+/g, "-")}`
  return <div><label htmlFor={id} className="text-xs text-muted-foreground block mb-1.5">{label}</label><input id={id} value={value} onChange={(event) => onChange(event.target.value)} type={type} step={type === "number" ? "0.01" : undefined} placeholder={placeholder} required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
}
