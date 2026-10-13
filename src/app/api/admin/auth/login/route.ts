import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/db';
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, clearRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const ipRateLimitKey = `login_${ip.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

    // 1. Check IP Rate Limit (5 attempts per 15 minutes, fail-closed for admin security)
    const ipRateCheck = await checkRateLimit(ipRateLimitKey, 5, 900, { failClosed: true });
    if (!ipRateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many failed login attempts from this network. Please try again in ${ipRateCheck.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(ipRateCheck.retryAfterSeconds),
          },
        }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // 2. Check Account Rate Limit (5 attempts per 15 minutes per username, fail-closed)
    const sanitizedUser = String(username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
    const accountRateLimitKey = `login_account_${sanitizedUser}`;
    const accountRateCheck = await checkRateLimit(accountRateLimitKey, 10, 900, { failClosed: true });
    if (!accountRateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many failed login attempts for this account. Please try again in ${accountRateCheck.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(accountRateCheck.retryAfterSeconds),
          },
        }
      );
    }

    const admin = await getAdminUser();

    // Check username
    if (username.trim().toLowerCase() !== admin.username.toLowerCase()) {
      await Promise.all([
        recordFailedAttempt(ipRateLimitKey, 900),
        recordFailedAttempt(accountRateLimitKey, 900),
      ]);
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Check password
    const isValid = verifyPassword(password, admin.passwordHash, admin.salt);
    if (!isValid) {
      await Promise.all([
        recordFailedAttempt(ipRateLimitKey, 900),
        recordFailedAttempt(accountRateLimitKey, 900),
      ]);
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Success: clear rate limit counters for both IP and Account
    await Promise.all([
      clearRateLimit(ipRateLimitKey),
      clearRateLimit(accountRateLimitKey),
    ]);

    // Generate JWT token (expires in 7 days)
    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const token = signToken({
      username: admin.username,
      role: 'admin',
      exp,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        username: admin.username,
        role: 'admin',
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error?.message || 'Authentication error');
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
