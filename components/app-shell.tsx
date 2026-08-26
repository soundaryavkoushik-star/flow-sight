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
    <div className="fs-app flex h-screen min-w-0 flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <AppSidebar user={user} />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
