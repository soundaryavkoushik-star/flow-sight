import FigmaLanding from "@/components/figma-landing"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <FigmaLanding isSignedIn={Boolean(user)} />
}
