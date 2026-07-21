const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function assertDateKey(value: string): void {
  if (!DATE_RE.test(value)) throw new Error(`Invalid date key: ${value}`)
}

export function parseDateKey(value: string): Date {
  assertDateKey(value)
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateKey(date)
}

export function addMonthsClamped(dateKey: string, months: number): string {
  const date = parseDateKey(dateKey)
  const originalDay = date.getUTCDate()
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(originalDay, lastDay))
  return toDateKey(target)
}

export function isInRange(date: string, start: string, endInclusive: string): boolean {
  return date >= start && date <= endInclusive
}
