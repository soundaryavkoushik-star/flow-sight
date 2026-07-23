import { normalizeMerchant, type RecurringSuggestion } from "./parse"

export interface ExistingRecurringItem {
  id: string
  name: string
  amountCents: number
  frequency: string
  type: string
  nextExpected: string | null
  accountId: string | null
  isManual: boolean
}

export interface ReconciliationGroup {
  id: string
  status: "already_included" | "needs_review" | "new"
  suggestions: RecurringSuggestion[]
  existing: ExistingRecurringItem[]
  reason: string
}

function tokens(value: string) {
  return new Set(normalizeMerchant(value).split(/\s+/).filter(Boolean))
}

function nameSimilarity(left: string, right: string) {
  const a = tokens(left)
  const b = tokens(right)
  if (a.size === 0 || b.size === 0) return 0
  const overlap = [...a].filter((token) => b.has(token)).length
  return overlap / Math.max(a.size, b.size)
}

function daysApart(left: string | null, right: string | null) {
  if (!left || !right) return Number.POSITIVE_INFINITY
  return Math.abs(new Date(`${left}T00:00:00Z`).getTime() - new Date(`${right}T00:00:00Z`).getTime()) / 86_400_000
}

function compatibleType(suggestion: RecurringSuggestion, existing: ExistingRecurringItem) {
  return (suggestion.amountCents < 0) === (existing.amountCents < 0)
}

function amountClose(left: number, right: number, percentage = 0.08) {
  const tolerance = Math.max(200, Math.round(Math.max(Math.abs(left), Math.abs(right)) * percentage))
  return Math.abs(Math.abs(left) - Math.abs(right)) <= tolerance
}

function isGenericName(name: string) {
  return /\b(subscription|subscriptions|bills|utilities|income|paycheck|salary|expenses)\b/i.test(name)
}

export function reconcileRecurringSuggestions(
  suggestions: RecurringSuggestion[],
  existingItems: ExistingRecurringItem[],
): ReconciliationGroup[] {
  const activeExisting = existingItems.filter((item) => item.type === "bill" || item.type === "income")
  const edges = new Map<string, Set<string>>()
  const strongPairs = new Set<string>()

  for (const suggestion of suggestions) {
    for (const existing of activeExisting) {
      if (!compatibleType(suggestion, existing) || suggestion.frequency !== existing.frequency) continue
      const similarity = nameSimilarity(suggestion.name, existing.name)
      const closeAmount = amountClose(suggestion.amountCents, existing.amountCents)
      const closeDate = daysApart(suggestion.nextExpected, existing.nextExpected) <= 4
      if ((similarity >= 0.5 && closeAmount) || (closeAmount && closeDate)) {
        edges.set(suggestion.id, new Set([...(edges.get(suggestion.id) ?? []), existing.id]))
        if (similarity >= 0.5 && closeAmount && closeDate) strongPairs.add(`${suggestion.id}:${existing.id}`)
      }
    }
  }

  // A broad manual estimate can plausibly break down into several CSV patterns.
  for (const existing of activeExisting.filter((item) => item.isManual && isGenericName(item.name))) {
    const candidates = suggestions.filter((suggestion) =>
      compatibleType(suggestion, existing)
      && suggestion.frequency === existing.frequency
      && (existing.accountId === null || suggestion.accountId === existing.accountId),
    )
    const combined = candidates.reduce((sum, item) => sum + Math.abs(item.amountCents), 0)
    if (candidates.length > 1 && amountClose(combined, Math.abs(existing.amountCents), 0.2)) {
      for (const suggestion of candidates) edges.set(suggestion.id, new Set([...(edges.get(suggestion.id) ?? []), existing.id]))
    }
  }

  const suggestionById = new Map(suggestions.map((item) => [item.id, item]))
  const existingById = new Map(activeExisting.map((item) => [item.id, item]))
  const visitedSuggestions = new Set<string>()
  const groups: ReconciliationGroup[] = []

  for (const suggestion of suggestions) {
    if (visitedSuggestions.has(suggestion.id)) continue
    const suggestionIds = new Set([suggestion.id])
    const existingIds = new Set<string>()
    const queue = [suggestion.id]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visitedSuggestions.has(current)) continue
      visitedSuggestions.add(current)
      for (const existingId of edges.get(current) ?? []) {
        existingIds.add(existingId)
        for (const [candidateId, candidateEdges] of edges) {
          if (candidateEdges.has(existingId) && !visitedSuggestions.has(candidateId)) {
            suggestionIds.add(candidateId)
            queue.push(candidateId)
          }
        }
      }
    }
    const groupSuggestions = [...suggestionIds].map((id) => suggestionById.get(id)!).filter(Boolean)
    const groupExisting = [...existingIds].map((id) => existingById.get(id)!).filter(Boolean)
    const oneToOneStrong = groupSuggestions.length === 1
      && groupExisting.length === 1
      && strongPairs.has(`${groupSuggestions[0].id}:${groupExisting[0].id}`)
    groups.push({
      id: `reconcile:${groupSuggestions.map((item) => item.id).sort().join("|")}`,
      status: groupExisting.length === 0 ? "new" : oneToOneStrong ? "already_included" : "needs_review",
      suggestions: groupSuggestions,
      existing: groupExisting,
      reason: groupExisting.length === 0
        ? "No similar recurring item is already in your forecast."
        : oneToOneStrong
          ? "The name, amount, timing, and frequency closely match an existing item."
          : groupSuggestions.length > 1 || groupExisting.length > 1
            ? "This import may split or combine recurring items you already entered."
            : "The amount, cadence, or timing may match an existing item.",
    })
  }
  return groups
}
