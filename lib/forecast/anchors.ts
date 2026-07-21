export interface AnchorAccount {
  id: string
  name: string
  anchorBalanceCents: number | null
  anchorDate: Date | null
}

export interface AnchorTransaction {
  accountId: string | null
  amountCents: number
  date: Date
}

export function rollForwardAnchors(accounts: AnchorAccount[], transactions: AnchorTransaction[], today: Date) {
  const accountsWithAnchors = accounts.filter((account) => account.anchorBalanceCents !== null)
  const items = accountsWithAnchors.map((account) => {
    const activityCents = transactions
      .filter((transaction) => transaction.accountId === account.id && account.anchorDate && transaction.date > account.anchorDate && transaction.date < today)
      .reduce((sum, transaction) => sum + transaction.amountCents, 0)
    return {
      accountId: account.id,
      accountName: account.name,
      anchorBalanceCents: account.anchorBalanceCents ?? 0,
      anchorDate: account.anchorDate,
      activityCents,
      openingBalanceCents: (account.anchorBalanceCents ?? 0) + activityCents,
    }
  })
  return { items, totalCents: items.reduce((sum, item) => sum + item.openingBalanceCents, 0) }
}
