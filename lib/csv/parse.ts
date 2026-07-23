import { isForecastIncomeCategory, suggestMoneyInCategory } from "../analytics/categories"

export type CsvDateOrder = "mdy" | "dmy"

export interface NormalizedCsvTransaction {
  date: string
  description: string
  amountCents: number
}

export interface RecurringSuggestion {
  id: string
  accountId: string
  name: string
  amountCents: number
  frequency: "weekly" | "biweekly" | "monthly" | "annual"
  nextExpected: string
  type: "income" | "bill"
  anchorDayOfMonth?: number
  minAmountCents: number
  maxAmountCents: number
  occurrenceCount: number
  evidenceStartDate: string
  evidenceEndDate: string
}

export function recurringEvidenceConfidence(
  minAmountCents: number,
  maxAmountCents: number,
): "confirmed" | "estimated" {
  const spreadCents = Math.abs(maxAmountCents - minAmountCents)
  const averageMagnitudeCents = Math.max(
    1,
    Math.round((Math.abs(minAmountCents) + Math.abs(maxAmountCents)) / 2),
  )
  const toleranceCents = Math.max(1, Math.round(averageMagnitudeCents * 0.01))

  return spreadCents <= toleranceCents ? "confirmed" : "estimated"
}

export function parseCsvLine(line: string, delimiter: string) {
  const rows = parseCsvRecords(line, delimiter)
  return rows[0] ?? [""]
}

function parseCsvRecords(text: string, delimiter: string) {
  const rows: string[][] = []
  let values: string[] = []
  let value = ""
  let quoted = false
  const finishValue = () => { values.push(value.trim()); value = "" }
  const finishRow = () => {
    finishValue()
    if (values.some((item) => item.length > 0)) rows.push(values)
    values = []
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"' && quoted && text[index + 1] === '"') { value += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === delimiter && !quoted) finishValue()
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1
      finishRow()
    }
    else if (char === "\r" && quoted && text[index + 1] === "\n") { value += "\n"; index += 1 }
    else value += char
  }
  if (quoted) throw new Error("A quoted value in this CSV is not closed.")
  if (value.length > 0 || values.length > 0) finishRow()
  return rows
}

export function parseCsv(text: string) {
  const clean = text.replace(/^\uFEFF/, "")
  const candidates = [",", ";", "\t"]
  const detected = candidates
    .map((delimiter) => ({ delimiter, count: parseCsvRecords(clean, delimiter)[0]?.length ?? 0 }))
    .sort((a, b) => b.count - a.count)[0]
  if (detected.count < 2) throw new Error("We couldn’t identify the CSV delimiter or header columns.")
  const records = parseCsvRecords(clean, detected.delimiter)
  if (records.length < 2) throw new Error("This CSV doesn’t contain any transaction rows.")
  const [headers, ...rows] = records
  if (new Set(headers.map((header) => header.toLowerCase())).size !== headers.length) throw new Error("This CSV has duplicate column names. Rename them before importing.")
  return { headers, rows, delimiter: detected.delimiter }
}

export function findHeader(headers: string[], terms: string[]) {
  const index = headers.findIndex((header) => terms.some((term) => header.toLowerCase().includes(term)))
  return index >= 0 ? String(index) : ""
}

export function detectAmountColumns(headers: string[]) {
  const signed = findHeader(headers, ["amount"])
  const debit = findHeader(headers, ["debit", "withdrawal", "money out"])
  const credit = findHeader(headers, ["credit", "deposit", "money in"])
  return { mode: signed !== "" ? "signed" as const : debit !== "" || credit !== "" ? "split" as const : "signed" as const, signed, debit, credit }
}

export function detectDirectionColumn(headers: string[]) {
  return findHeader(headers, ["transaction type", "debit/credit", "credit/debit", "direction", "flow", "type"])
}

export function normalizeDate(value: string, order: CsvDateOrder = "mdy") {
  const clean = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const date = new Date(`${clean}T00:00:00Z`)
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== clean ? null : clean
  }
  const match = clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/)
  if (!match) return null
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]
  const monthValue = order === "mdy" ? match[1] : match[2]
  const dayValue = order === "mdy" ? match[2] : match[1]
  const iso = `${year}-${monthValue.padStart(2, "0")}-${dayValue.padStart(2, "0")}`
  const date = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso
}

export function parseMoney(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const negativeParentheses = /^\(.*\)$/.test(trimmed)
  const trailingMinus = /-$/.test(trimmed)
  const decimalComma = trimmed.includes(",") && !trimmed.includes(".") && /,\d{1,2}\D*$/.test(trimmed)
  const normalized = decimalComma ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed.replace(/,/g, "")
  const cleaned = normalized.replace(/[^0-9.-]/g, "").replace(/-$/, "")
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return null
  return Math.round((negativeParentheses || trailingMinus ? -Math.abs(parsed) : parsed) * 100)
}

export function applyAmountSignConvention(amountCents: number | null, spendingSign: "negative" | "positive") {
  if (amountCents === null) return null
  return spendingSign === "positive" ? -amountCents : amountCents
}

export function applyTransactionDirection(amountCents: number | null, direction: string) {
  if (amountCents === null) return null
  const normalized = direction.trim().toLowerCase()
  if (/\b(refund|credit|deposit|income|payroll|interest)\b/.test(normalized)) return Math.abs(amountCents)
  if (/\b(purchase|debit|withdrawal|fee|payment|charge)\b/.test(normalized)) return -Math.abs(amountCents)
  return null
}

export function normalizeMerchant(description: string) {
  return description
    .toLowerCase()
    .replace(/\b(pos|debit|credit|purchase|payment|card|ach|online|recurring)\b/g, " ")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function suggestRecurring(rows: NormalizedCsvTransaction[], accountId: string, today: Date | string = new Date()): RecurringSuggestion[] {
  const todayKey = typeof today === "string" ? today : today.toISOString().slice(0, 10)
  const groups = new Map<string, NormalizedCsvTransaction[]>()
  for (const row of rows) {
    if (row.amountCents > 0 && !isForecastIncomeCategory(suggestMoneyInCategory(row.description))) continue
    const key = normalizeMerchant(row.description)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  const suggestions: RecurringSuggestion[] = []
  for (const [key, items] of groups) {
    if (items.length < 3) continue
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
    const intervals = sorted.slice(1).map((item, index) => Math.round((new Date(`${item.date}T00:00:00Z`).getTime() - new Date(`${sorted[index].date}T00:00:00Z`).getTime()) / 86_400_000))
    const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length
    const maxDeviation = Math.max(...intervals.map((value) => Math.abs(value - average)))
    const frequency = average >= 5 && average <= 9 && maxDeviation <= 2 ? "weekly" : average >= 12 && average <= 16 && maxDeviation <= 3 ? "biweekly" : average >= 26 && average <= 35 && maxDeviation <= 5 ? "monthly" : average >= 350 && average <= 380 && maxDeviation <= 14 ? "annual" : null
    if (!frequency) continue
    const amounts = sorted.map((item) => item.amountCents)
    if (amounts.some((amount) => Math.sign(amount) !== Math.sign(amounts[0]))) continue
    const amountCents = Math.round(amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length)
    const lastDate = sorted.at(-1)!.date
    const dayCounts = new Map<number, number>()
    for (const item of sorted) {
      const day = Number(item.date.slice(8, 10))
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }
    const latestDay = Number(sorted.at(-1)!.date.slice(8, 10))
    const anchorDayOfMonth = [...dayCounts].sort((left, right) => right[1] - left[1] || (left[0] === latestDay ? -1 : 1))[0][0]
    let nextExpected = lastDate
    do {
      if (frequency === "weekly" || frequency === "biweekly") {
        const next = new Date(`${nextExpected}T00:00:00Z`)
        next.setUTCDate(next.getUTCDate() + (frequency === "weekly" ? 7 : 14))
        nextExpected = next.toISOString().slice(0, 10)
      } else {
        const current = new Date(`${nextExpected}T00:00:00Z`)
        const monthOffset = frequency === "annual" ? 12 : 1
        const target = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + monthOffset, 1))
        const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
        target.setUTCDate(Math.min(anchorDayOfMonth, lastDay))
        nextExpected = target.toISOString().slice(0, 10)
      }
    } while (nextExpected < todayKey)
    suggestions.push({ id: key, accountId, name: sorted.at(-1)!.description, amountCents, frequency, nextExpected, type: amountCents >= 0 ? "income" : "bill", anchorDayOfMonth: frequency === "monthly" || frequency === "annual" ? anchorDayOfMonth : undefined, minAmountCents: Math.min(...amounts), maxAmountCents: Math.max(...amounts), occurrenceCount: sorted.length, evidenceStartDate: sorted[0].date, evidenceEndDate: sorted.at(-1)!.date })
  }
  return suggestions.slice(0, 20)
}
