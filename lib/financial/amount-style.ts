export type FinancialAmountKind = "income" | "spending" | "transfer" | "neutral" | "estimate"

export function amountColorClass(kind: FinancialAmountKind) {
  if (kind === "income") return "text-[oklch(var(--fs-green))]"
  if (kind === "transfer") return "text-[oklch(var(--fs-transfer))]"
  if (kind === "estimate") return "text-[oklch(var(--fs-estimate))]"
  return "text-foreground"
}

export function amountDotClass(kind: FinancialAmountKind) {
  if (kind === "income") return "bg-[oklch(var(--fs-green))]"
  if (kind === "transfer") return "bg-[oklch(var(--fs-transfer))]"
  if (kind === "estimate") return "bg-[oklch(var(--fs-estimate))]"
  return "bg-foreground/55"
}
