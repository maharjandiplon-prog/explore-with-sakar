export const dynamic = 'force-dynamic';

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getAdminSession } from '@/lib/auth';
import {
  getFirebaseConfigStatus,
  getFirestoreDb,
  isFirebaseConfigured,
  FirebaseUnavailableError,
} from '@/lib/firebase-admin';
import { getActiveStorageProvider } from '@/lib/store';

function safeEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  try {
    const session = getSessionFromRequest(req) || (await getAdminSession(req));
    if (session) return true;
  } catch {
    // session check may throw if ADMIN_JWT_SECRET is missing
  }
  const syncSecret = process.env.SYNC_SECRET;
  const headerSecret = req.headers.get('x-sync-secret');
  if (syncSecret && headerSecret && safeEqual(headerSecret, syncSecret)) return true;
  return false;
}

/**
 * Production diagnostics endpoint.
 * Returns safe metadata about Firebase configuration and record counts.
 * Does NOT expose credentials, passwords, private keys, or URIs.
 * Disabled by default in production unless ENABLE_DEBUG_DB='true'.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_DB !== 'true') {
    return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 404 });
  }

  const authorized = await isAuthorized(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized — provide admin session or x-sync-secret header' }, { status: 401 });
  }

  const adminJwtSecretSet = Boolean(process.env.ADMIN_JWT_SECRET);
  const adminUsernameSet = Boolean(process.env.ADMIN_USERNAME);
  const syncSecretSet = Boolean(process.env.SYNC_SECRET);
  const nodeEnv = process.env.NODE_ENV || 'unknown';
  const isVercel = Boolean(process.env.VERCEL);
  const nextPhase = process.env.NEXT_PHASE || 'runtime';
  const cmsStorage = process.env.CMS_STORAGE || '(not set)';
  const activeProvider = getActiveStorageProvider();

  // Test Firebase Firestore
  const fbConfig = getFirebaseConfigStatus();
  let firestoreStatus = 'NOT CONFIGURED';
  let firestoreBlogCount = -1;
  let firestoreExperienceCount = -1;
  let firestoreInquiryCount = -1;
  let firestoreError = '';

  if (fbConfig.isConfigured) {
    try {
      const fbDb = getFirestoreDb();
      const docSnap = await fbDb.collection('cms_store').doc('active_store').get();
      firestoreStatus = 'SUCCESS';
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        firestoreBlogCount = Array.isArray(data.blogs) ? data.blogs.length : -1;
        firestoreExperienceCount = Array.isArray(data.experiences) ? data.experiences.length : -1;
        firestoreInquiryCount = Array.isArray(data.inquiries) ? data.inquiries.length : -1;
      }
    } catch (err: any) {
      firestoreStatus = err instanceof FirebaseUnavailableError ? 'UNAVAILABLE' : 'ERROR';
      firestoreError = err.message || String(err);
    }
  }

  return NextResponse.json({
    diagnostics: {
      activeStorageProvider: activeProvider,
      environment: {
        nodeEnv,
        isVercel,
        nextPhase,
        cmsStorage,
        adminJwtSecretSet,
        adminUsernameSet,
        syncSecretSet,
      },
      firebase: {
        configured: fbConfig.isConfigured,
        hasProjectId: fbConfig.hasProjectId,
        hasClientEmail: fbConfig.hasClientEmail,
        hasPrivateKey: fbConfig.hasPrivateKey,
        hasStorageBucket: fbConfig.hasStorageBucket,
        missingKeys: fbConfig.missingKeys,
        connectionStatus: firestoreStatus,
        blogCount: firestoreBlogCount,
        experienceCount: firestoreExperienceCount,
        inquiryCount: firestoreInquiryCount,
        error: firestoreError || null,
      },
    },
  });
}
