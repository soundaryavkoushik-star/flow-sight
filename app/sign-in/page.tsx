"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Please fill in all fields."); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError("Invalid email or password."); return }
    const statusResponse = await fetch("/api/onboarding-status", { cache: "no-store" })
    const status = statusResponse.ok ? await statusResponse.json() as { completed: boolean } : { completed: false }
    router.push(status.completed ? "/app/dashboard" : "/app/onboarding")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between p-10 relative overflow-hidden shrink-0 bg-card border-r border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-primary/[0.08] rounded-full blur-3xl" />
        </div>

        <Link href="/" className="relative w-fit" aria-label="Cusp home"><Image src="/cusp-logo.svg?v=2" alt="Cusp" width={155} height={36} loading="eager" className="h-9 w-auto" /></Link>

        <div className="relative space-y-8">
          <div className="bg-background/60 backdrop-blur-sm border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CuspMark className="h-5 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-mono">Cash Flow</p>
                <p className="font-semibold text-sm">30-Day Forecast</p>
              </div>
              <span className="ml-auto text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">Clearly explained</span>
            </div>
            {/* Mini bar sparkline */}
            <div className="flex items-end gap-1 h-12 mb-4">
              {[40, 55, 45, 70, 65, 80, 72, 85, 78, 90, 82, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, background: i >= 7 ? "rgba(34,197,94,0.4)" : "rgba(85,115,255,0.5)" }} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Current balance</p>
                <p className="text-lg font-bold font-mono">$5,500</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground mb-0.5">Safe to spend</p>
                <p className="text-lg font-bold text-primary font-mono">$2,840</p>
              </div>
            </div>
          </div>

          <blockquote className="text-muted-foreground text-sm leading-relaxed">
            &ldquo;Finally a finance app that tells me what&apos;s <em className="text-foreground not-italic">coming</em>, not just what already happened.&rdquo;
            <footer className="mt-3 text-xs text-muted-foreground/70">— Marcus T., beta user</footer>
          </blockquote>
        </div>

        <p className="relative text-xs text-muted-foreground/50">© {new Date().getFullYear()} Cusp, Inc.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <Link href="/" className="mb-10 lg:hidden" aria-label="Cusp home"><Image src="/cusp-logo.svg?v=2" alt="Cusp" width={155} height={36} loading="eager" className="h-9 w-auto" /></Link>

        <div className="w-full max-w-[380px]">
          <h1 className="text-[32px] font-extrabold tracking-tight mb-1.5">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Sign in to your Cusp account.</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive mb-5">{error}</div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:text-primary/80 font-medium transition-colors">Join the beta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function CuspMark({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true"><path d="M19 9V7.5C19 6.11929 17.8807 5 16.5 5H7.5C6.11929 5 5 6.11929 5 7.5V16.5C5 17.8807 6.11929 19 7.5 19H16.5C17.8807 19 19 17.8807 19 16.5V15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /><rect x="9" y="9" width="6" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.75" /></svg>
}
