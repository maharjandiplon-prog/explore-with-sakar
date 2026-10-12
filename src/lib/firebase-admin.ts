import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

export class FirebaseUnavailableError extends Error {
  constructor(message = 'Firebase service unavailable.') {
    super(message);
    this.name = 'FirebaseUnavailableError';
  }
}

export class DatabaseUnavailableError extends FirebaseUnavailableError {
  constructor(message = 'Database service unavailable.') {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

// Backward-compatibility alias for route handlers
export class MongoUnavailableError extends DatabaseUnavailableError {
  constructor(message = 'Database service unavailable.') {
    super(message);
    this.name = 'MongoUnavailableError';
  }
}

let app: App | null = null;
let firestoreDb: Firestore | null = null;
let storageBucket: ReturnType<Storage['bucket']> | null = null;

export interface FirebaseConfigStatus {
  hasProjectId: boolean;
  hasClientEmail: boolean;
  hasPrivateKey: boolean;
  hasStorageBucket: boolean;
  isConfigured: boolean;
  missingKeys: string[];
}

export function getFirebaseConfigStatus(): FirebaseConfigStatus {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() || '';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim() || '';
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim() || '';

  const missing: string[] = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  const isConfigured = missing.length === 0;

  return {
    hasProjectId: Boolean(projectId),
    hasClientEmail: Boolean(clientEmail),
    hasPrivateKey: Boolean(privateKey),
    hasStorageBucket: Boolean(bucketName),
    isConfigured,
    missingKeys: missing,
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfigStatus().isConfigured;
}

export function getFirebaseAdminApp(): App {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
    return app;
  }

  // During Next.js production build phase, skip throwing hard crashes
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new FirebaseUnavailableError('Skipping Firebase initialization during Next.js production build phase.');
  }

  const status = getFirebaseConfigStatus();
  if (!status.isConfigured) {
    throw new FirebaseUnavailableError(
      `Firebase Admin credentials incomplete. Missing: ${status.missingKeys.join(', ')}`
    );
  }

  const projectId = process.env.FIREBASE_PROJECT_ID!.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.appspot.com`;

  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: storageBucketName,
    });
    return app;
  } catch (err: any) {
    console.error('[firebase-admin] Error initializing app:', err?.message || err);
    throw new FirebaseUnavailableError(`Failed to initialize Firebase Admin app: ${err?.message || err}`);
  }
}

export function getFirestoreDb(): Firestore {
  if (firestoreDb) return firestoreDb;
  const adminApp = getFirebaseAdminApp();
  firestoreDb = getFirestore(adminApp);
  return firestoreDb;
}

export function getStorageBucket() {
  if (storageBucket) return storageBucket;
  const adminApp = getFirebaseAdminApp();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  storageBucket = getStorage(adminApp).bucket(bucketName || undefined);
  return storageBucket;
}
