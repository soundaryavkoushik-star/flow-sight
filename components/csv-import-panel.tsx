"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, FileSpreadsheet, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { confirmRecurringSuggestions, importCsvTransactions, type RecurringConfirmationInput } from "@/app/app/transactions/actions"
import { applyAmountSignConvention, applyTransactionDirection, detectAmountColumns, detectDirectionColumn, findHeader, normalizeDate, parseCsv, parseMoney, suggestRecurring, type CsvDateOrder } from "@/lib/csv/parse"

type AmountMode = "signed" | "split"
type Stage = "choose" | "map" | "review" | "recurring" | "done"

export interface TransactionAccountOption { id: string; name: string; type: string }

export function CsvImportPanel({ autoOpen = false, accounts = [] }: { autoOpen?: boolean; accounts?: TransactionAccountOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(autoOpen)
  const [stage, setStage] = useState<Stage>("choose")
  const [filename, setFilename] = useState("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [dateColumn, setDateColumn] = useState("")
  const [descriptionColumn, setDescriptionColumn] = useState("")
  const [amountMode, setAmountMode] = useState<AmountMode>("signed")
  const [dateOrder, setDateOrder] = useState<CsvDateOrder>("mdy")
  const [amountColumn, setAmountColumn] = useState("")
  const [directionColumn, setDirectionColumn] = useState("")
  const [spendingSign, setSpendingSign] = useState<"negative" | "positive">("negative")
  const [debitColumn, setDebitColumn] = useState("")
  const [creditColumn, setCreditColumn] = useState("")
  const [currentBalance, setCurrentBalance] = useState("")
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [resultText, setResultText] = useState("")
  const [suggestions, setSuggestions] = useState<Array<RecurringConfirmationInput & { id: string }>>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())
  const [accountChoice, setAccountChoice] = useState(accounts[0]?.id ?? "new")
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountType, setNewAccountType] = useState<"checking" | "savings">("checking")

  const normalized = useMemo(() => rawRows.map((row, index) => {
    const date = normalizeDate(row[Number(dateColumn)] ?? "", dateOrder)
    const description = (row[Number(descriptionColumn)] ?? "").trim()
    const parsedSigned = amountMode === "signed" ? parseMoney(row[Number(amountColumn)] ?? "") : null
    const detectedDirection = amountMode === "signed" && directionColumn ? applyTransactionDirection(parsedSigned, row[Number(directionColumn)] ?? "") : null
    const signed = detectedDirection ?? applyAmountSignConvention(parsedSigned, spendingSign)
    const debit = amountMode === "split" ? parseMoney(row[Number(debitColumn)] ?? "") ?? 0 : 0
    const credit = amountMode === "split" ? parseMoney(row[Number(creditColumn)] ?? "") ?? 0 : 0
    const amountCents = amountMode === "signed" ? signed : Math.abs(credit) - Math.abs(debit)
    const valid = Boolean(date && description && amountCents && Number.isSafeInteger(amountCents))
    return { index: index + 2, date, description, amountCents, valid }
  }), [rawRows, dateColumn, descriptionColumn, amountMode, amountColumn, debitColumn, creditColumn, directionColumn, dateOrder, spendingSign])
  const validRows = normalized.filter((row): row is typeof row & { date: string; amountCents: number } => row.valid && Boolean(row.date) && row.amountCents !== null)
  const invalidRows = normalized.filter((row) => !row.valid)
  const spendingRows = validRows.filter((row) => row.amountCents < 0).length
  const incomeRows = validRows.filter((row) => row.amountCents > 0).length

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  function close() {
    setOpen(false)
    setStage("choose")
    setError(null)
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Upload className="h-4 w-4" /> Import CSV</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import CSV">
          <button className="absolute inset-0 bg-background/75 backdrop-blur-sm" onClick={close} aria-label="Close CSV import" />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.14em] text-primary font-mono mb-1">Connection-free import</p><h2 className="text-2xl font-bold">Import a CSV</h2></div><Button variant="ghost" size="icon" onClick={close} aria-label="Close CSV import"><X className="h-4 w-4" /></Button></div>

            {stage === "choose" && <div className="space-y-5"><AccountChoice accounts={accounts} value={accountChoice} onChange={setAccountChoice} newAccountName={newAccountName} setNewAccountName={setNewAccountName} newAccountType={newAccountType} setNewAccountType={setNewAccountType} /><div className="border border-dashed border-primary/30 bg-primary/[0.04] rounded-2xl p-10 text-center"><FileSpreadsheet className="h-10 w-10 text-primary mx-auto mb-4" /><h3 className="font-semibold mb-2">Choose a transaction file</h3><p className="text-sm text-muted-foreground mb-5">Your CSV stays connection-free. You’ll review the columns and transactions before anything is saved.</p><input type="file" accept=".csv,text/csv" className="block mx-auto text-sm" disabled={accountChoice === "new" && !newAccountName.trim()} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setError(null); try { const parsed = parseCsv(await file.text()); setFilename(file.name); setHeaders(parsed.headers); setRawRows(parsed.rows); setDateColumn(findHeader(parsed.headers, ["date", "posted"])); setDescriptionColumn(findHeader(parsed.headers, ["description", "merchant", "memo", "name"])); const amountColumns = detectAmountColumns(parsed.headers); setAmountColumn(amountColumns.signed); setDebitColumn(amountColumns.debit); setCreditColumn(amountColumns.credit); setDirectionColumn(detectDirectionColumn(parsed.headers)); setAmountMode(amountColumns.mode); setStage("map") } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn’t read that CSV.") } }} />{accountChoice === "new" && !newAccountName.trim() && <p className="text-xs text-muted-foreground mt-3">Name the account before choosing a file.</p>}</div>{error && <p className="text-sm text-destructive">{error}</p>}</div>}

            {stage === "map" && <div className="space-y-5"><div><h3 className="font-semibold">Match your columns</h3><p className="text-sm text-muted-foreground mt-1">Banks label CSV columns differently. Confirm where each value belongs.</p></div><div className="grid sm:grid-cols-2 gap-4"><ColumnSelect label="Transaction date" value={dateColumn} onChange={setDateColumn} headers={headers} /><ColumnSelect label="Description" value={descriptionColumn} onChange={setDescriptionColumn} headers={headers} /></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="text-xs text-muted-foreground block mb-1.5">Date format</label><select value={dateOrder} onChange={(event) => setDateOrder(event.target.value as CsvDateOrder)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="mdy">Month / day / year</option><option value="dmy">Day / month / year</option></select></div><div><label className="text-xs text-muted-foreground block mb-1.5">Amount format</label><select value={amountMode} onChange={(event) => setAmountMode(event.target.value as AmountMode)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="signed">One amount column</option><option value="split">Separate debit and credit columns</option></select><p className="text-[11px] text-muted-foreground mt-1.5">{amountMode === "signed" ? "Use this when money in and money out share one Amount column." : "Use this only when money out and money in are in different columns."}</p></div></div>{amountMode === "signed" ? <div className="grid sm:grid-cols-2 gap-4"><ColumnSelect label="Amount" value={amountColumn} onChange={setAmountColumn} headers={headers} /><div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="csv-spending-sign">How does this file show spending?</label><select id="csv-spending-sign" value={spendingSign} onChange={(event) => setSpendingSign(event.target.value as "negative" | "positive")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="negative">As negative amounts (−$25.00)</option><option value="positive">As positive amounts ($25.00)</option></select><p className="text-[11px] text-muted-foreground mt-1.5">Check a purchase in your file if you’re unsure.</p></div></div> : <div className="grid sm:grid-cols-2 gap-4"><ColumnSelect label="Debit / money out" value={debitColumn} onChange={setDebitColumn} headers={headers} /><ColumnSelect label="Credit / money in" value={creditColumn} onChange={setCreditColumn} headers={headers} /></div>}<div className="flex justify-between"><Button variant="outline" onClick={() => setStage("choose")}>Back</Button><Button disabled={!dateColumn || !descriptionColumn || (amountMode === "signed" ? !amountColumn : !debitColumn && !creditColumn)} onClick={() => setStage("review")}>Review transactions</Button></div></div>}

            {stage === "review" && <div className="space-y-5"><div><h3 className="font-semibold">Check what we found</h3><p className="text-sm text-muted-foreground mt-1">{validRows.length} valid transactions · {spendingRows} spending · {incomeRows} income · {invalidRows.length} rows need attention · importing to <span className="text-foreground">{accountChoice === "new" ? newAccountName : accounts.find((account) => account.id === accountChoice)?.name}</span></p></div><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Description</th><th className="text-left px-3 py-2">Type</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">Row</th></tr></thead><tbody>{normalized.slice(0, 12).map((row) => <tr key={row.index} className="border-t border-border"><td className="px-3 py-2">{row.date ?? "Invalid date"}</td><td className="px-3 py-2">{row.description || "Missing"}</td><td className="px-3 py-2 text-muted-foreground">{row.amountCents == null ? "—" : row.amountCents < 0 ? "Spending" : "Income"}</td><td className="px-3 py-2 text-right font-mono">{row.amountCents == null ? "Invalid" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.amountCents / 100)}</td><td className={`px-3 py-2 text-right ${row.valid ? "text-primary" : "text-destructive"}`}>{row.valid ? "Ready" : row.index}</td></tr>)}</tbody></table></div>{invalidRows.length > 0 && <p className="text-xs text-muted-foreground">Invalid rows will not be imported. Return to mapping if the selected columns are incorrect.</p>}<div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="current-balance" className="text-xs text-muted-foreground block mb-1.5">Current balance <span className="text-foreground">(required)</span></label><input id="current-balance" value={currentBalance} onChange={(event) => { setCurrentBalance(event.target.value); setError(null) }} type="number" step="0.01" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="Enter your current balance" aria-describedby="current-balance-help" /><p id="current-balance-help" className="text-[11px] text-muted-foreground mt-1.5">This anchors the forecast to what is in the account now.</p></div><div><label htmlFor="balance-date" className="text-xs text-muted-foreground block mb-1.5">Balance as of</label><input id="balance-date" value={balanceDate} onChange={(event) => setBalanceDate(event.target.value)} type="date" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<div className="flex justify-between"><Button variant="outline" onClick={() => setStage("map")}>Fix mapping</Button><Button disabled={working || validRows.length === 0} onClick={async () => { const balance = Number(currentBalance); if (currentBalance.trim() === "" || !Number.isFinite(balance)) { setError("Enter your current balance so we can anchor the forecast."); document.getElementById("current-balance")?.focus(); return } setWorking(true); setError(null); const rows = validRows.map((row) => ({ date: row.date, description: row.description, amountCents: row.amountCents })); const result = await importCsvTransactions({ filename, rows, currentBalanceCents: Math.round(balance * 100), balanceDate, accountId: accountChoice === "new" ? undefined : accountChoice, newAccountName: accountChoice === "new" ? newAccountName : undefined, newAccountType: accountChoice === "new" ? newAccountType : undefined }); setWorking(false); if (!result.ok) { setError(result.message); return } setResultText(`${result.imported} imported · ${result.duplicates} duplicates skipped`); const found = suggestRecurring(rows, result.accountId); setSuggestions(found); setSelectedSuggestions(new Set(found.map((item) => item.id))); setStage(found.length > 0 ? "recurring" : "done"); router.refresh() }}>{working ? "Importing…" : `Import ${validRows.length} transactions`}</Button></div></div>}

            {stage === "recurring" && <div className="space-y-5"><div><CheckCircle className="h-9 w-9 text-primary mb-3" /><h3 className="text-xl font-semibold">Transactions imported</h3><p className="text-sm text-muted-foreground mt-1">{resultText}. Review the possible recurring activity below before it enters your forecast.</p></div><div className="space-y-2">{suggestions.map((item) => <label key={item.id} className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer"><input type="checkbox" checked={selectedSuggestions.has(item.id)} onChange={(event) => setSelectedSuggestions((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next })} className="mt-1" /><div className="flex-1"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground mt-1 capitalize">{item.frequency} · {item.amountCents >= 0 ? "Income" : "Bill"} · {item.occurrenceCount} occurrences · {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.minAmountCents / 100)}–{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.maxAmountCents / 100)} · next estimated {item.nextExpected}</p></div><span className="font-mono text-sm">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amountCents / 100)}</span></label>)}</div>{error && <p className="text-sm text-destructive">{error}</p>}<div className="flex justify-between"><Button variant="outline" onClick={() => setStage("done")}>Skip for now</Button><Button disabled={working} onClick={async () => { setWorking(true); const result = await confirmRecurringSuggestions(suggestions.filter((item) => selectedSuggestions.has(item.id))); setWorking(false); if (!result.ok) { setError(result.message); return } setStage("done"); router.refresh() }}>{working ? "Saving…" : `Confirm ${selectedSuggestions.size} recurring`}</Button></div></div>}

            {stage === "done" && <div className="py-8 text-center"><CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" /><h3 className="text-xl font-semibold">Your transactions are ready</h3><p className="text-sm text-muted-foreground mt-2 mb-2">{resultText || "Your transactions are ready."}</p><p className="text-sm text-muted-foreground mb-6">{suggestions.length === 0 ? "We didn’t find a reliable recurring pattern this time. We’ll check again after your next import." : "You can return to Transactions to review recurring activity at any time."}</p><Button onClick={() => { close(); if (autoOpen) router.push("/app/dashboard") }}>{autoOpen ? "View dashboard" : "Done"}</Button></div>}
          </div>
        </div>
      )}
    </>
  )
}

function ColumnSelect({ label, value, onChange, headers }: { label: string; value: string; onChange: (value: string) => void; headers: string[] }) {
  return <div><label className="text-xs text-muted-foreground block mb-1.5">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Choose a column</option>{headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header || `Column ${index + 1}`}</option>)}</select></div>
}

function AccountChoice({ accounts, value, onChange, newAccountName, setNewAccountName, newAccountType, setNewAccountType }: { accounts: TransactionAccountOption[]; value: string; onChange: (value: string) => void; newAccountName: string; setNewAccountName: (value: string) => void; newAccountType: "checking" | "savings"; setNewAccountType: (value: "checking" | "savings") => void }) {
  return <div className="rounded-xl border border-border p-4 space-y-3"><div><label htmlFor="csv-account" className="text-sm font-medium">Which account is this file from?</label><p className="text-xs text-muted-foreground mt-1">Transactions and the current balance will be saved to this account.</p></div><select id="csv-account" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.type.replace("_", " ")}</option>)}<option value="new">Create a new account</option></select>{value === "new" && <div className="grid sm:grid-cols-2 gap-3"><div><label htmlFor="csv-new-account-name" className="text-xs text-muted-foreground block mb-1.5">Account name</label><input id="csv-new-account-name" value={newAccountName} onChange={(event) => setNewAccountName(event.target.value)} placeholder="Everyday checking" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div><div><label htmlFor="csv-new-account-type" className="text-xs text-muted-foreground block mb-1.5">Account type</label><select id="csv-new-account-type" value={newAccountType} onChange={(event) => setNewAccountType(event.target.value as "checking" | "savings")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="checking">Checking</option><option value="savings">Savings</option></select></div></div>}</div>
}
