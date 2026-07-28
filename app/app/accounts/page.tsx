import { AccountManager } from "@/components/account-manager"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const accounts = user ? await prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, include: { creditCardSettings: true, _count: { select: { transactions: true } } } }) : []
  const paymentAccounts = accounts.filter((account) => !account.isLiability).map((account) => ({ id: account.id, name: account.name }))
  return <div className="p-5 sm:p-6 max-w-5xl mx-auto"><div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Accounts</h1><p className="text-sm text-muted-foreground mt-1">Keep liquid balances current. FlowSight learns card-payment timing from transaction history you confirm.</p></div><AccountManager paymentAccounts={paymentAccounts} accounts={accounts.map((account) => ({ id: account.id, name: account.name, type: account.type, source: account.source, balanceCents: account.anchorBalanceCents, balanceDate: account.anchorDate?.toISOString().slice(0, 10) ?? null, transactionCount: account._count.transactions, cardSettings: account.creditCardSettings ? { paymentAccountId: account.creditCardSettings.paymentAccountId, statementBalanceCents: account.creditCardSettings.statementBalanceCents, minimumPaymentCents: account.creditCardSettings.minimumPaymentCents, statementClosingDay: account.creditCardSettings.statementClosingDay, paymentDueDay: account.creditCardSettings.paymentDueDay, paymentStrategy: account.creditCardSettings.paymentStrategy, fixedPaymentCents: account.creditCardSettings.fixedPaymentCents } : null }))} /></div>
}
