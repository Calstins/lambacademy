// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];

  // Check if the current path is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    // Get the session from the request
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If no session exists, redirect to login
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role-based access
    if (pathname.startsWith('/admin')) {
      if (session.user.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    if (pathname.startsWith('/dashboard')) {
      if (session.user.role !== 'STUDENT') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // If there's an error checking the session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
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
};
