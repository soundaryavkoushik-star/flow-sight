import { describe, expect, it } from "vitest"
import { buildKnownCardPayment, expectedCardPaymentCents, isMatchingCardPayment, nextCardPaymentDate, resolveCardStatementBaseline, suggestCardPaymentFromHistory } from "../lib/forecast/credit-cards"
import { detectTransferSuggestions, isUnmatchedCardPayment } from "../lib/transfers/detect"

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

  it("combines the unpaid statement with charges known in the current cycle", () => {
    expect(buildKnownCardPayment(
      new Date("2026-08-10T00:00:00.000Z"),
      15,
      10,
      40_000,
      [
        { date: new Date("2026-07-20T00:00:00.000Z"), description: "Market Basket", amountCents: -6_000 },
        { date: new Date("2026-08-02T00:00:00.000Z"), description: "Trader Joe's", amountCents: -3_000 },
        { date: new Date("2026-08-05T00:00:00.000Z"), description: "Store refund", amountCents: 1_000 },
      ],
    )).toEqual({
      cycleStartDate: "2026-07-16",
      cycleCloseDate: "2026-08-15",
      dueDate: "2026-09-10",
      unpaidStatementBalanceCents: 40_000,
      knownCycleChargesCents: 8_000,
      expectedPaymentCents: 48_000,
      chargeCount: 2,
      postedChargeCount: 2,
      upcomingChargeCount: 0,
      usesFallback: false,
    })
  })

  it("assigns purchases after closing to the next statement cycle", () => {
    const payment = buildKnownCardPayment(
      new Date("2026-08-20T00:00:00.000Z"),
      15,
      10,
      0,
      [
        { date: new Date("2026-08-14T00:00:00.000Z"), description: "Old cycle", amountCents: -9_000 },
        { date: new Date("2026-08-18T00:00:00.000Z"), description: "New cycle", amountCents: -6_000 },
      ],
    )

    expect(payment.cycleStartDate).toBe("2026-08-16")
    expect(payment.cycleCloseDate).toBe("2026-09-15")
    expect(payment.dueDate).toBe("2026-10-10")
    expect(payment.knownCycleChargesCents).toBe(6_000)
  })

  it("uses the unpaid-statement amount as a cold-start fallback", () => {
    expect(buildKnownCardPayment(
      new Date("2026-08-10T00:00:00.000Z"),
      15,
      10,
      72_000,
      [],
    )).toEqual(expect.objectContaining({
      expectedPaymentCents: 72_000,
      knownCycleChargesCents: 0,
      chargeCount: 0,
      postedChargeCount: 0,
      upcomingChargeCount: 0,
      usesFallback: true,
    }))
  })

  it("includes a known recurring card bill before the statement closes", () => {
    const payment = buildKnownCardPayment(
      new Date("2026-08-10T00:00:00.000Z"),
      15,
      10,
      40_000,
      [],
      [{ date: new Date("2026-08-12T00:00:00.000Z"), description: "Netflix", amountCents: -1_799 }],
    )

    expect(payment.expectedPaymentCents).toBe(41_799)
    expect(payment.postedChargeCount).toBe(0)
    expect(payment.upcomingChargeCount).toBe(1)
    expect(payment.usesFallback).toBe(false)
  })

  it("keeps the manually-entered statement balance when imported history doesn't cover the full cycle", () => {
    // Cycle closes on the 15th; only 5 days of imported history (Aug 6-10) within an Aug 1 - Aug 10 window.
    const start = new Date("2026-08-10T00:00:00.000Z")
    const cardTransactions = [
      { date: new Date("2026-08-06T00:00:00.000Z"), description: "Coffee", amountCents: -500 },
      { date: new Date("2026-08-09T00:00:00.000Z"), description: "Groceries", amountCents: -14_500 },
    ]
    const baseline = resolveCardStatementBaseline(start, 15, 10, 120_000, cardTransactions)
    expect(baseline.hasFullCycleCoverage).toBe(false)
    expect(baseline.unpaidStatementBalanceCents).toBe(120_000)

    const payment = buildKnownCardPayment(start, 15, 10, baseline.unpaidStatementBalanceCents, cardTransactions)
    // Should reflect the bank-verified $1,200 balance plus the $150 in newly-visible charges, not just the $150 sliver.
    expect(payment.expectedPaymentCents).toBe(135_000)
  })

  it("drops the manual statement balance once imported history fully covers the current cycle", () => {
    const start = new Date("2026-08-10T00:00:00.000Z")
    const cardTransactions = [
      // Cycle starts 2026-07-16 for a statement closing on the 15th; this predates the cycle start.
      { date: new Date("2026-07-01T00:00:00.000Z"), description: "Old cycle charge", amountCents: -2_000 },
      { date: new Date("2026-08-02T00:00:00.000Z"), description: "Groceries", amountCents: -6_000 },
    ]
    const baseline = resolveCardStatementBaseline(start, 15, 10, 120_000, cardTransactions)
    expect(baseline.hasFullCycleCoverage).toBe(true)
    expect(baseline.unpaidStatementBalanceCents).toBe(0)

    const payment = buildKnownCardPayment(start, 15, 10, baseline.unpaidStatementBalanceCents, cardTransactions)
    expect(payment.expectedPaymentCents).toBe(6_000)
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
  it("recognizes a card payment credit before its cash-side match is available", () => {
    expect(isUnmatchedCardPayment("Payment Received - Thank You", 120000, "credit_card")).toBe(true)
    expect(isUnmatchedCardPayment("Client payment received", 120000, "checking")).toBe(false)
    expect(isUnmatchedCardPayment("Merchant refund", 120000, "credit_card")).toBe(false)
  })

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
