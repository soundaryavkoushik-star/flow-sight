import { describe, expect, it } from "vitest"
import { expectedCardPaymentCents, isMatchingCardPayment, nextCardPaymentDate, suggestCardPaymentFromHistory } from "../lib/forecast/credit-cards"
import { detectTransferSuggestions } from "../lib/transfers/detect"

describe("credit card payment planning", () => {
  it("uses the configured payment strategy", () => {
    const base = {
      statementBalanceCents: 142500,
      minimumPaymentCents: 4500,
      fixedPaymentCents: 20000,
      paymentDueDay: 12,
    }
    expect(expectedCardPaymentCents({ ...base, paymentStrategy: "full_statement" })).toBe(142500)
    expect(expectedCardPaymentCents({ ...base, paymentStrategy: "minimum" })).toBe(4500)
    expect(expectedCardPaymentCents({ ...base, paymentStrategy: "fixed" })).toBe(20000)
  })

  it("keeps the due day calendar-aware and clamps short months", () => {
    expect(nextCardPaymentDate(new Date("2027-02-01T00:00:00.000Z"), 31).toISOString().slice(0, 10)).toBe("2027-02-28")
    expect(nextCardPaymentDate(new Date("2027-02-28T00:00:00.000Z"), 31).toISOString().slice(0, 10)).toBe("2027-02-28")
    expect(nextCardPaymentDate(new Date("2027-03-01T00:00:00.000Z"), 31).toISOString().slice(0, 10)).toBe("2027-03-31")
  })

  it("recognizes an imported payment so it is not forecast twice", () => {
    expect(isMatchingCardPayment(
      { date: new Date("2027-03-12T00:00:00.000Z"), amountCents: -142500, accountId: "checking", description: "CHASE CARD AUTOPAY" },
      { dueDate: "2027-03-12", expectedPaymentCents: 142500, paymentAccountId: "checking", cardName: "Chase Freedom" },
    )).toBe(true)
  })

  it("proposes the next payment from observed card-payment history", () => {
    expect(suggestCardPaymentFromHistory([
      { date: "2026-05-13", description: "Payment Received - Thank You", amountCents: 100_000 },
      { date: "2026-06-13", description: "Payment Received - Thank You", amountCents: 120_000 },
      { date: "2026-07-13", description: "Payment Received - Thank You", amountCents: 110_000 },
      { date: "2026-07-21", description: "Costco", amountCents: -14_769 },
    ])).toEqual({
      expectedPaymentCents: 110_000,
      minPaymentCents: 100_000,
      maxPaymentCents: 120_000,
      occurrenceCount: 3,
      nextPaymentDate: "2026-08-13",
    })
  })
})

describe("owned-account transfer detection", () => {
  it("makes a credit-card payment a high-confidence reversible suggestion", () => {
    const suggestions = detectTransferSuggestions([
      { id: "cash-out", accountId: "checking", accountType: "checking", accountName: "Everyday", date: new Date("2027-03-12T00:00:00.000Z"), amountCents: -142500, description: "CHASE PAYMENT" },
      { id: "card-in", accountId: "card", accountType: "credit_card", accountName: "Chase Freedom", date: new Date("2027-03-13T00:00:00.000Z"), amountCents: 142500, description: "PAYMENT RECEIVED" },
    ])
    expect(suggestions).toEqual([expect.objectContaining({ confidence: "high", outgoingTransactionId: "cash-out", incomingTransactionId: "card-in" })])
  })

  it("does not guess from a lone Venmo transaction", () => {
    expect(detectTransferSuggestions([
      { id: "venmo", accountId: "checking", accountType: "checking", date: new Date("2027-03-12T00:00:00.000Z"), amountCents: -5000, description: "VENMO PAYMENT" },
    ])).toEqual([])
  })

  it("suppresses a card match when issuer identity conflicts", () => {
    expect(detectTransferSuggestions([
      { id: "cash-out", accountId: "checking", accountType: "checking", accountName: "Everyday", date: new Date("2027-03-12T00:00:00.000Z"), amountCents: -120000, description: "PAYMENT TO CHASE CARD 4821" },
      { id: "card-in", accountId: "card", accountType: "credit_card", accountName: "American Express", date: new Date("2027-03-13T00:00:00.000Z"), amountCents: 120000, description: "PAYMENT RECEIVED" },
    ])).toEqual([])
  })
})
