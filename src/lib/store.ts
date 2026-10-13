import fs from 'fs';
import path from 'path';
import * as React from 'react';
const safeCache = typeof React.cache === 'function' ? React.cache : <T extends (...args: any[]) => any>(fn: T): T => fn;
import { getFirestoreDb, isFirebaseConfigured, FirebaseUnavailableError } from './firebase-admin';
import { getSeedForKey, getSeedStoreFromDisk } from './seed';
import { ContactInquiry } from '@/types/cms';
import { runPendingFileMigrations } from './migrations';

const IS_DEV = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
const DEV_FILE_DIR = path.join(process.cwd(), '.data');
const DEV_FILE_PATH = path.join(DEV_FILE_DIR, 'dev-store.json');
const DEV_INQUIRIES_PATH = path.join(DEV_FILE_DIR, 'dev-inquiries.json');

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

declare global {
  var _inFlightFirestorePromise: Promise<Record<string, any>> | undefined;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}
const readCache = new Map<string, CacheEntry>();
const READ_CACHE_TTL_MS = 60000;
const FIRESTORE_TIMEOUT_MS = 3000;

export function invalidateStoreCache(key?: string): void {
  globalThis._inFlightFirestorePromise = undefined;
  if (key) {
    readCache.delete(key);
  } else {
    readCache.clear();
  }
}

function readDevInquiries(): ContactInquiry[] {
  if (!fs.existsSync(DEV_INQUIRIES_PATH)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(DEV_INQUIRIES_PATH, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[store] Error reading dev-inquiries.json:', err);
    return [];
  }
}

function writeDevInquiries(inquiries: ContactInquiry[]): void {
  try {
    if (!fs.existsSync(DEV_FILE_DIR)) {
      fs.mkdirSync(DEV_FILE_DIR, { recursive: true });
    }
    const tempFile = `${DEV_INQUIRIES_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(inquiries, null, 2), 'utf-8');
    fs.renameSync(tempFile, DEV_INQUIRIES_PATH);
  } catch (err) {
    console.error('[store] Error writing dev-inquiries.json:', err);
    throw err;
  }
}

function readDevFileStore(): Record<string, any> {
  if (!fs.existsSync(DEV_FILE_PATH)) {
    const seedStore = getSeedStoreFromDisk();
    // Never store customer inquiries in dev-store.json alongside public content
    delete (seedStore as any).inquiries;
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
    const store = JSON.parse(fs.readFileSync(DEV_FILE_PATH, 'utf-8'));
    // If legacy inquiries exist in dev-store.json, migrate them to dev-inquiries.json and purge
    if (Array.isArray(store.inquiries) && store.inquiries.length > 0) {
      const existingInqs = readDevInquiries();
      if (existingInqs.length === 0) {
        writeDevInquiries(store.inquiries);
      }
    }
    delete store.inquiries;
    return store;
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
    // Strictly ensure customer inquiries are never written to dev-store.json
    delete store.inquiries;
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
 * Fetch the entire Firestore active_store document with single-flight deduplication
 * and a 3-second fail-fast timeout. Populates in-memory cache for all keys at once.
 */
async function fetchFirestoreStoreWithDeduplication(): Promise<Record<string, any>> {
  if (globalThis._inFlightFirestorePromise) {
    return await globalThis._inFlightFirestorePromise;
  }

  const promise = (async () => {
    const db = getFirestoreDb();
    const docRef = db.collection('cms_store').doc('active_store');

    // Fail-fast timeout promise (3000ms)
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new FirebaseUnavailableError(`Firestore active_store query timed out after ${FIRESTORE_TIMEOUT_MS}ms`));
      }, FIRESTORE_TIMEOUT_MS);
      if (typeof timer.unref === 'function') timer.unref();
    });

    const docSnap = await Promise.race([docRef.get(), timeoutPromise]);

    if (!docSnap.exists) {
      console.log('[PERF:STORE] active_store doc missing in Firestore');
      return {};
    }

    const data = docSnap.data() || {};
    const now = Date.now();

    // Sensitive data must NEVER sit in active_store or enter general store cache
    delete data.inquiries;
    delete data.admin;
    delete data.gsc_auth;

    // Populate all keys into memory cache so subsequent readKey calls are instantaneous (0ms)
    for (const [k, v] of Object.entries(data)) {
      if (k !== 'lastUpdated' && k !== 'inquiries' && k !== 'admin' && k !== 'gsc_auth') {
        readCache.set(k, { data: normalizeCollectionShape(k, v), timestamp: now });
      }
    }

    return data;
  })().finally(() => {
    globalThis._inFlightFirestorePromise = undefined;
  });

  globalThis._inFlightFirestorePromise = promise;
  return await promise;
}

async function fetchDedicatedCollectionData(key: string): Promise<any | undefined> {
  const db = getFirestoreDb();

  if (key === 'settings' || key === 'navigation' || key === 'brandPartners') {
    const snap = await db.collection('cms_settings').doc('active_settings').get();
    if (snap.exists) {
      const d = snap.data() || {};
      const now = Date.now();
      if (d.settings) readCache.set('settings', { data: normalizeCollectionShape('settings', d.settings), timestamp: now });
      if (d.navigation) readCache.set('navigation', { data: normalizeCollectionShape('navigation', d.navigation), timestamp: now });
      if (d.brandPartners) readCache.set('brandPartners', { data: normalizeCollectionShape('brandPartners', d.brandPartners), timestamp: now });
      return d[key];
    }
  }

  if (key === 'photos') {
    const snap = await db.collection('cms_photos').doc('active_photos').get();
    if (snap.exists) return Array.isArray(snap.data()?.photos) ? snap.data()!.photos : [];
  }

  if (key === 'events') {
    const snap = await db.collection('cms_events').doc('active_events').get();
    if (snap.exists) return Array.isArray(snap.data()?.events) ? snap.data()!.events : [];
  }

  if (key === 'faq') {
    const snap = await db.collection('cms_faq').doc('active_faq').get();
    if (snap.exists) return Array.isArray(snap.data()?.faq) ? snap.data()!.faq : [];
  }

  if (key === 'reviews') {
    const snap = await db.collection('cms_reviews').doc('active_reviews').get();
    if (snap.exists) return Array.isArray(snap.data()?.reviews) ? snap.data()!.reviews : [];
  }

  if (key === 'handwrittenReviews') {
    const snap = await db.collection('cms_reviews').doc('active_handwritten').get();
    if (snap.exists) return Array.isArray(snap.data()?.handwrittenReviews) ? snap.data()!.handwrittenReviews : [];
  }

  if (key === 'services') {
    const snap = await db.collection('cms_services').doc('active_services').get();
    if (snap.exists) return Array.isArray(snap.data()?.services) ? snap.data()!.services : [];
  }

  if (key === 'beyondChapters') {
    const snap = await db.collection('cms_beyond_chapters').doc('active_chapters').get();
    if (snap.exists) return Array.isArray(snap.data()?.beyondChapters) ? snap.data()!.beyondChapters : [];
  }

  if (key === 'admin') {
    const snap = await db.collection('cms_admin').doc('active_admin').get();
    if (snap.exists) return snap.data();
    // Fallback: if not yet migrated to cms_admin, read from active_store
    const legacySnap = await db.collection('cms_store').doc('active_store').get();
    if (legacySnap.exists && legacySnap.data()?.admin) {
      return legacySnap.data()!.admin;
    }
  }

  if (key === 'gsc_auth') {
    const snap = await db.collection('cms_system').doc('gsc_auth').get();
    if (snap.exists) return snap.data();
    // Fallback: if not yet migrated to cms_system, read from active_store
    const legacySnap = await db.collection('cms_store').doc('active_store').get();
    if (legacySnap.exists && legacySnap.data()?.gsc_auth) {
      return legacySnap.data()!.gsc_auth;
    }
  }

  if (key === 'inquiries') {
    const snap = await db.collection('cms_inquiries').get();
    const items = snap.docs.map((doc) => doc.data() as ContactInquiry);
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return items;
  }

  // Check if collection-based migration is complete
  let isMigrated = false;
  try {
    const migrationSnap = await db.collection('cms_system').doc('migration_meta').get();
    isMigrated = migrationSnap.exists && migrationSnap.data()?.migrated === true;
  } catch {
    // If system collection is unreachable, fallback to checking snap emptiness
  }

  if (key === 'blogs') {
    const snap = await db.collection('cms_blogs').get();
    if (!snap.empty || isMigrated) {
      return snap.docs.map((doc) => doc.data());
    }
  }

  if (key === 'experiences') {
    const snap = await db.collection('cms_experiences').get();
    if (!snap.empty || isMigrated) {
      return snap.docs.map((doc) => doc.data());
    }
  }

  if (key === 'destinations') {
    const snap = await db.collection('cms_destinations').get();
    if (!snap.empty || isMigrated) {
      return snap.docs.map((doc) => doc.data());
    }
  }

  return undefined;
}

/**
 * Internal implementation of readKey.
 */
async function readKeyInternal<T = any>(key: string, options?: { throwOnError?: boolean }): Promise<T> {
  const cached = readCache.get(key);
  if (cached && Date.now() - cached.timestamp < READ_CACHE_TTL_MS) {
    return cached.data as T;
  }

  const provider = getActiveStorageProvider();

  // 1. File storage mode (offline dev without Firebase credentials)
  if (provider === 'file') {
    if (key === 'inquiries') {
      const inqs = readDevInquiries();
      readCache.set('inquiries', { data: inqs, timestamp: Date.now() });
      return inqs as unknown as T;
    }
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
    let val: any = undefined;
    try {
      val = await fetchDedicatedCollectionData(key);
    } catch (collErr) {
      console.warn(`[store] Dedicated collection fetch failed for ${key}, falling back to active_store:`, collErr);
    }

    if (val === undefined) {
      if (key === 'inquiries') {
        val = [];
      } else {
        const storeData = await fetchFirestoreStoreWithDeduplication();
        val = storeData[key];
      }
    }

    if (val === undefined) {
      if (key === 'inquiries') {
        val = [];
      } else {
        val = getSeedForKey(key);
      }
    }

    const res = normalizeCollectionShape(key, val) as T;
    readCache.set(key, { data: res, timestamp: Date.now() });
    return res;
  } catch (err: any) {
    if (options?.throwOnError) {
      throw err;
    }
    console.warn(`[store] read ${key} failed on Firestore (falling back to seed):`, err?.message || err);
    if (key === 'inquiries') {
      return [] as unknown as T;
    }
    const seedVal = getSeedForKey(key);
    const res = normalizeCollectionShape(key, seedVal) as T;
    readCache.set(key, { data: res, timestamp: Date.now() });
    return res;
  }
}

/**
 * Request-level memoized readKey with React cache().
 * Dispatches to Firebase Firestore (primary) or local dev-store.json file (offline dev).
 */
export const readKey = safeCache(async function readKey<T = any>(
  key: string,
  options?: { throwOnError?: boolean }
): Promise<T> {
  return await readKeyInternal<T>(key, options);
});

/**
 * Write a single collection key to Firestore.
 */
export async function writeKey<T = any>(key: string, value: T): Promise<void> {
  if (process.env.VERCEL_ENV === 'preview' && process.env.ALLOW_PREVIEW_WRITES !== 'true') {
    throw new Error('Vercel Preview environment is read-only. Database writes are blocked unless ALLOW_PREVIEW_WRITES=true.');
  }

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

  // A. Primary write to dedicated collections (MUST succeed; any failure throws and aborts request)
  if (key === 'inquiries') {
    if (Array.isArray(value)) {
      const batch = db.batch();
      for (const inq of value) {
        if (inq && inq.id) {
          batch.set(db.collection('cms_inquiries').doc(inq.id), { ...inq, updatedAt: lastUpdated }, { merge: true });
        }
      }
      await batch.commit();
    }
    return; // Complete: customer inquiries are strictly separated and NEVER mirrored to active_store!
  } else if (key === 'admin') {
    await db.collection('cms_admin').doc('active_admin').set(value as any, { merge: true });
    // Mirror to active_store for 14-day transition so rollback to old code remains 100% functional
    try {
      await db.collection('cms_store').doc('active_store').set({ admin: value, lastUpdated }, { merge: true });
    } catch (mirrorErr) {
      console.warn('[store:mirror] Mirror admin write to active_store failed:', mirrorErr);
    }
    return;
  } else if (key === 'gsc_auth') {
    await db.collection('cms_system').doc('gsc_auth').set((value || {}) as any, { merge: false });
    // Mirror to active_store for 14-day transition so rollback to old code remains 100% functional
    try {
      await db.collection('cms_store').doc('active_store').set({ gsc_auth: value || {}, lastUpdated }, { merge: true });
    } catch (mirrorErr) {
      console.warn('[store:mirror] Mirror gsc_auth write to active_store failed:', mirrorErr);
    }
    return;
  } else if (key === 'settings' || key === 'navigation' || key === 'brandPartners') {
    await db.collection('cms_settings').doc('active_settings').set({ [key]: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'photos') {
    await db.collection('cms_photos').doc('active_photos').set({ photos: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'events') {
    await db.collection('cms_events').doc('active_events').set({ events: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'faq') {
    await db.collection('cms_faq').doc('active_faq').set({ faq: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'reviews') {
    await db.collection('cms_reviews').doc('active_reviews').set({ reviews: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'handwrittenReviews') {
    await db.collection('cms_reviews').doc('active_handwritten').set({ handwrittenReviews: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'services') {
    await db.collection('cms_services').doc('active_services').set({ services: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'beyondChapters') {
    await db.collection('cms_beyond_chapters').doc('active_chapters').set({ beyondChapters: value, updatedAt: lastUpdated }, { merge: true });
  } else if (key === 'blogs' && Array.isArray(value)) {
    const existingSnap = await db.collection('cms_blogs').get();
    const newSlugs = new Set(value.map((b) => b?.slug).filter(Boolean));
    const batch = db.batch();
    for (const doc of existingSnap.docs) {
      if (!newSlugs.has(doc.id)) {
        batch.delete(doc.ref);
      }
    }
    for (const blog of value) {
      if (blog && blog.slug) {
        batch.set(db.collection('cms_blogs').doc(blog.slug), { ...blog, updatedAt: lastUpdated }, { merge: true });
      }
    }
    await batch.commit();
  } else if (key === 'experiences' && Array.isArray(value)) {
    const existingSnap = await db.collection('cms_experiences').get();
    const newSlugs = new Set(value.map((e) => e?.slug).filter(Boolean));
    const batch = db.batch();
    for (const doc of existingSnap.docs) {
      if (!newSlugs.has(doc.id)) {
        batch.delete(doc.ref);
      }
    }
    for (const exp of value) {
      if (exp && exp.slug) {
        batch.set(db.collection('cms_experiences').doc(exp.slug), { ...exp, updatedAt: lastUpdated }, { merge: true });
      }
    }
    await batch.commit();
  } else if (key === 'destinations' && Array.isArray(value)) {
    const existingSnap = await db.collection('cms_destinations').get();
    const newSlugs = new Set(value.map((d) => d?.slug).filter(Boolean));
    const batch = db.batch();
    for (const doc of existingSnap.docs) {
      if (!newSlugs.has(doc.id)) {
        batch.delete(doc.ref);
      }
    }
    for (const dest of value) {
      if (dest && dest.slug) {
        batch.set(db.collection('cms_destinations').doc(dest.slug), { ...dest, updatedAt: lastUpdated }, { merge: true });
      }
    }
    await batch.commit();
  }

  // B. Secondary best-effort mirror write to active_store for backward compatibility
  // STRICT ALLOWLIST: only approved public CMS keys are ever mirrored.
  // Sensitive keys (admin, gsc_auth, inquiries, tokens, passwordHash) can NEVER be mirrored.
  const ALLOWED_ACTIVE_STORE_MIRROR_KEYS = new Set([
    'blogs',
    'experiences',
    'destinations',
    'photos',
    'events',
    'reviews',
    'handwrittenReviews',
    'services',
    'faq',
    'settings',
    'navigation',
    'brandPartners',
    'pages',
    'beyondChapters',
  ]);

  if (ALLOWED_ACTIVE_STORE_MIRROR_KEYS.has(key)) {
    try {
      const docRef = db.collection('cms_store').doc('active_store');
      await docRef.set({ [key]: value, lastUpdated }, { merge: true });
    } catch (legacyErr: any) {
      console.warn(`[store:mirror] Mirror write to active_store failed for key=${key} (primary write succeeded):`, legacyErr?.message || legacyErr);
    }
  }
}

/**
 * Push an inquiry to the dedicated collection atomically.
 * Customer PII is stored strictly isolated from public content.
 */
export async function pushInquiry(inquiry: ContactInquiry): Promise<void> {
  if (process.env.VERCEL_ENV === 'preview' && process.env.ALLOW_PREVIEW_WRITES !== 'true') {
    throw new Error('Vercel Preview environment is read-only. Inquiries are blocked unless ALLOW_PREVIEW_WRITES=true.');
  }

  invalidateStoreCache('inquiries');
  const lastUpdated = new Date().toISOString();
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const list = readDevInquiries();
    list.unshift(inquiry);
    writeDevInquiries(list);
    return;
  }

  const db = getFirestoreDb();
  // Write SOLELY to isolated cms_inquiries collection - NEVER touch active_store!
  await db.collection('cms_inquiries').doc(inquiry.id).set({ ...inquiry, lastUpdated }, { merge: true });
}

/**
 * Atomic inquiry update in dedicated Firestore collection.
 */
export async function updateInquiryById(id: string, updates: Partial<ContactInquiry>): Promise<boolean> {
  invalidateStoreCache('inquiries');
  const lastUpdated = new Date().toISOString();
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const list = readDevInquiries();
    const idx = list.findIndex((inq: any) => inq.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: lastUpdated };
    writeDevInquiries(list);
    return true;
  }

  const db = getFirestoreDb();
  // Update SOLELY in dedicated cms_inquiries collection - NEVER touch active_store!
  await db.collection('cms_inquiries').doc(id).set({ ...updates, updatedAt: lastUpdated }, { merge: true });
  return true;
}

/**
 * Atomic inquiry deletion from dedicated Firestore collection.
 */
export async function deleteInquiryById(id: string): Promise<boolean> {
  invalidateStoreCache('inquiries');
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const list = readDevInquiries();
    const initialLen = list.length;
    const filtered = list.filter((inq: any) => inq.id !== id);
    if (filtered.length !== initialLen) {
      writeDevInquiries(filtered);
      return true;
    }
    return false;
  }

  const db = getFirestoreDb();
  // Delete SOLELY from dedicated cms_inquiries collection - NEVER touch active_store!
  await db.collection('cms_inquiries').doc(id).delete();
  return true;
}

/**
 * Concurrency-safe array document mutation using Firestore transactions.
 * Prevents race condition overwrites when multiple admins save simultaneously.
 */
export async function runTransactionalArrayMutation<T = any>(
  key: string,
  mutator: (current: T[]) => T[] | Promise<T[]>
): Promise<T[]> {
  invalidateStoreCache(key);
  const provider = getActiveStorageProvider();

  if (provider === 'file') {
    const store = readDevFileStore();
    runPendingFileMigrations(store);
    const current = (store[key] as T[]) || [];
    const updated = await mutator(current);
    store[key] = updated;
    store.lastUpdated = new Date().toISOString();
    writeDevFileStore(store);
    return updated;
  }

  const db = getFirestoreDb();
  const lastUpdated = new Date().toISOString();

  const targetMap: Record<string, { collection: string; doc: string; field: string }> = {
    photos: { collection: 'cms_photos', doc: 'active_photos', field: 'photos' },
    events: { collection: 'cms_events', doc: 'active_events', field: 'events' },
    faq: { collection: 'cms_faq', doc: 'active_faq', field: 'faq' },
    reviews: { collection: 'cms_reviews', doc: 'active_reviews', field: 'reviews' },
    handwrittenReviews: { collection: 'cms_reviews', doc: 'active_handwritten', field: 'handwrittenReviews' },
    services: { collection: 'cms_services', doc: 'active_services', field: 'services' },
    beyondChapters: { collection: 'cms_beyond_chapters', doc: 'active_chapters', field: 'beyondChapters' },
    brandPartners: { collection: 'cms_settings', doc: 'active_settings', field: 'brandPartners' },
    navigation: { collection: 'cms_settings', doc: 'active_settings', field: 'navigation' },
    settings: { collection: 'cms_settings', doc: 'active_settings', field: 'settings' },
  };

  const target = targetMap[key];
  if (!target) {
    const current = (await readKey<T[]>(key)) || [];
    const updated = await mutator(current);
    await writeKey(key, updated);
    return updated;
  }

  const docRef = db.collection(target.collection).doc(target.doc);
  const legacyRef = db.collection('cms_store').doc('active_store');

  return await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(docRef);
    let current: T[] = [];
    if (snap.exists && snap.data()?.[target.field]) {
      current = snap.data()![target.field];
    } else {
      const legacySnap = await transaction.get(legacyRef);
      if (legacySnap.exists && legacySnap.data()?.[key]) {
        current = legacySnap.data()![key];
      }
    }

    const updated = await mutator(Array.isArray(current) ? [...current] : []);

    transaction.set(docRef, { [target.field]: updated, updatedAt: lastUpdated }, { merge: true });
    if (key !== 'inquiries') {
      transaction.set(legacyRef, { [key]: updated, lastUpdated }, { merge: true });
    }

    return updated;
  });
}
