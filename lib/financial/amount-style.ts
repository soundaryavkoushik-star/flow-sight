export type FinancialAmountKind = "income" | "spending" | "transfer" | "neutral" | "estimate"

export function amountColorClass(kind: FinancialAmountKind) {
  if (kind === "income") return "text-[hsl(var(--fs-green))]"
  if (kind === "transfer") return "text-muted-foreground"
  if (kind === "estimate") return "text-[hsl(var(--fs-amber))]"
  return "text-foreground"
}

export function amountDotClass(kind: FinancialAmountKind) {
  if (kind === "income") return "bg-[hsl(var(--fs-green))]"
  if (kind === "transfer") return "bg-muted-foreground"
  if (kind === "estimate") return "bg-[hsl(var(--fs-amber))]"
  return "bg-foreground/55"
}
