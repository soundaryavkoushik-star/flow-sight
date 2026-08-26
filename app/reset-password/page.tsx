"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (password.length < 8) { setError("Use at least eight characters."); return }
    if (password !== confirmation) { setError("Those passwords don’t match yet."); return }
    setSaving(true)
    const result = await createClient().auth.updateUser({ password })
    setSaving(false)
    if (result.error) { setError("This reset link may have expired. Request a new one and try again."); return }
    setMessage("Your password has been updated. You can now sign in.")
  }

  return <main className="flex min-h-screen items-center justify-center bg-background p-5">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Account recovery</p>
      <h1 className="mt-2 text-2xl font-semibold">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="new-password" className="mb-1.5 block text-sm font-medium">New password</label><input id="new-password" type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" /></div>
        <div><label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">Confirm password</label><input id="confirm-password" type="password" required autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm text-[oklch(var(--fs-green))]">{message}</p>}
        <Button className="w-full" disabled={saving}>{saving ? "Updating…" : "Update password"}</Button>
      </form>
      {message && <Link href="/sign-in" className="mt-5 inline-flex text-sm font-medium text-primary">Continue to sign in</Link>}
    </div>
  </main>
}
