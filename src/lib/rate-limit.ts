import { getFirestoreDb, isFirebaseConfigured } from './firebase-admin';

interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  remaining: number;
  retryAfterSeconds: number;
}

const memoryRateLimit = new Map<string, { attempts: number; resetAt: number }>();

/**
 * Serverless-compatible rate limiter backed by Firestore with in-memory fallback.
 * Uses atomic updates to track failed attempts across distributed serverless instances.
 * 
 * @param key Unique identifier (e.g. `login_${clientIp}`)
 * @param maxAttempts Maximum allowed attempts within window (default: 5)
 * @param windowSeconds Window duration in seconds (default: 900 = 15 minutes)
 */
/**
 * Resolve client IP across Cloudflare, Vercel, and direct connections.
 * Prevents client spoofing by strictly validating edge headers:
 * - Only trusts cf-connecting-ip if TRUST_CLOUDFLARE_PROXY is explicitly 'true'. Default is false.
 * - Uses x-vercel-forwarded-for (first entry provided by Vercel edge), then x-real-ip.
 * - Fallbacks to x-forwarded-for taking the LAST entry (appended by the edge proxy).
 */
export function getClientIp(headers: Headers): string {
  // 1. Cloudflare Proxy header: ONLY trusted if explicitly enabled via env var
  if (process.env.TRUST_CLOUDFLARE_PROXY === 'true') {
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp && cfConnectingIp.trim()) {
      return cfConnectingIp.trim();
    }
  }

  // 2. Vercel edge client IP header (set directly by Vercel edge infrastructure)
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor && vercelForwardedFor.trim()) {
    const ip = vercelForwardedFor.split(',')[0].trim();
    if (ip) return ip;
  }

  // 3. Vercel real IP header (trusted edge socket)
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }

  // 4. Fallback: x-forwarded-for taking the LAST entry (added by trusted edge proxy)
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return '127.0.0.1';
}

/**
 * Serverless-compatible rate limiter backed by Firestore with in-memory fallback.
 * Uses atomic updates to track failed attempts across distributed serverless instances.
 * 
 * @param key Unique identifier (e.g. `login_${clientIp}`)
 * @param maxAttempts Maximum allowed attempts within window (default: 5)
 * @param windowSeconds Window duration in seconds (default: 900 = 15 minutes)
 * @param options.failClosed If true, denies access when Firestore is configured but unreachable (vital for admin login)
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900,
  options?: { failClosed?: boolean }
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (isFirebaseConfigured()) {
    try {
      const db = getFirestoreDb();
      const docRef = db.collection('system_ratelimits').doc(key);
      const snap = await docRef.get();

      if (!snap.exists) {
        return {
          allowed: true,
          attempts: 0,
          remaining: maxAttempts,
          retryAfterSeconds: 0,
        };
      }

      const data = snap.data() || {};
      const attempts = typeof data.attempts === 'number' ? data.attempts : 0;
      const resetAt = typeof data.resetAt === 'number' ? data.resetAt : 0;

      // Window has expired
      if (now > resetAt) {
        return {
          allowed: true,
          attempts: 0,
          remaining: maxAttempts,
          retryAfterSeconds: 0,
        };
      }

      const isAllowed = attempts < maxAttempts;
      const remaining = Math.max(0, maxAttempts - attempts);
      const retryAfterSeconds = Math.ceil((resetAt - now) / 1000);

      return {
        allowed: isAllowed,
        attempts,
        remaining,
        retryAfterSeconds: isAllowed ? 0 : retryAfterSeconds,
      };
    } catch (err) {
      console.warn('[ratelimit] Firestore rate limit check failed:', err);
      // Fail closed for security-critical endpoints (e.g. admin login) during DB outages
      if (options?.failClosed) {
        return {
          allowed: false,
          attempts: maxAttempts,
          remaining: 0,
          retryAfterSeconds: 60,
        };
      }
    }
  }

  // Memory fallback (for local dev or non-critical endpoints)
  const entry = memoryRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      attempts: 0,
      remaining: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  const isAllowed = entry.attempts < maxAttempts;
  const remaining = Math.max(0, maxAttempts - entry.attempts);
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: isAllowed,
    attempts: entry.attempts,
    remaining,
    retryAfterSeconds: isAllowed ? 0 : retryAfterSeconds,
  };
}

export async function recordFailedAttempt(
  key: string,
  windowSeconds: number = 900
): Promise<void> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const resetAt = now + windowMs;
  const expiresAt = new Date(resetAt); // Timestamp for Firestore TTL policy

  if (isFirebaseConfigured()) {
    try {
      const db = getFirestoreDb();
      const docRef = db.collection('system_ratelimits').doc(key);
      
      await db.runTransaction(async (t) => {
        const snap = await t.get(docRef);
        if (!snap.exists) {
          t.set(docRef, { attempts: 1, resetAt, expiresAt, updatedAt: now });
        } else {
          const data = snap.data() || {};
          const currentResetAt = typeof data.resetAt === 'number' ? data.resetAt : 0;
          if (now > currentResetAt) {
            t.set(docRef, { attempts: 1, resetAt, expiresAt, updatedAt: now });
          } else {
            const currentAttempts = typeof data.attempts === 'number' ? data.attempts : 0;
            t.update(docRef, { attempts: currentAttempts + 1, expiresAt, updatedAt: now });
          }
        }
      });
      return;
    } catch (err) {
      console.warn('[ratelimit] Firestore recordFailedAttempt failed, using memory fallback:', err);
    }
  }

  // Memory fallback
  const entry = memoryRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    memoryRateLimit.set(key, { attempts: 1, resetAt: now + windowMs });
  } else {
    entry.attempts += 1;
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  memoryRateLimit.delete(key);

  if (isFirebaseConfigured()) {
    try {
      const db = getFirestoreDb();
      await db.collection('system_ratelimits').doc(key).delete();
    } catch (err) {
      // Non-critical cleanup error
    }
  }
}
