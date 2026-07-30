export function scenarioChartScale(balanceValues: number[], thresholdCents: number) {
  if (balanceValues.length === 0) throw new Error("Scenario chart requires at least one balance")

  const minimum = Math.min(...balanceValues)
  const maximum = Math.max(...balanceValues)
  const balanceSpan = Math.max(1, maximum - minimum)
  const padding = Math.max(10_000, Math.round(balanceSpan * 0.08))
  const thresholdDistance = minimum - thresholdCents
  const showThreshold = minimum <= thresholdCents
    || thresholdDistance <= Math.max(20_000, Math.round(balanceSpan * 0.08))
  const domainMinimum = showThreshold ? Math.min(minimum, thresholdCents) : minimum
  const domainStepCents = 10_000

  return {
    showThreshold,
    domain: [
      Math.floor(domainMinimum / domainStepCents) * domainStepCents,
      Math.ceil((maximum + padding) / domainStepCents) * domainStepCents,
    ] as [number, number],
  }
}

export function decisionRoomNote({
  safeToSpendCents,
  lowestBalanceCents,
  hasPositiveBuffer,
  throughLabel,
}: {
  safeToSpendCents: number
  lowestBalanceCents: number
  hasPositiveBuffer: boolean
  throughLabel: string
}) {
  if (safeToSpendCents > 0) return `Safe today through ${throughLabel}`
  if (hasPositiveBuffer) return "No room to spend today without using your buffer."
  if (lowestBalanceCents < 0) return "Your projected balance falls below $0 in this outlook."
  return "Your projected balance reaches $0 before your next income."
}

export function safeDateComparisonLabel(hasPositiveBuffer: boolean) {
  return hasPositiveBuffer ? "earliest clear" : "above $0"
}
