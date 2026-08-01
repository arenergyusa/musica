/* eslint-disable */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes (client-side routes that require authentication)
  const isProtectedUserRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/invest') || 
    pathname.startsWith('/investments') || 
    pathname.startsWith('/wallet') || 
    pathname.startsWith('/withdraw') || 
    pathname.startsWith('/kyc') || 
    pathname.startsWith('/team') || 
    pathname.startsWith('/income');

  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  async function verifyToken(token: string) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.trim() === '') {
        return null;
      }
      const secretKey = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(token, secretKey);
      return payload;
    } catch (e) {
      return null;
    }
  }

  // Next.js middleware checks cookies for server-side redirection
  const token = request.cookies.get('token')?.value;

  const payload = token ? await verifyToken(token) : null;

  // If trying to access protected route without valid token, redirect to login
  if ((isProtectedUserRoute || isAdminRoute) && !payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const userRole = String(payload?.role || '').toLowerCase();

  // If we have a valid token and it's an admin route, check role
  if (payload && isAdminRoute) {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If logged in and trying to access login/register, redirect to dashboard or admin dashboard
  if (isAuthRoute && payload) {
    if (userRole === 'admin' || userRole === 'super_admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Matching Paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
