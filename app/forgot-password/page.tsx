"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    setMessage(null)
    const supabase = createClient()
    const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setSending(false)
    if (result.error) { setError("We couldn’t send that reset link. Check the address and try again."); return }
    setMessage("Check your email for a secure password-reset link.")
  }

  return <main className="flex min-h-screen items-center justify-center bg-background p-5">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Account recovery</p>
      <h1 className="mt-2 text-2xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter the email used for Cusp and we’ll send you a reset link.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium">Email</label><input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" placeholder="you@example.com" /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm text-[oklch(var(--fs-green))]">{message}</p>}
        <Button className="w-full" disabled={sending}>{sending ? "Sending…" : "Send reset link"}</Button>
      </form>
      <Link href="/sign-in" className="mt-5 inline-flex text-sm text-muted-foreground hover:text-foreground">Back to sign in</Link>
    </div>
  </main>
}
