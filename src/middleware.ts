import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(req.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.headers.append("Set-Cookie", serializeCookieHeader(name, value, options))
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (req.nextUrl.pathname.startsWith("/login") && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profile } = await svc
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/login/:path*", "/dashboard/:path*", "/admin/:path*"],
};
