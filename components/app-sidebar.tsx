"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  TrendingUp, Wallet, ArrowLeftRight,
  LayoutDashboard, GitBranch, Settings, ChevronLeft,
  ChevronRight, LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
  const [collapsed, setCollapsed] = useState(false)

  const initials = (user.email ?? "?").slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-card/88 shadow-[8px_0_30px_rgba(74,65,60,0.035)] transition-[width] duration-200",
        collapsed ? "w-[60px]" : "w-[232px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center px-3",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/app/dashboard" className="flex min-w-0 items-center rounded-lg px-1.5 py-1">
            <Image src="/cusp-logo.svg?v=2" alt="Cusp" width={138} height={32} loading="eager" className="h-8 w-auto" />
          </Link>
        )}
        {collapsed && (
          <Link href="/app/dashboard" className="flex h-6 w-6 items-center justify-center rounded-md" aria-label="Cusp dashboard">
            <Image src="/cusp-mark.svg?v=1" alt="Cusp" width={24} height={24} loading="eager" className="h-6 w-6" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[color,background-color,box-shadow] duration-150",
                collapsed && "justify-center px-2",
                active
                  ? "bg-primary/10 font-medium text-primary shadow-[inset_0_0_0_1px_rgba(187,108,67,0.08)]"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="mx-2 mb-2 space-y-1 rounded-2xl bg-muted/45 p-2">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2 px-2 py-1")}>
          <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
        </div>
        <div className={cn("flex", collapsed ? "flex-col items-center gap-1" : "items-center gap-1 px-1")}>
          <form action="/api/auth/sign-out" method="post">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
          {!collapsed && <p className="text-[10px] leading-snug text-muted-foreground">Sign out when using a shared device.</p>}
        </div>
      </div>
    </aside>
  )
}
