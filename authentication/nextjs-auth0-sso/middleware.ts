import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { auth0 } from './lib/auth0'

export async function middleware(request: NextRequest) {
  try {
    const authRes = await auth0.middleware(request)

    // Ensure your own middleware does not handle the `/auth` routes,
    // auto-mounted and handled by the SDK
    if (request.nextUrl.pathname.startsWith('/auth')) {
      return authRes
    }

    // Allow access to public routes without requiring a session
    if (
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname === '/api/shows' ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/favicon') ||
      request.nextUrl.pathname.startsWith('/static')
    ) {
      return authRes
    }

    // Protected routes - require authentication
    const protectedRoutes = ['/profile', '/orders', '/ssr', '/csr']
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    )

    if (isProtectedRoute) {
      try {
        const session = await auth0.getSession(request)

        if (!session) {
          const { origin } = new URL(request.url)
          return NextResponse.redirect(`${origin}/auth/login`)
        }
      } catch (sessionError) {
        console.error('Session error:', sessionError)
        // Clear cookies and redirect to login on session errors
        const { origin } = new URL(request.url)
        const response = NextResponse.redirect(`${origin}/auth/login`)

        // Clear auth cookies
        response.cookies.delete('appSession')
        response.cookies.delete('appSession.0')
        response.cookies.delete('appSession.1')

        return response
      }
    }

    return authRes
  } catch (error) {
    console.error('Middleware error:', error)

    // For JWE decryption errors, clear cookies and allow the request to continue
    if (
      error.message?.includes('decryption') ||
      error.name === 'JWEDecryptionFailed'
    ) {
      const response = NextResponse.next()

      // Clear potentially corrupted session cookies
      response.cookies.delete('appSession')
      response.cookies.delete('appSession.0')
      response.cookies.delete('appSession.1')

      return response
    }

    // For other errors, let the request continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
