import { NextResponse } from "next/server";

/**
 * Middleware for route protection in DEADLINE frontend
 *
 * NOTE: Temporarily disabled server-side auth checks to avoid conflicts
 * with client-side Firebase Authentication. Client-side protection is
 * handled by AuthGuard components and AuthContext.
 */
export function middleware() {
  // Allow all requests to pass through
  // Client-side authentication handles protection via:
  // - AuthGuard component on protected pages
  // - AuthContext managing auth state
  // - Login page redirecting authenticated users

  return NextResponse.next();
}

/**
 * Configure which routes this middleware should run on
 * Exclude static files, API routes, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
