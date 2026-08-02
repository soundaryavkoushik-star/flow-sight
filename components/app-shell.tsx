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
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(145deg,hsl(211_68%_97%)_0%,hsl(var(--background))_42%,hsl(219_42%_96%)_100%)]">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
