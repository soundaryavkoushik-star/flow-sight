export interface TransferCandidateTransaction {
  id: string
  accountId: string | null
  accountType: string | null
  accountName?: string | null
  date: Date
  amountCents: number
  description: string
}

export interface TransferSuggestion {
  outgoingTransactionId: string
  incomingTransactionId: string
  confidence: "high" | "possible"
  reason: string
}

const transferLanguage = /\b(transfer|payment|autopay|card payment|credit card)\b/i
const receivedCardPaymentLanguage = /\b(payment received|payment.*thank you|thank you.*payment|autopay payment|online payment)\b/i

export function isUnmatchedCardPayment(description: string, amountCents: number, accountType: string | null | undefined) {
  return accountType === "credit_card" && amountCents > 0 && receivedCardPaymentLanguage.test(description)
}
const issuerPatterns = [
  { key: "american_express", pattern: /\b(american express|amex)\b/i },
  { key: "chase", pattern: /\bchase\b/i },
  { key: "capital_one", pattern: /\bcapital one\b/i },
  { key: "citi", pattern: /\b(citi|citibank)\b/i },
  { key: "discover", pattern: /\bdiscover\b/i },
  { key: "bank_of_america", pattern: /\b(bank of america|bofa)\b/i },
  { key: "wells_fargo", pattern: /\bwells fargo\b/i },
]

function issuer(value: string | null | undefined) {
  return issuerPatterns.find((candidate) => candidate.pattern.test(value ?? ""))?.key ?? null
}

export function detectTransferSuggestions(transactions: TransferCandidateTransaction[]): TransferSuggestion[] {
  const suggestions: TransferSuggestion[] = []
  const used = new Set<string>()
  const outgoing = transactions.filter((transaction) => transaction.amountCents < 0 && transaction.accountId)
  const incoming = transactions.filter((transaction) => transaction.amountCents > 0 && transaction.accountId)

  for (const debit of outgoing) {
    const matches = incoming.filter((credit) => {
      if (used.has(credit.id) || credit.accountId === debit.accountId || credit.amountCents !== -debit.amountCents) return false
      return Math.abs(credit.date.getTime() - debit.date.getTime()) <= 86_400_000
    })
    if (matches.length !== 1) continue
    const credit = matches[0]
    const involvesCard = debit.accountType === "credit_card" || credit.accountType === "credit_card"
    const languageMatch = transferLanguage.test(debit.description) || transferLanguage.test(credit.description)
    const card = debit.accountType === "credit_card" ? debit : credit.accountType === "credit_card" ? credit : null
    const counterpart = card?.id === debit.id ? credit : debit
    const cardIssuer = issuer(card?.accountName)
    const describedIssuer = issuer(`${counterpart.description} ${card?.description ?? ""}`)
    if (cardIssuer && describedIssuer && cardIssuer !== describedIssuer) continue
    const identityMatch = Boolean(cardIssuer && describedIssuer && cardIssuer === describedIssuer)
    suggestions.push({
      outgoingTransactionId: debit.id,
      incomingTransactionId: credit.id,
      confidence: identityMatch || (!involvesCard && languageMatch) ? "high" : "possible",
      reason: involvesCard
        ? identityMatch
          ? "Matching amount, timing, and card identity"
          : "Matching payment amount and timing; card identity was not available"
        : languageMatch
          ? "Matching amounts and transfer language across two accounts"
          : "Matching amounts on nearby dates across two accounts",
    })
    used.add(debit.id)
    used.add(credit.id)
  }
  return suggestions
}
