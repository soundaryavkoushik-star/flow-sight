export interface MeasurementSnapshot {
  createdAt: Date
  forecastStartDate: Date
  forecastEndDate: Date
  projectedDays: unknown
}

export interface BalanceObservation {
  accountId: string
  balanceCents: number
  observedAt: Date
  createdAt: Date
}

export function measureForecasts(snapshots: MeasurementSnapshot[], observations: BalanceObservation[], accountIds: string[]) {
  const byDate = new Map<string, BalanceObservation[]>()
  for (const observation of observations) {
    const key = observation.observedAt.toISOString().slice(0, 10)
    byDate.set(key, [...(byDate.get(key) ?? []), observation])
  }
  const evaluations: Array<{ date: string; projectedBalanceCents: number; actualBalanceCents: number; errorCents: number }> = []
  for (const [date, items] of byDate) {
    const latestByAccount = new Map<string, BalanceObservation>()
    for (const item of items) if (!latestByAccount.has(item.accountId) || latestByAccount.get(item.accountId)!.createdAt < item.createdAt) latestByAccount.set(item.accountId, item)
    if (accountIds.some((id) => !latestByAccount.has(id))) continue
    const recordedAt = new Date(Math.max(...[...latestByAccount.values()].map((item) => item.createdAt.getTime())))
    const eligible = snapshots.filter((snapshot) => snapshot.createdAt < recordedAt && snapshot.forecastStartDate.toISOString().slice(0, 10) <= date && snapshot.forecastEndDate.toISOString().slice(0, 10) >= date).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    if (!eligible || !Array.isArray(eligible.projectedDays)) continue
    const projected = (eligible.projectedDays as Array<{ date?: unknown; endingBalanceCents?: unknown }>).find((day) => day.date === date)
    if (!projected || !Number.isSafeInteger(projected.endingBalanceCents)) continue
    const actualBalanceCents = accountIds.reduce((sum, id) => sum + latestByAccount.get(id)!.balanceCents, 0)
    const projectedBalanceCents = projected.endingBalanceCents as number
    evaluations.push({ date, projectedBalanceCents, actualBalanceCents, errorCents: actualBalanceCents - projectedBalanceCents })
  }
  evaluations.sort((a, b) => a.date.localeCompare(b.date))
  return {
    eligibleDays: evaluations.length,
    meanAbsoluteErrorCents: evaluations.length === 0 ? null : Math.round(evaluations.reduce((sum, item) => sum + Math.abs(item.errorCents), 0) / evaluations.length),
    latest: evaluations.at(-1) ?? null,
  }
}
