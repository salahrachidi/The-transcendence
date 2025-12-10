import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/register', '/2fa']
// Exclude backend routes from middleware processing to avoid interfering with API calls
const backendPrefixes = ['/auth', '/user', '/friendship', '/uploads', '/socket.io']

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const token = request.cookies.get('token')?.value

	// Exclude backend routes, static assets, and files
	if (
		backendPrefixes.some(prefix => pathname.startsWith(prefix)) ||
		pathname.startsWith('/_next') ||
		pathname.includes('.') // Exclude files (images, favicon, etc.)
	) {
		return NextResponse.next()
	}

	// Authenticated user
	if (token) {
		// Redirect to dashboard if trying to access public routes (login/register)
		if (publicRoutes.includes(pathname) || pathname === '/') {
			return NextResponse.redirect(new URL('/dashboard', request.url))
		}
	}
	// Unauthenticated user
	else {
		// Redirect to login if trying to access protected routes
		if (!publicRoutes.includes(pathname)) {
			return NextResponse.redirect(new URL('/login', request.url))
		}
	}

	// For game routes (especially /game/queue), add strict no-cache headers
	const response = NextResponse.next()
	if (pathname.startsWith('/game/queue') || pathname.match(/^\/game\/[^\/]+$/)) {
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
		response.headers.set('Pragma', 'no-cache')
		response.headers.set('Expires', '0')
	}

	return response
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
}
