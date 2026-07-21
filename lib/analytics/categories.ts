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

export type SpendingCategoryName = typeof SPENDING_CATEGORIES[number]["name"]

export function suggestSpendingCategory(description: string): SpendingCategoryName {
  const normalized = description.trim().toLowerCase()
  return SPENDING_CATEGORIES.find((category) => category.name !== "Other" && category.keywords.some((keyword) => normalized.includes(keyword)))?.name ?? "Other"
}

export function categoryColor(name: string) {
  return SPENDING_CATEGORIES.find((category) => category.name === name)?.color ?? "#64748b"
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
