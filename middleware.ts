// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/login', '/register', '/payment/callback'];

function isPublic(pathname: string) {
  // treat child paths of public paths as public too, e.g. /login/reset
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow public assets quickly
  if (isPublic(pathname)) {
    // If already authenticated and visiting / or /login or /register,
    // bounce to the correct home automatically.
    if (
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register')
    ) {
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (session?.user) {
          const role = String(session.user.role || '').toUpperCase();
          const url = req.nextUrl.clone();
          url.pathname = role === 'ADMIN' ? '/admin' : '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch {
        // If Better Auth throws here (rare), just render the public page.
      }
    }
    return NextResponse.next();
  }

  // Everything else is protected
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: req.headers });
  } catch {
    // Treat errors as not authenticated
  }

  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/login') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  const role = String(session.user.role || '').toUpperCase();

  // Admin-only area
  if (pathname.startsWith('/admin')) {
    if (role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Student-only area (send admins to their home)
  if (pathname.startsWith('/dashboard')) {
    if (role !== 'STUDENT') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except:
    // - api routes (including UploadThing)
    // - Next static/image files
    // - public files like favicon, robots, etc.
    '/((?!api|uploadthing|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
