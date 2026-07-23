"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, FileSpreadsheet, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { confirmRecurringSuggestions, importCsvTransactions, undoRecurringReconciliation, type RecurringConfirmationInput } from "@/app/app/transactions/actions"
import { saveIncomePattern } from "@/app/app/onboarding/actions"
import { applyAmountSignConvention, applyTransactionDirection, detectAmountColumns, detectDirectionColumn, findHeader, normalizeDate, parseCsv, parseMoney, suggestRecurring, type CsvDateOrder } from "@/lib/csv/parse"
import { reconcileRecurringSuggestions, type ExistingRecurringItem } from "@/lib/csv/reconcile"

type AmountMode = "signed" | "split"
type Stage = "choose" | "assist" | "map" | "review" | "recurring" | "income-pattern" | "done"

export interface TransactionAccountOption { id: string; name: string; type: string; anchorBalanceCents?: number | null; anchorDate?: string | null }

export function CsvImportPanel({ autoOpen = false, accounts = [], existingRecurring = [], incomePatternEstablished = false }: { autoOpen?: boolean; accounts?: TransactionAccountOption[]; existingRecurring?: ExistingRecurringItem[]; incomePatternEstablished?: boolean }) {
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
  const [currentBalance, setCurrentBalance] = useState(() => accounts[0]?.anchorBalanceCents !== null && accounts[0]?.anchorBalanceCents !== undefined ? (accounts[0].anchorBalanceCents / 100).toFixed(2) : "")
  const [balanceDate, setBalanceDate] = useState(() => accounts[0]?.anchorDate ?? new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [resultText, setResultText] = useState("")
  const [suggestions, setSuggestions] = useState<Array<RecurringConfirmationInput & { id: string }>>([])
  const [reconciliationChoices, setReconciliationChoices] = useState<Record<string, "keep" | "replace" | "add">>({})
  const [accountChoice, setAccountChoice] = useState(accounts[0]?.id ?? "new")
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountType, setNewAccountType] = useState<"checking" | "savings">("checking")
  const [confirmedRegularIncome, setConfirmedRegularIncome] = useState(false)
  const [incomePattern, setIncomePattern] = useState<"regular" | "variable" | "mixed" | null>(null)
  const [reconciliationIds, setReconciliationIds] = useState<string[]>([])
  const [needsDirectionHelp, setNeedsDirectionHelp] = useState(false)
  const [showInvalidRows, setShowInvalidRows] = useState(false)
  const [showIncludedPatterns, setShowIncludedPatterns] = useState(false)
  const timezoneRef = useRef("UTC")

  useEffect(() => { timezoneRef.current = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" }, [])
  const normalized = useMemo(() => rawRows.map((row, index) => {
    const rawDate = row[Number(dateColumn)] ?? ""
    const rawDescription = row[Number(descriptionColumn)] ?? ""
    const rawAmount = amountMode === "signed" ? row[Number(amountColumn)] ?? "" : `${row[Number(debitColumn)] ?? ""} / ${row[Number(creditColumn)] ?? ""}`
    const date = normalizeDate(rawDate, dateOrder)
    const description = rawDescription.trim()
    const parsedSigned = amountMode === "signed" ? parseMoney(rawAmount) : null
    const detectedDirection = amountMode === "signed" && directionColumn ? applyTransactionDirection(parsedSigned, row[Number(directionColumn)] ?? "") : null
    const signed = detectedDirection ?? applyAmountSignConvention(parsedSigned, spendingSign)
    const debit = amountMode === "split" ? parseMoney(row[Number(debitColumn)] ?? "") ?? 0 : 0
    const credit = amountMode === "split" ? parseMoney(row[Number(creditColumn)] ?? "") ?? 0 : 0
    const amountCents = amountMode === "signed" ? signed : Math.abs(credit) - Math.abs(debit)
    const valid = Boolean(date && description && amountCents && Number.isSafeInteger(amountCents))
    const reasons = [!date ? "Invalid or missing date" : null, !description ? "Missing description" : null, !amountCents || !Number.isSafeInteger(amountCents) ? "Invalid, missing, or zero amount" : null].filter((reason): reason is string => Boolean(reason))
    return { index: index + 2, date, description, amountCents, valid, rawDate, rawDescription, rawAmount, reasons }
  }), [rawRows, dateColumn, descriptionColumn, amountMode, amountColumn, debitColumn, creditColumn, directionColumn, dateOrder, spendingSign])
  const validRows = normalized.filter((row): row is typeof row & { date: string; amountCents: number } => row.valid && Boolean(row.date) && row.amountCents !== null)
  const invalidRows = normalized.filter((row) => !row.valid)
  const spendingRows = validRows.filter((row) => row.amountCents < 0).length
  const incomeRows = validRows.filter((row) => row.amountCents > 0).length
  const dateRange = validRows.length > 0
    ? [validRows.map((row) => row.date).sort()[0], validRows.map((row) => row.date).sort().at(-1)!].map((date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })).join(" – ")
    : ""
  const reconciliationGroups = useMemo(() => reconcileRecurringSuggestions(suggestions, existingRecurring), [suggestions, existingRecurring])
  const needsReviewGroups = reconciliationGroups.filter((group) => group.status === "needs_review")
  const newPatternGroups = reconciliationGroups.filter((group) => group.status === "new")
  const includedGroups = reconciliationGroups.filter((group) => group.status === "already_included")
  const selectedAccount = accounts.find((account) => account.id === accountChoice)
  const needsBalance = accountChoice === "new" || selectedAccount?.anchorBalanceCents === null || selectedAccount?.anchorBalanceCents === undefined
  const selectedBalanceAgeDays = selectedAccount?.anchorDate
    ? Math.max(0, Math.floor((Date.now() - new Date(`${selectedAccount.anchorDate}T00:00:00`).getTime()) / 86_400_000))
    : null

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
    setIncomePattern(null)
    setConfirmedRegularIncome(false)
    setReconciliationChoices({})
    setReconciliationIds([])
    setError(null)
  }

  function selectAccount(value: string) {
    setAccountChoice(value)
    const account = accounts.find((item) => item.id === value)
    setCurrentBalance(account?.anchorBalanceCents !== null && account?.anchorBalanceCents !== undefined ? (account.anchorBalanceCents / 100).toFixed(2) : "")
    setBalanceDate(account?.anchorDate ?? new Date().toISOString().slice(0, 10))
  }

  async function chooseFile(file: File) {
    setError(null)
    try {
      const parsed = parseCsv(await file.text())
      const detectedDate = findHeader(parsed.headers, ["date", "posted"])
      const detectedDescription = findHeader(parsed.headers, ["description", "merchant", "memo", "name"])
      const detectedAmounts = detectAmountColumns(parsed.headers)
      const detectedDirection = detectDirectionColumn(parsed.headers)
      const signedValues = detectedAmounts.signed === "" ? [] : parsed.rows
        .map((row) => parseMoney(row[Number(detectedAmounts.signed)] ?? ""))
        .filter((value): value is number => value !== null && value !== 0)
      const ambiguousDirection = detectedAmounts.mode === "signed"
        && detectedDirection === ""
        && signedValues.length > 0
        && signedValues.every((value) => value > 0)

      setFilename(file.name)
      setHeaders(parsed.headers)
      setRawRows(parsed.rows)
      setDateColumn(detectedDate)
      setDescriptionColumn(detectedDescription)
      setAmountColumn(detectedAmounts.signed)
      setDebitColumn(detectedAmounts.debit)
      setCreditColumn(detectedAmounts.credit)
      setDirectionColumn(detectedDirection)
      setAmountMode(detectedAmounts.mode)
      setNeedsDirectionHelp(ambiguousDirection)
      const missingRequired = detectedDate === ""
        || detectedDescription === ""
        || (detectedAmounts.mode === "signed" ? detectedAmounts.signed === "" : detectedAmounts.debit === "" && detectedAmounts.credit === "")
      setStage(missingRequired || ambiguousDirection ? "assist" : "review")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t read that CSV.")
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Upload className="h-4 w-4" /> Import CSV</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import CSV">
          <button className="absolute inset-0 bg-background/75 backdrop-blur-sm" onClick={close} aria-label="Close CSV import" />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.14em] text-primary font-mono mb-1">Connection-free import</p><h2 className="text-2xl font-bold">Import a CSV</h2></div><Button variant="ghost" size="icon" onClick={close} aria-label="Close CSV import"><X className="h-4 w-4" /></Button></div>

            {stage === "choose" && <div className="space-y-5"><div className="border border-dashed border-primary/30 bg-primary/[0.04] rounded-2xl p-10 text-center" onDragOver={(event) => event.preventDefault()} onDrop={async (event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) await chooseFile(file) }}><FileSpreadsheet className="h-10 w-10 text-primary mx-auto mb-4" /><h3 className="font-semibold mb-2">Drop your transaction file here</h3><p className="text-sm text-muted-foreground mb-5">FlowSight will identify the columns and show you what it found before anything is saved.</p><input type="file" accept=".csv,text/csv" className="block mx-auto text-sm" onChange={async (event) => { const file = event.target.files?.[0]; if (file) await chooseFile(file) }} /></div>{error && <p className="text-sm text-destructive">{error}</p>}</div>}

            {stage === "assist" && <div className="space-y-5"><div><p className="text-xs uppercase tracking-[0.14em] text-primary font-mono mb-1">One quick check</p><h3 className="font-semibold">We need your help with {[
              dateColumn === "" ? "the date column" : null,
              descriptionColumn === "" ? "the description column" : null,
              amountMode === "signed" && amountColumn === "" ? "the amount column" : null,
              amountMode === "split" && debitColumn === "" && creditColumn === "" ? "the debit and credit columns" : null,
              needsDirectionHelp ? "how spending is shown" : null,
            ].filter(Boolean).join(" and ")}.</h3><p className="text-sm text-muted-foreground mt-1">Everything else was detected automatically.</p></div>
              <div className="grid sm:grid-cols-2 gap-4">{dateColumn === "" && <ColumnSelect label="Which column contains the transaction date?" value={dateColumn} onChange={setDateColumn} headers={headers} />}{descriptionColumn === "" && <ColumnSelect label="Which column describes the transaction?" value={descriptionColumn} onChange={setDescriptionColumn} headers={headers} />}{amountMode === "signed" && amountColumn === "" && <ColumnSelect label="Which column contains the amount?" value={amountColumn} onChange={setAmountColumn} headers={headers} />}{amountMode === "split" && debitColumn === "" && creditColumn === "" && <><ColumnSelect label="Debit / money out" value={debitColumn} onChange={setDebitColumn} headers={headers} /><ColumnSelect label="Credit / money in" value={creditColumn} onChange={setCreditColumn} headers={headers} /></>}</div>
              {needsDirectionHelp && <div><label className="text-sm font-medium block mb-2" htmlFor="csv-auto-spending-sign">In this file, a purchase such as groceries appears as:</label><select id="csv-auto-spending-sign" value={spendingSign} onChange={(event) => setSpendingSign(event.target.value as "negative" | "positive")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="positive">A positive amount ($25.00)</option><option value="negative">A negative amount (−$25.00)</option></select></div>}
              <div className="flex justify-between"><Button variant="outline" onClick={() => setStage("choose")}>Choose another file</Button><Button disabled={dateColumn === "" || descriptionColumn === "" || (amountMode === "signed" ? amountColumn === "" : debitColumn === "" && creditColumn === "")} onClick={() => setStage("review")}>Show preview</Button></div>
            </div>}

            {stage === "map" && <div className="space-y-5"><div><h3 className="font-semibold">Match your columns</h3><p className="text-sm text-muted-foreground mt-1">Banks label CSV columns differently. Confirm where each value belongs.</p></div><div className="grid sm:grid-cols-2 gap-4"><ColumnSelect label="Transaction date" value={dateColumn} onChange={setDateColumn} headers={headers} /><ColumnSelect label="Description" value={descriptionColumn} onChange={setDescriptionColumn} headers={headers} /></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="text-xs text-muted-foreground block mb-1.5">Date format</label><select value={dateOrder} onChange={(event) => setDateOrder(event.target.value as CsvDateOrder)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="mdy">Month / day / year</option><option value="dmy">Day / month / year</option></select></div><div><label className="text-xs text-muted-foreground block mb-1.5">Amount format</label><select value={amountMode} onChange={(event) => setAmountMode(event.target.value as AmountMode)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="signed">One amount column</option><option value="split">Separate debit and credit columns</option></select><p className="text-[11px] text-muted-foreground mt-1.5">{amountMode === "signed" ? "Use this when money in and money out share one Amount column." : "Use this only when money out and money in are in different columns."}</p></div></div>{amountMode === "signed" ? <div className="grid sm:grid-cols-2 gap-4"><ColumnSelect label="Amount" value={amountColumn} onChange={setAmountColumn} headers={headers} /><div><label className="text-xs text-muted-foreground block mb-1.5" htmlFor="csv-spending-sign">How does this file show spending?</label><select id="csv-spending-sign" value={spendingSign} onChange={(event) => setSpendingSign(event.target.value as "negative" | "positive")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="negative">As negative amounts (−$25.00)</option><option value="positive">As positive amounts ($25.00)</option></select><p className="text-[11px] text-muted-foreground mt-1.5">Check a purchase in your file if you’re unsure.</p></div></div> : <div className="grid sm:grid-cols-2 gap-4"><ColumnSelect label="Debit / money out" value={debitColumn} onChange={setDebitColumn} headers={headers} /><ColumnSelect label="Credit / money in" value={creditColumn} onChange={setCreditColumn} headers={headers} /></div>}<div className="flex justify-between"><Button variant="outline" onClick={() => setStage("choose")}>Back</Button><Button disabled={!dateColumn || !descriptionColumn || (amountMode === "signed" ? !amountColumn : !debitColumn && !creditColumn)} onClick={() => setStage("review")}>Review transactions</Button></div></div>}

            {stage === "review" && <div className="space-y-5">
              <div><p className="text-xs uppercase tracking-[0.14em] text-primary font-mono mb-1">Here’s what we found</p><h3 className="font-semibold">{validRows.length} transactions · {dateRange} · {spendingRows} money out · {incomeRows} money in</h3><p className="text-sm text-muted-foreground mt-1">Check a few rows, then choose where this file belongs.</p></div>
              <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Description</th><th className="text-left px-3 py-2">Direction</th><th className="text-right px-3 py-2">Amount</th></tr></thead><tbody>{normalized.slice(0, 8).map((row) => <tr key={row.index} className="border-t border-border"><td className="px-3 py-2">{row.date ?? "Invalid date"}</td><td className="px-3 py-2">{row.description || "Missing"}</td><td className="px-3 py-2 text-muted-foreground">{row.amountCents == null ? "—" : row.amountCents < 0 ? "Money out" : "Money in"}</td><td className="px-3 py-2 text-right font-mono">{row.amountCents == null ? "Invalid" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.amountCents / 100)}</td></tr>)}</tbody></table></div>
              {invalidRows.length > 0 && <div className="rounded-xl border border-[hsl(var(--fs-amber))]/25 bg-[hsl(var(--fs-amber-bg))] p-3"><button type="button" className="flex w-full items-center justify-between gap-3 text-left text-xs font-medium text-foreground" onClick={() => setShowInvalidRows((open) => !open)} aria-expanded={showInvalidRows}><span>{invalidRows.length} {invalidRows.length === 1 ? "row needs" : "rows need"} attention and will not be imported.</span><span className="text-[hsl(var(--fs-amber))]">{showInvalidRows ? "Hide rows" : "Review rows"}</span></button>{showInvalidRows && <div className="mt-3 space-y-2 border-t border-[hsl(var(--fs-amber))]/20 pt-3">{invalidRows.map((row) => <div key={row.index} className="rounded-lg bg-background/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold">CSV row {row.index}</p><p className="text-[11px] text-destructive">{row.reasons.join(" · ")}</p></div><dl className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-3"><div><dt className="font-medium text-foreground">Date</dt><dd className="break-all">{row.rawDate || "Empty"}</dd></div><div><dt className="font-medium text-foreground">Description</dt><dd className="break-all">{row.rawDescription || "Empty"}</dd></div><div><dt className="font-medium text-foreground">Amount</dt><dd className="break-all">{row.rawAmount || "Empty"}</dd></div></dl></div>)}</div>}</div>}
              <AccountChoice accounts={accounts} value={accountChoice} onChange={selectAccount} newAccountName={newAccountName} setNewAccountName={setNewAccountName} newAccountType={newAccountType} setNewAccountType={setNewAccountType} />
              {needsBalance ? <div className="grid sm:grid-cols-2 gap-4"><div><label htmlFor="current-balance" className="text-xs text-muted-foreground block mb-1.5">Current balance <span className="text-foreground">(required)</span></label><input id="current-balance" value={currentBalance} onChange={(event) => { setCurrentBalance(event.target.value); setError(null) }} type="number" step="0.01" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" placeholder="Enter the current balance" /><p className="text-[11px] text-muted-foreground mt-1.5">Needed only because this account does not have a balance anchor yet.</p></div><div><label htmlFor="balance-date" className="text-xs text-muted-foreground block mb-1.5">Balance as of</label><input id="balance-date" value={balanceDate} onChange={(event) => setBalanceDate(event.target.value)} type="date" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div></div> : <div className={`rounded-xl p-3 text-xs ${selectedBalanceAgeDays !== null && selectedBalanceAgeDays >= 7 ? "bg-[hsl(var(--fs-amber-bg))]" : "bg-muted/50"}`}><p className="font-medium text-foreground">Using {selectedAccount?.name} balance: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((selectedAccount?.anchorBalanceCents ?? 0) / 100)} as of {selectedAccount?.anchorDate ? new Date(`${selectedAccount.anchorDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "today"}.</p>{selectedBalanceAgeDays !== null && selectedBalanceAgeDays >= 7 && <p className="text-muted-foreground mt-1">This balance is {selectedBalanceAgeDays} days old. You can refresh it from Accounts after import.</p>}</div>}
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" className="text-xs text-muted-foreground hover:text-foreground text-left" onClick={() => setStage("map")}>Columns don’t look right? Fix mapping manually</button><Button disabled={working || validRows.length === 0 || (accountChoice === "new" && !newAccountName.trim())} onClick={async () => { const balance = Number(currentBalance); if (currentBalance.trim() === "" || !Number.isFinite(balance)) { setError("Enter the current balance for this account."); document.getElementById("current-balance")?.focus(); return } setWorking(true); setError(null); const rows = validRows.map((row) => ({ date: row.date, description: row.description, amountCents: row.amountCents })); const result = await importCsvTransactions({ filename, rows, currentBalanceCents: Math.round(balance * 100), balanceDate, accountId: accountChoice === "new" ? undefined : accountChoice, newAccountName: accountChoice === "new" ? newAccountName : undefined, newAccountType: accountChoice === "new" ? newAccountType : undefined }); setWorking(false); if (!result.ok) { setError(result.message); return } setResultText(`${result.imported} imported · ${result.duplicates} duplicates skipped`); const found = suggestRecurring(rows, result.accountId); setSuggestions(found); const groups = reconcileRecurringSuggestions(found, existingRecurring); setReconciliationChoices(Object.fromEntries(groups.map((group) => [group.id, group.status === "new" ? "add" : "keep"]))); setStage(found.length > 0 ? "recurring" : incomePatternEstablished ? "done" : "income-pattern"); router.refresh() }}>{working ? "Importing…" : "Looks right — import"}</Button></div>
            </div>}

            {stage === "recurring" && <div className="space-y-5">
              <div><CheckCircle className="h-9 w-9 text-primary mb-3" /><h3 className="text-xl font-semibold">Reconcile recurring activity</h3><p className="text-sm text-muted-foreground mt-1">{resultText}. We compared the patterns in this file with what is already in your forecast.</p></div>
              {needsReviewGroups.length > 0 && <section className="space-y-3"><div><h4 className="font-semibold">Needs review</h4><p className="text-xs text-muted-foreground">These patterns may match something already in your forecast.</p></div>{needsReviewGroups.map((group) => { const choice = reconciliationChoices[group.id] ?? "keep"; return <fieldset key={group.id} className="rounded-xl border border-border p-4"><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">From this CSV</p>{group.suggestions.map((item) => <p key={item.id} className="text-sm">{item.name} <span className="font-mono text-muted-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amountCents / 100)}</span></p>)}</div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Already in FlowSight</p>{group.existing.map((item) => <p key={item.id} className="text-sm">{item.name} <span className="font-mono text-muted-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amountCents / 100)}</span></p>)}</div></div><p className="text-xs text-muted-foreground mt-3">{group.reason}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{[{ value: "replace", label: "Replace existing" }, { value: "keep", label: "Keep existing" }, { value: "add", label: "Keep both" }].map((option) => <label key={option.value} className={`rounded-lg border px-3 py-2 text-xs cursor-pointer ${choice === option.value ? "border-primary bg-primary/[0.06]" : "border-border"}`}><input className="sr-only" type="radio" name={group.id} checked={choice === option.value} onChange={() => setReconciliationChoices((current) => ({ ...current, [group.id]: option.value as "keep" | "replace" | "add" }))} />{option.label}</label>)}</div></fieldset>})}</section>}
              {newPatternGroups.length > 0 && <section className="rounded-xl border border-border overflow-hidden"><div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-3"><div><h4 className="font-semibold">New patterns</h4><p className="text-xs text-muted-foreground">{newPatternGroups.length} {newPatternGroups.length === 1 ? "pattern is" : "patterns are"} not currently included.</p></div><button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => { const allSelected = newPatternGroups.every((group) => reconciliationChoices[group.id] === "add"); setReconciliationChoices((current) => ({ ...current, ...Object.fromEntries(newPatternGroups.map((group) => [group.id, allSelected ? "keep" : "add"])) })) }}>{newPatternGroups.every((group) => reconciliationChoices[group.id] === "add") ? "Clear all" : "Select all"}</button></div><div className="divide-y divide-border">{newPatternGroups.map((group) => { const item = group.suggestions[0]; return <label key={group.id} className="flex items-center gap-3 px-4 py-3 text-sm"><input type="checkbox" className="accent-primary" checked={reconciliationChoices[group.id] === "add"} onChange={(event) => setReconciliationChoices((current) => ({ ...current, [group.id]: event.target.checked ? "add" : "keep" }))} /><span className="flex-1">{item.name}<span className="ml-2 text-xs capitalize text-muted-foreground">{item.frequency}</span></span><span className="font-mono text-muted-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amountCents / 100)}</span></label>})}</div></section>}
              {includedGroups.length > 0 && <section className="rounded-xl border border-border p-4"><button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setShowIncludedPatterns((open) => !open)} aria-expanded={showIncludedPatterns}><div><h4 className="font-semibold">Already included</h4><p className="text-xs text-muted-foreground">{includedGroups.length} {includedGroups.length === 1 ? "pattern closely matches" : "patterns closely match"} your existing forecast.</p></div><span className="text-xs text-primary">{showIncludedPatterns ? "Hide details" : "Show details"}</span></button>{showIncludedPatterns && <div className="mt-3 space-y-2 border-t border-border pt-3">{includedGroups.flatMap((group) => group.suggestions).map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.name}</span><span className="font-mono text-muted-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amountCents / 100)}</span></div>)}</div>}</section>}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-between"><Button variant="outline" onClick={() => setStage(incomePatternEstablished ? "done" : "income-pattern")}>Skip for now</Button><Button disabled={working} onClick={async () => {
                const selectedGroups = reconciliationGroups.filter((group) => reconciliationChoices[group.id] === "add" || reconciliationChoices[group.id] === "replace")
                const selected = selectedGroups.flatMap((group) => group.suggestions)
                const replacements = selectedGroups.filter((group) => reconciliationChoices[group.id] === "replace").map((group) => ({ existingIds: group.existing.map((item) => item.id), suggestionIds: group.suggestions.map((item) => item.id), filename }))
                setWorking(true)
                const result = await confirmRecurringSuggestions(selected, replacements)
                setWorking(false)
                if (!result.ok) { setError(result.message); return }
                setReconciliationIds(result.reconciliationIds)
                setConfirmedRegularIncome(selected.some((item) => item.type === "income"))
                setStage(incomePatternEstablished ? "done" : "income-pattern")
                router.refresh()
              }}>{working ? "Saving…" : "Save reviewed patterns"}</Button></div>
            </div>}

            {stage === "income-pattern" && <div className="space-y-5"><div><p className="text-xs uppercase tracking-[0.14em] text-primary font-mono mb-1">Income pattern</p><h3 className="text-xl font-semibold">{confirmedRegularIncome ? "You confirmed regular income. Do you also receive variable income?" : "How does money usually come in?"}</h3><p className="text-sm text-muted-foreground mt-2">This helps FlowSight interpret the income patterns we found.</p></div><div className="space-y-2">{(confirmedRegularIncome ? [{ value: "regular" as const, label: "Just the paycheck" }, { value: "mixed" as const, label: "I also have variable income" }] : [{ value: "regular" as const, label: "Regular paycheck" }, { value: "variable" as const, label: "Variable or irregular income" }, { value: "mixed" as const, label: "A mix of both" }]).map((option) => <button type="button" key={option.value} onClick={() => setIncomePattern(option.value)} className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium ${incomePattern === option.value ? "border-primary bg-primary/[0.08]" : "border-border hover:border-primary/30"}`}>{option.label}</button>)}</div>{confirmedRegularIncome && <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setConfirmedRegularIncome(false)}>That doesn’t describe me</button>}{error && <p className="text-sm text-destructive">{error}</p>}<Button disabled={!incomePattern || working} className="w-full" onClick={async () => { if (!incomePattern) return; setWorking(true); const result = await saveIncomePattern(incomePattern, timezoneRef.current); setWorking(false); if (!result.ok) { setError(result.message); return } setStage("done"); router.refresh() }}>{working ? "Saving…" : "Continue"}</Button></div>}

            {stage === "done" && <div className="py-8 text-center"><CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" /><h3 className="text-xl font-semibold">Your transactions are ready</h3><p className="text-sm text-muted-foreground mt-2 mb-2">{resultText || "Your transactions are ready."}</p><p className="text-sm text-muted-foreground mb-6">{suggestions.length === 0 ? "We didn’t find a reliable recurring pattern this time. We’ll check again after your next import." : "You can return to Transactions to review recurring activity at any time."}</p><div className="flex flex-wrap justify-center gap-2">{reconciliationIds.length > 0 && <Button variant="outline" onClick={async () => { setWorking(true); const results = await Promise.all(reconciliationIds.map((id) => undoRecurringReconciliation(id))); setWorking(false); const failed = results.find((result) => !result.ok); if (failed && !failed.ok) { setError(failed.message); return } setReconciliationIds([]); setResultText("Replacement undone. Your previous recurring items were restored."); router.refresh() }}>{working ? "Undoing…" : "Undo replacements"}</Button>}<Button onClick={() => { close(); if (autoOpen) router.push("/app/dashboard") }}>{autoOpen ? "View dashboard" : "Done"}</Button></div>{error && <p className="text-sm text-destructive mt-3">{error}</p>}</div>}
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
