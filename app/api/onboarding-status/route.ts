import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/data/prisma"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { userId: true },
  })

  return NextResponse.json({ completed: Boolean(profile) })
}
