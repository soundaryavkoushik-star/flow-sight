import { AccountManager } from "@/components/account-manager"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const accounts = user ? await prisma.account.findMany({ where: { userId: user.id, isLiability: false }, orderBy: { createdAt: "asc" }, include: { _count: { select: { transactions: true } } } }) : []
  return <div className="p-5 sm:p-6 max-w-5xl mx-auto"><div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Accounts</h1><p className="text-sm text-muted-foreground mt-1">Keep each balance current so your forecast starts from the right place.</p></div><AccountManager accounts={accounts.map((account) => ({ id: account.id, name: account.name, type: account.type, balanceCents: account.anchorBalanceCents, balanceDate: account.anchorDate?.toISOString().slice(0, 10) ?? null, transactionCount: account._count.transactions }))} /></div>
}
