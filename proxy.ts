import { NextResponse, type NextRequest } from 'next/server'


// Define paths that need authentication
const protectedPaths = ['/user', '/api']

// Define paths that need to check authentication status (for redirects)
const authCheckPaths = ['/', '/user', '/api']

// Helper to check if the path should be protected
function isProtectedPath(path: string) {
  return protectedPaths.some(prefix => path.startsWith(prefix))
}

// Helper to check if we need to run auth logic (for redirects)
function needsAuthCheck(path: string) {
  return authCheckPaths.some(prefix => path.startsWith(prefix)) || path === '/'
}

export async function proxy(request: NextRequest) {
  // Skip middleware if path doesn't need auth check
  if (!needsAuthCheck(request.nextUrl.pathname)) {
    return NextResponse.next()
  }


}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
