import fs from 'fs';
import path from 'path';
import { getFirestoreDb, isFirebaseConfigured, FirebaseUnavailableError } from './firebase-admin';
import { getSeedForKey, getSeedStoreFromDisk } from './seed';
import { ContactInquiry } from '@/types/cms';
import { runPendingFileMigrations } from './migrations';

const IS_DEV = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
const DEV_FILE_DIR = path.join(process.cwd(), '.data');
const DEV_FILE_PATH = path.join(DEV_FILE_DIR, 'dev-store.json');

export type StorageProvider = 'firebase' | 'file';

export function getActiveStorageProvider(): StorageProvider {
  if (process.env.CMS_STORAGE === 'file') {
    return 'file';
  }
  if (process.env.CMS_STORAGE === 'firebase' || isFirebaseConfigured()) {
    return 'firebase';
  }
  return 'file';
}

interface CacheEntry {
  data: any;
  timestamp: number;
}
const readCache = new Map<string, CacheEntry>();
const READ_CACHE_TTL_MS = 30000;

export function invalidateStoreCache(key?: string): void {
  if (key) {
    readCache.delete(key);
  } else {
    readCache.clear();
  }
}

function readDevFileStore(): Record<string, any> {
  if (!fs.existsSync(DEV_FILE_PATH)) {
    const seedStore = getSeedStoreFromDisk();
    try {
      if (!fs.existsSync(DEV_FILE_DIR)) {
        fs.mkdirSync(DEV_FILE_DIR, { recursive: true });
      }
      fs.writeFileSync(DEV_FILE_PATH, JSON.stringify(seedStore, null, 2), 'utf-8');
    } catch (e) {
      console.error('[store] Error creating dev-store.json:', e);
    }
    return seedStore as unknown as Record<string, any>;
  }
  try {
    return JSON.parse(fs.readFileSync(DEV_FILE_PATH, 'utf-8'));
  } catch (err) {
    console.error('[store] Error reading dev-store.json:', err);
    return getSeedStoreFromDisk() as unknown as Record<string, any>;
  }
}

function writeDevFileStore(store: Record<string, any>): void {
  try {
    if (!fs.existsSync(DEV_FILE_DIR)) {
      fs.mkdirSync(DEV_FILE_DIR, { recursive: true });
    }
    const tempFile = `${DEV_FILE_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, DEV_FILE_PATH);
  } catch (err) {
    console.error('[store] Error writing dev-store.json:', err);
    throw err;
  }
}

function normalizeCollectionShape(key: string, value: any): any {
  if (value === undefined || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value;
}

/**
 * Read a single collection key.
 * Dispatches to Firebase Firestore (primary) or local dev-store.json file (offline dev).
 */
export async function readKey<T = any>(key: string, options?: { throwOnError?: boolean }): Promise<T> {
  const cached = readCache.get(key);
  if (cached && Date.now() - cached.timestamp < READ_CACHE_TTL_MS) {
    return cached.data as T;
  }

  const provider = getActiveStorageProvider();

  // 1. File storage mode (offline dev without Firebase credentials)
  if (provider === 'file') {
    const store = readDevFileStore();
    const migrated = runPendingFileMigrations(store);
    let val = store[key];
    if (val === undefined) {
      val = getSeedForKey(key);
      store[key] = val;
      writeDevFileStore(store);
    } else if (migrated) {
      writeDevFileStore(store);
    }
    const res = normalizeCollectionShape(key, val) as T;
    readCache.set(key, { data: res, timestamp: Date.now() });
    return res;
  }

  // 2. Firebase Firestore mode (production & cloud storage)
  try {
    const db = getFirestoreDb();
    const docRef = db.collection('cms_store').doc('active_store');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`[PERF:STORE:SEED_REQUIRED_FIRESTORE] doc missing, seeding key=${key}...`);
      const seedVal = getSeedForKey(key);
      await docRef.set({ [key]: seedVal, lastUpdated: new Date().toISOString() }, { merge: true });
      const res = normalizeCollectionShape(key, seedVal) as T;
      readCache.set(key, { data: res, timestamp: Date.now() });
      return res;
    }

    const data = docSnap.data() || {};
    let val = data[key];

    if (val === undefined) {
      console.log(`[PERF:STORE:SEED_REQUIRED_FIRESTORE] key=${key} missing in doc, seeding...`);
      const seedVal = getSeedForKey(key);
      await docRef.set({ [key]: seedVal, lastUpdated: new Date().toISOString() }, { merge: true });
      val = seedVal;
    }

    const res = normalizeCollectionShape(key, val) as T;
    readCache.set(key, { data: res, timestamp: Date.now() });
    return res;
  } catch (err: any) {
    if (options?.throwOnError) {
      throw err;
    }
    console.warn(`[store] read ${key} failed on Firestore (falling back to seed):`, err?.message || err);
    const seedVal = getSeedForKey(key);
    const res = normalizeCollectionShape(key, seedVal) as T;
    readCache.set(key, { data: res, timestamp: Date.now() });
    return res;
  }
}

/**
 * Write a single collection key to Firestore.
 */
export async function writeKey<T = any>(key: string, value: T): Promise<void> {
  invalidateStoreCache(key);
  const lastUpdated = new Date().toISOString();
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const store = readDevFileStore();
    runPendingFileMigrations(store);
    store[key] = value;
    store.lastUpdated = lastUpdated;
    writeDevFileStore(store);
    return;
  }

  const db = getFirestoreDb();
  const docRef = db.collection('cms_store').doc('active_store');
  await docRef.set({ [key]: value, lastUpdated }, { merge: true });
}

/**
 * Push an inquiry to the front of the list atomically.
 */
export async function pushInquiry(inquiry: ContactInquiry): Promise<void> {
  invalidateStoreCache('inquiries');
  const lastUpdated = new Date().toISOString();
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const store = readDevFileStore();
    runPendingFileMigrations(store);
    if (!Array.isArray(store.inquiries)) {
      store.inquiries = [];
    }
    store.inquiries.unshift(inquiry);
    store.lastUpdated = lastUpdated;
    writeDevFileStore(store);
    return;
  }

  const db = getFirestoreDb();
  const docRef = db.collection('cms_store').doc('active_store');
  await db.runTransaction(async (t: import('firebase-admin/firestore').Transaction) => {
    const snap = await t.get(docRef);
    const existingInquiries = snap.exists && Array.isArray(snap.data()?.inquiries) ? snap.data()!.inquiries : [];
    t.set(
      docRef,
      {
        inquiries: [inquiry, ...existingInquiries],
        lastUpdated,
      },
      { merge: true }
    );
  });
}

/**
 * Atomic inquiry update in Firestore.
 */
export async function updateInquiryById(id: string, updates: Partial<ContactInquiry>): Promise<boolean> {
  invalidateStoreCache('inquiries');
  const lastUpdated = new Date().toISOString();
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const store = readDevFileStore();
    runPendingFileMigrations(store);
    const list = store.inquiries || [];
    const idx = list.findIndex((inq: any) => inq.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: lastUpdated };
    store.lastUpdated = lastUpdated;
    writeDevFileStore(store);
    return true;
  }

  const db = getFirestoreDb();
  const docRef = db.collection('cms_store').doc('active_store');
  let found = false;
  await db.runTransaction(async (t: import('firebase-admin/firestore').Transaction) => {
    const snap = await t.get(docRef);
    if (!snap.exists) return;
    const list = Array.isArray(snap.data()?.inquiries) ? [...snap.data()!.inquiries] : [];
    const idx = list.findIndex((inq: any) => inq.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], ...updates, updatedAt: lastUpdated };
    found = true;
    t.set(docRef, { inquiries: list, lastUpdated }, { merge: true });
  });
  return found;
}

/**
 * Atomic inquiry deletion in Firestore.
 */
export async function deleteInquiryById(id: string): Promise<boolean> {
  invalidateStoreCache('inquiries');
  const lastUpdated = new Date().toISOString();
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const store = readDevFileStore();
    runPendingFileMigrations(store);
    const list = store.inquiries || [];
    const initialLen = list.length;
    store.inquiries = list.filter((inq: any) => inq.id !== id);
    if (store.inquiries.length !== initialLen) {
      store.lastUpdated = lastUpdated;
      writeDevFileStore(store);
      return true;
    }
    return false;
  }

  const db = getFirestoreDb();
  const docRef = db.collection('cms_store').doc('active_store');
  let removed = false;
  await db.runTransaction(async (t: import('firebase-admin/firestore').Transaction) => {
    const snap = await t.get(docRef);
    if (!snap.exists) return;
    const list = Array.isArray(snap.data()?.inquiries) ? snap.data()!.inquiries : [];
    const filtered = list.filter((inq: any) => inq.id !== id);
    if (filtered.length !== list.length) {
      removed = true;
      t.set(docRef, { inquiries: filtered, lastUpdated }, { merge: true });
    }
  });
  return removed;
}
