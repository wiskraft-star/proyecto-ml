import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/auth")) return true;

  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/robots")) return true;
  if (pathname.startsWith("/sitemap")) return true;

  if (pathname === "/api/health") return true;

  return false;
}

export async function middleware(req: NextRequest) {
  // If env is missing, don't block the app (useful for local debugging); pages will show error.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const { supabase, res } = createSupabaseMiddlewareClient(req);

  // Refresh session if needed
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const pathname = req.nextUrl.pathname;

  // API: return 401 (no redirects)
  if (pathname.startsWith("/api") && pathname !== "/api/health") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return res;
  }

  // Pages: redirect to /login if needed
  if (!user && !isPublicPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
