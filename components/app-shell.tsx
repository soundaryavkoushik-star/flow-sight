"use client"

import { usePathname } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { AppSidebar } from "@/components/app-sidebar"

export function AppShell({ children, user }: { children: React.ReactNode; user: User }) {
  const pathname = usePathname()

  if (pathname === "/app/onboarding") {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
