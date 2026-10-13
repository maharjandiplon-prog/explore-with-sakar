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

  // Strict CORS / Preflight handling for API routes: deny untrusted cross-origins
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (host && originHost === host) {
          return new NextResponse(null, {
            status: 204,
            headers: {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sync-secret',
              'Access-Control-Allow-Credentials': 'true',
              'Access-Control-Max-Age': '86400',
            },
          });
        }
      } catch {
        // Invalid origin format
      }
    }
    return new NextResponse(null, { status: 403 });
  }

  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const isInvalidOrExpired = !(await isTokenValid(token));

  // 1. API Admin & Upload Protection
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/upload')) {
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    // Preview Safety: Block mutating admin/upload requests on Vercel Preview unless explicitly allowed
    if (process.env.VERCEL_ENV === 'preview' && process.env.ALLOW_PREVIEW_WRITES !== 'true') {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        if (pathname !== '/api/admin/auth/logout') {
          return NextResponse.json(
            { error: 'Forbidden: Vercel Preview environment is read-only. Database mutations are blocked unless ALLOW_PREVIEW_WRITES=true.' },
            { status: 403 }
          );
        }
      }
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
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }

    // CSRF Protection for state-changing admin & upload actions (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      if (!isSyncSecretValid) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
        if (!origin) {
          return NextResponse.json(
            { error: 'Forbidden: Missing Origin header on state-changing request (CSRF protection)' },
            { status: 403 }
          );
        }
        try {
          const originHost = new URL(origin).host;
          if (!host || originHost !== host) {
            return NextResponse.json({ error: 'Forbidden: Cross-site request rejected (CSRF)' }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: 'Forbidden: Invalid request origin' }, { status: 403 });
        }
      }
    }

    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // 2. Admin Web UI Protection
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';

    // NEVER redirect away from /admin/login automatically!
    if (isLoginPage) {
      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }

    // Protected admin route: if no token or expired, redirect to login & clear cookie
    if (isInvalidOrExpired) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      if (token) {
        res.cookies.delete(COOKIE_NAME);
      }
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }

    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
