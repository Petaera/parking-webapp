import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("firebase-auth-token")
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ["/", "/register", "/reset-password"]

  // Check if the path is public
  const isPublicPath = publicPaths.some((publicPath) => path === publicPath || path.startsWith(publicPath + "/"))

  // If the path is not public and there's no auth cookie, redirect to login
  if (!isPublicPath && !authCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If the path is login or register and there's an auth cookie, redirect to dashboard
  if (isPublicPath && authCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Match all paths except for static files, api routes, etc.
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)",
  ],
}

