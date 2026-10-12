import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthSecret } from '@/lib/auth-secret';

const COOKIE_NAME = 'sakar_admin_session';
const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function isTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getAuthSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(parts[2]) as unknown as BufferSource,
      enc.encode(`${parts[0]}.${parts[1]}`)
    );
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
    return typeof payload.exp === 'number' && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const isInvalidOrExpired = !(await isTokenValid(token));

  // 1. API Admin Protection
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    // Allow bootstrap/diagnostic endpoints if valid x-sync-secret is presented
    const syncSecret = process.env.SYNC_SECRET;
    const headerSecret = request.headers.get('x-sync-secret');
    const isSyncSecretValid =
      Boolean(syncSecret && headerSecret) &&
      safeCompare(headerSecret!, syncSecret!);

    if (isInvalidOrExpired && !isSyncSecretValid) {
      const res = NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
      if (token) {
        res.cookies.delete(COOKIE_NAME);
      }
      return res;
    }
    return NextResponse.next();
  }

  // 2. Admin Web UI Protection
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';

    // NEVER redirect away from /admin/login automatically!
    if (isLoginPage) {
      return NextResponse.next();
    }

    // Protected admin route: if no token or expired, redirect to login & clear cookie
    if (isInvalidOrExpired) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      if (token) {
        res.cookies.delete(COOKIE_NAME);
      }
      return res;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
