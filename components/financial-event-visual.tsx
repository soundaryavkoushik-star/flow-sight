import {
  CarFront,
  CreditCard,
  House,
  HeartPulse,
  Landmark,
  Play,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Utensils,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type FinancialEventConfidence = "confirmed" | "estimated"

export function financialEventVisual(name: string, amountCents: number, confidence: FinancialEventConfidence = "confirmed"): { icon: LucideIcon; className: string } {
  const normalized = name.toLowerCase()
  if (/card payment|credit payment|payment received|autopay payment|online pmt.*(?:amex|visa|mastercard|discover)|amex.*epayment/.test(normalized)) return { icon: CreditCard, className: "bg-[oklch(var(--fs-transfer-bg))] text-[oklch(var(--fs-transfer))]" }
  if (amountCents > 0) return { icon: Landmark, className: "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]" }
  if (/rent|apartment|mortgage|housing/.test(normalized)) return { icon: House, className: "bg-[oklch(var(--primary)/.16)] text-primary" }
  if (/auto|car|vehicle|loan/.test(normalized)) return { icon: CarFront, className: "bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]" }
  if (/insurance/.test(normalized)) return { icon: ShieldCheck, className: "bg-[oklch(var(--fs-green-bg))] text-[oklch(var(--fs-green))]" }
  if (/netflix|spotify|stream|subscription/.test(normalized)) return { icon: Play, className: "bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]" }
  if (/electric|power|utility|water|internet/.test(normalized)) return { icon: Zap, className: "bg-[oklch(var(--fs-estimate-bg))] text-[oklch(var(--fs-estimate))]" }
  if (/amazon|market|grocery|groceries|shop|store|whole foods|trader joe/.test(normalized)) return { icon: ShoppingBag, className: "bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]" }
  if (/dining|restaurant|cafe|bakery/.test(normalized)) return { icon: Utensils, className: "bg-[oklch(var(--fs-amber-bg))] text-[oklch(var(--fs-amber))]" }
  if (/health|medical|pharmacy/.test(normalized)) return { icon: HeartPulse, className: "bg-[oklch(var(--fs-red-bg))] text-[oklch(var(--fs-red))]" }
  return confidence === "estimated"
    ? { icon: ReceiptText, className: "bg-[oklch(var(--fs-estimate-bg))] text-[oklch(var(--fs-estimate))]" }
    : { icon: ReceiptText, className: "bg-[oklch(var(--primary)/.14)] text-primary" }
}

export function FinancialEventIcon({ name, amountCents, confidence = "confirmed", className = "h-8 w-8", iconClassName = "h-3.5 w-3.5" }: { name: string; amountCents: number; confidence?: FinancialEventConfidence; className?: string; iconClassName?: string }) {
  const visual = financialEventVisual(name, amountCents, confidence)
  const Icon = visual.icon
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-lg ${className} ${visual.className}`}><Icon className={iconClassName} strokeWidth={2} /></span>
}
