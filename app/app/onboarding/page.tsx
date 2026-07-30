import FigmaOnboarding from "@/components/figma-onboarding"
import { prisma } from "@/lib/data/prisma"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const creditCards = user
    ? await prisma.account.findMany({
        where: { userId: user.id, type: "credit_card" },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true },
      })
    : []

  return <FigmaOnboarding creditCards={creditCards} />
}
