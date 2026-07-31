import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return Response.redirect(new URL("/sign-in", request.url), 303)
}
