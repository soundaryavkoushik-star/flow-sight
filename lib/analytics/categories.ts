export const SPENDING_CATEGORIES = [
  { name: "Housing", color: "#8b5cf6", keywords: ["rent", "mortgage", "apartment", "property"] },
  { name: "Groceries", color: "#22c55e", keywords: ["grocery", "market", "trader joe", "whole foods", "aldi", "costco", "walmart"] },
  { name: "Dining", color: "#f97316", keywords: ["restaurant", "cafe", "coffee", "chipotle", "sushi", "thai", "pizza", "doordash", "ubereats"] },
  { name: "Transport", color: "#3b82f6", keywords: ["gas", "shell", "uber", "lyft", "transit", "parking", "metro"] },
  { name: "Utilities", color: "#eab308", keywords: ["electric", "power", "water", "utility", "internet", "phone", "verizon", "comcast"] },
  { name: "Subscriptions", color: "#ec4899", keywords: ["netflix", "spotify", "hulu", "subscription", "membership", "apple.com/bill"] },
  { name: "Insurance", color: "#14b8a6", keywords: ["insurance", "statewide", "geico", "allstate"] },
  { name: "Debt payments", color: "#ef4444", keywords: ["loan", "credit card payment", "autofin", "student loan"] },
  { name: "Shopping", color: "#a855f7", keywords: ["amazon", "target", "shop", "store", "retail"] },
  { name: "Health", color: "#06b6d4", keywords: ["pharmacy", "medical", "doctor", "dental", "cvs", "walgreens"] },
  { name: "Other", color: "#64748b", keywords: [] },
] as const

export const MONEY_IN_CATEGORIES = [
  { name: "Regular paycheck", color: "#2D8B5A", keywords: ["payroll", "paycheck", "salary", "direct deposit"] },
  { name: "Variable / side income", color: "#3B82F6", keywords: ["freelance", "contract", "invoice", "side income", "side hustle", "commission"] },
  { name: "Business income", color: "#0F766E", keywords: ["business income", "merchant payout", "stripe payout"] },
  { name: "Investment income", color: "#0891B2", keywords: ["dividend", "interest payment", "capital gain"] },
  { name: "Benefits", color: "#2563EB", keywords: ["social security", "unemployment", "government benefit"] },
  { name: "Refund / Reimbursement", color: "#CA8A04", keywords: ["refund", "reimbursement", "rebate", "cashback"] },
  { name: "Gift", color: "#D4754A", keywords: ["gift", "birthday", "wedding"] },
  { name: "Transfer in", color: "#6B7280", keywords: ["transfer", "venmo transfer", "zelle transfer"] },
  { name: "Income — needs review", color: "#64748B", keywords: [] },
] as const

export const TRANSACTION_CATEGORIES = [...SPENDING_CATEGORIES, ...MONEY_IN_CATEGORIES] as const
export type SpendingCategoryName = typeof SPENDING_CATEGORIES[number]["name"]
export type MoneyInCategoryName = typeof MONEY_IN_CATEGORIES[number]["name"]
export type TransactionCategoryName = typeof TRANSACTION_CATEGORIES[number]["name"]

export function suggestSpendingCategory(description: string): SpendingCategoryName {
  const normalized = description.trim().toLowerCase()
  return SPENDING_CATEGORIES.find((category) => category.name !== "Other" && category.keywords.some((keyword) => normalized.includes(keyword)))?.name ?? "Other"
}

export function suggestMoneyInCategory(description: string): MoneyInCategoryName {
  const normalized = description.trim().toLowerCase()
  return MONEY_IN_CATEGORIES.find((category) => category.name !== "Income — needs review" && category.keywords.some((keyword) => normalized.includes(keyword)))?.name ?? "Income — needs review"
}

export function suggestTransactionCategory(description: string, amountCents: number): TransactionCategoryName {
  return amountCents < 0 ? suggestSpendingCategory(description) : suggestMoneyInCategory(description)
}

export function categoriesForDirection(direction: "money_out" | "money_in") {
  return direction === "money_out" ? SPENDING_CATEGORIES : MONEY_IN_CATEGORIES
}

export function isForecastIncomeCategory(name: string) {
  return !["Refund / Reimbursement", "Gift", "Transfer in"].includes(name)
}

export function categoryColor(name: string) {
  return TRANSACTION_CATEGORIES.find((category) => category.name === name)?.color ?? "#64748b"
}

export interface CategorizedExpense { description: string; amountCents: number; categoryName?: string | null }

export function buildMonthlySpending(expenses: CategorizedExpense[]) {
  const totals = new Map<string, number>()
  for (const expense of expenses) {
    if (expense.amountCents >= 0) continue
    const name = expense.categoryName ?? suggestSpendingCategory(expense.description)
    totals.set(name, (totals.get(name) ?? 0) + Math.abs(expense.amountCents))
  }
  const categories = [...totals.entries()].map(([name, amountCents]) => ({ name, amountCents, color: categoryColor(name) })).sort((a, b) => b.amountCents - a.amountCents)
  return { totalCents: categories.reduce((sum, category) => sum + category.amountCents, 0), categories }
}
