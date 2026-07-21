"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  TrendingUp, Wallet, ArrowLeftRight,
  LayoutDashboard, GitBranch, Settings, ChevronLeft,
  ChevronRight, LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"

const NAV_ITEMS = [
  { href: "/app/dashboard",    label: "Dashboard",    Icon: LayoutDashboard, phase: 1 },
  { href: "/app/forecast",     label: "Forecast",     Icon: TrendingUp,    phase: 1 },
  { href: "/app/scenarios",    label: "Scenarios",    Icon: GitBranch,     phase: 5 },
  { href: "/app/transactions", label: "Transactions", Icon: ArrowLeftRight, phase: 2 },
  { href: "/app/accounts",     label: "Accounts",     Icon: Wallet,        phase: 2 },
  { href: "/app/settings",     label: "Settings",     Icon: Settings,      phase: 1 },
]

interface AppSidebarProps {
  user: User
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  const initials = (user.email ?? "?").slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-card transition-[width] duration-200 shrink-0",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-14 px-4 border-b border-border",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/25">
              <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">FlowSight</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />
          }
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                collapsed && "justify-center px-2",
                active
                  ? "bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))] font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 space-y-1">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2 px-2 py-1")}>
          <div className="w-7 h-7 rounded-full bg-[hsl(var(--fs-green-bg))] text-[hsl(var(--fs-green))] text-xs font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <span className="text-xs text-muted-foreground truncate flex-1">
              {user.email}
            </span>
          )}
        </div>
        <div className={cn("flex", collapsed ? "flex-col items-center gap-1" : "items-center gap-1 px-1")}>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
