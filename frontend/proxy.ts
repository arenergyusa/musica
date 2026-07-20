/* eslint-disable */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes (client-side routes that require authentication)
  const isProtectedUserRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/invest') || 
    pathname.startsWith('/wallet') || 
    pathname.startsWith('/kyc') || 
    pathname.startsWith('/team') || 
    pathname.startsWith('/income');

  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Next.js middleware runs on the server, so we can only check cookies here.
  // We'll rely on a cookie named 'token' if we decide to set it, 
  // or we just check if it's there. 
  // For localStorage-based auth (CSR), the middleware cannot read localStorage.
  // Therefore, for a strict CSR app storing tokens in localStorage, 
  // we either:
  // 1. Sync localStorage token to a cookie upon login
  // 2. Or handle redirection strictly on the client side in a layout/wrapper.
  
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    return null;
  }
}

  // Assuming we use cookies for SSR/Middleware compatibility:
  const token = request.cookies.get('token')?.value;

  // If trying to access protected route without token, redirect to login
  if ((isProtectedUserRoute || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If we have a token and it's an admin route, check role
  if (token && isAdminRoute) {
    const payload = parseJwt(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If logged in and trying to access login/register, redirect to dashboard or admin dashboard
  if (isAuthRoute && token) {
    const payload = parseJwt(token);
    if (payload?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
