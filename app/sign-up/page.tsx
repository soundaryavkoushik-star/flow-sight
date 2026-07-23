"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TrendingUp, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
]

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const pwStrength = passwordRules.filter(r => r.test(password)).length

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!name || !email || !password || !confirmPassword) { setError("Please fill in all fields."); return }
    if (password !== confirmPassword) { setError("Those passwords don’t match yet."); return }
    if (!acceptedTerms) { setError("Please accept the Terms of Service and Privacy Policy to continue."); return }
    if (pwStrength < 3) { setError("Please choose a stronger password."); return }
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/confirm`,
      },
    })
    setLoading(false)
    if (error) { setError(error.message); return }

    // When email confirmation is disabled for the MVP, Supabase creates a
    // session immediately and the user can begin onboarding without a gate.
    if (data.session) {
      router.replace("/app/onboarding")
      router.refresh()
      return
    }

    // Keep a graceful fallback for environments where confirmation remains on.
    setSuccess(true)
  }

  async function resendConfirmation() {
    setResendMessage("Sending a new link…")
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/confirm` },
    })
    setResendMessage(error ? "We couldn’t send a new link. Please try again." : "A new confirmation link is on its way.")
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong>{email}</strong>.
              Open it to confirm your account. Once confirmed, you can continue setting up your forecast.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/50 p-4 text-left mb-5">
              <p className="text-sm font-medium mb-1">You can explore while you wait</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Return to the landing page to preview how FlowSight works.</p>
            </div>
            {resendMessage && <p className="text-xs text-muted-foreground mb-3">{resendMessage}</p>}
            <div className="flex flex-col gap-2 text-sm">
              <button onClick={resendConfirmation} className="text-primary hover:underline">Resend confirmation email</button>
              <button onClick={() => { setSuccess(false); setResendMessage("") }} className="text-muted-foreground hover:text-foreground">Use a different email</button>
              <Link href="/" className="text-muted-foreground hover:text-foreground">Explore FlowSight</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between p-10 relative overflow-hidden shrink-0 bg-card border-r border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/[0.08] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <Link href="/" className="font-semibold">FlowSight</Link>
        </div>

        <div className="relative space-y-6">
          <div>
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] mb-3 font-mono">What you get</p>
            <div className="space-y-3.5">
              {[
              "A clear 30-day cash-flow forecast",
              "Safe to Spend after known bills and your buffer",
              "A heads-up before a known tight day",
              "Scenario planner for big purchases",
              "No bank connection required",
              ].map(t => (
                <div key={t} className="flex items-start gap-3">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-background/60 backdrop-blur-sm border border-border rounded-2xl p-5">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" fill="#D4754A" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              &ldquo;I can see the bills and paydays ahead without maintaining a budget.&rdquo;
            </p>
            <p className="text-xs text-muted-foreground/60">A calmer way to plan the next few weeks.</p>
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground/50">© {new Date().getFullYear()} FlowSight, Inc.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">FlowSight</span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Free 30-day forecast
          </div>
          <h1 className="text-[32px] font-extrabold tracking-tight mb-1.5">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-8">Start with a free 30-day cash-flow forecast. No bank connection required.</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive mb-5">{error}</div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" autoComplete="name"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password" autoComplete="new-password"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-1 mb-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < pwStrength ? (pwStrength === 1 ? "bg-destructive" : pwStrength === 2 ? "bg-[hsl(var(--fs-amber))]" : "bg-[hsl(var(--fs-green))]") : "bg-muted"}`} />
                    ))}
                  </div>
                  {passwordRules.map(({ label, test }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${test(password) ? "bg-primary/20" : "bg-muted"}`}>
                        {test(password) && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <span className={`text-xs transition-colors ${test(password) ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Confirm password</label>
              <input type={showPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Enter your password again" autoComplete="new-password"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            </div>

            <label className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-0.5" />
              <span>I agree to the <a href="#" className="text-foreground underline underline-offset-2">Terms of Service</a> and <a href="#" className="text-foreground underline underline-offset-2">Privacy Policy</a>.</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <><span>Create account</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
