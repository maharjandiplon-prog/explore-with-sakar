export const dynamic = 'force-dynamic';

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getAdminSession } from '@/lib/auth';
import { getFirestoreDb, FirebaseUnavailableError } from '@/lib/firebase-admin';
import { getSeedForKey } from '@/lib/seed';
import { invalidateStoreCache } from '@/lib/store';
import { revalidateTag } from 'next/cache';

function safeEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/**
 * Auth check using session or SYNC_SECRET header.
 */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  try {
    const session = getSessionFromRequest(req) || (await getAdminSession(req));
    if (session) return true;
  } catch {
    // session check may throw if ADMIN_JWT_SECRET is missing — fall through
  }
  const syncSecret = process.env.SYNC_SECRET;
  const headerSecret = req.headers.get('x-sync-secret');
  if (syncSecret && headerSecret && safeEqual(headerSecret, syncSecret)) return true;
  return false;
}

/**
 * POST /api/admin/sync-seed
 *
 * Pushes seed data from data/cms-store.json into the production Firebase Firestore
 * active_store document WITHOUT overwriting existing data that has been edited.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SYNC_SEED !== 'true') {
    return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 404 });
  }

  const authorized = await isAuthorized(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized — provide admin session or x-sync-secret header' }, { status: 401 });
  }

  let body: { fields?: string[]; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // default: sync blogs and experiences
  }

  const FORBIDDEN_FIELDS = new Set(['inquiries', 'admin', 'gsc_auth']);
  const rawFields: string[] = body.fields || ['blogs', 'experiences'];
  const fieldsToSync = rawFields.filter((f) => !FORBIDDEN_FIELDS.has(f));
  const force = Boolean(body.force);

  const report: Record<string, any> = {};

  try {
    const db = getFirestoreDb();
    const docRef = db.collection('cms_store').doc('active_store');
    const docSnap = await docRef.get();
    const existing = docSnap.exists ? docSnap.data() || {} : {};

    const setPayload: Record<string, any> = { lastUpdated: new Date().toISOString() };

    for (const field of fieldsToSync) {
      const currentVal = existing[field];
      const isEmpty =
        currentVal === undefined ||
        currentVal === null ||
        (Array.isArray(currentVal) && currentVal.length === 0);

      if (isEmpty || force) {
        const seedData = getSeedForKey(field);
        if (seedData !== undefined && seedData !== null) {
          setPayload[field] = seedData;
          report[field] = {
            action: force && !isEmpty ? 'overwritten (force=true)' : 'seeded (was empty)',
            count: Array.isArray(seedData) ? seedData.length : 'object',
          };
        } else {
          report[field] = { action: 'skipped (no seed data)', count: 0 };
        }
      } else {
        report[field] = {
          action: 'skipped (already has data)',
          count: Array.isArray(currentVal) ? currentVal.length : 'object',
        };
      }
    }

    const syncedFields = Object.keys(setPayload).filter((k) => k !== 'lastUpdated');
    if (syncedFields.length > 0) {
      await docRef.set(setPayload, { merge: true });

      for (const field of syncedFields) {
        invalidateStoreCache(field);
        try {
          revalidateTag(`cms:${field}`);
        } catch {
          // revalidateTag may not be available in all contexts
        }
      }
    }

    return NextResponse.json({
      success: true,
      provider: 'firebase',
      syncedFields,
      report,
    });
  } catch (err: any) {
    const isUnavailable = err instanceof FirebaseUnavailableError;
    return NextResponse.json(
      {
        success: false,
        error: isUnavailable ? 'Firebase unavailable' : err.message || String(err),
      },
      { status: isUnavailable ? 503 : 500 }
    );
  }
}
