export type MoneyCents = number

export type FinancialEventType = "income" | "expense"
export type FinancialEventSource = "manual" | "transaction" | "recurring" | "csv" | "scenario"
export type ForecastConfidence = "confirmed" | "estimated"

export interface FinancialEvent {
  id: string
  date: string // YYYY-MM-DD in the user's financial timezone
  amountCents: MoneyCents // signed: income positive, expense negative
  type: FinancialEventType
  source: FinancialEventSource
  name: string
  accountId?: string
  recurring?: boolean
  confidence: ForecastConfidence
}

export interface RecurringRule {
  id: string
  name: string
  amountCents: MoneyCents
  frequency: "weekly" | "biweekly" | "monthly" | "annual"
  nextDate: string
  accountId?: string
  confidence?: ForecastConfidence
  exceptions?: Array<{ date: string; movedDate?: string }>
}

export interface ForecastSettings {
  startDate: string
  days: number
  safetyBufferCents: MoneyCents
}

export interface ForecastInput {
  startingBalanceCents: MoneyCents
  events: FinancialEvent[]
  recurringRules?: RecurringRule[]
  settings: ForecastSettings
}

export interface ForecastDay {
  date: string
  openingBalanceCents: MoneyCents
  events: FinancialEvent[]
  netChangeCents: MoneyCents
  endingBalanceCents: MoneyCents
}

export interface ForecastRisk {
  type: "negative_balance" | "safety_buffer_breach"
  date: string
  balanceCents: MoneyCents
  severity: "warning" | "critical"
}

export interface ForecastExplanation {
  date: string
  headline: string
  eventIds: string[]
}

export interface ForecastResult {
  days: ForecastDay[]
  lowestBalanceCents: MoneyCents
  lowestBalanceDate: string
  safeToSpendCents: MoneyCents
  risks: ForecastRisk[]
  explanations: ForecastExplanation[]
}

export interface ScenarioComparison {
  baseline: ForecastResult
  scenario: ForecastResult
  lowestBalanceDeltaCents: MoneyCents
  safeToSpendDeltaCents: MoneyCents
  riskChanged: boolean
}
