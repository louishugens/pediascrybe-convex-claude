import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Define paths that need authentication
const protectedPaths = ['/user', '/api']

// Helper to check if the path should be protected
function isProtectedPath(path: string) {
  return protectedPaths.some(prefix => path.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  // Skip middleware if path is not protected
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  return updateSession(request)
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
