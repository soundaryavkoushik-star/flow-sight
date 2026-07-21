import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect all routes under /app/*
  const isProtected = request.nextUrl.pathname.startsWith("/app")
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    return NextResponse.redirect(url)
  }

  // Redirect signed-in users away from auth pages
  const isAuthPage = ["/sign-in", "/sign-up"].includes(request.nextUrl.pathname)
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/app/onboarding"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
