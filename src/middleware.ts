import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for route protection in DEADLINE frontend
 * Checks Firebase auth state and redirects unauthenticated users
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicPaths = ["/login", "/signup"];

  // Check if current path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Get Firebase auth token from cookies
  // Firebase sets auth tokens in cookies when using the web SDK
  const authToken =
    request.cookies.get("__session")?.value ||
    request.cookies.get("firebase-auth-token")?.value;

  // If trying to access protected route without auth token
  if (!isPublicPath && !authToken) {
    const loginUrl = new URL("/login", request.url);
    // Add redirect parameter to return to intended page after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user tries to access login page, redirect to dashboard
  if (isPublicPath && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

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
