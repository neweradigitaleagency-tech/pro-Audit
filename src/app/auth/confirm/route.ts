import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/register?error=missing_params`)
  }

  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "")
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.headers.append("Set-Cookie", serializeCookieHeader(name, value, options))
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as "signup" | "email" | "recovery" | "invite" | "magiclink",
  })

  if (error) {
    console.error("[AuthConfirm] Verification failed:", error.message)
    return NextResponse.redirect(`${origin}/auth/register?error=invalid_link`)
  }

  return response
}
