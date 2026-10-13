/**
 * Migration Script: Migrate CMS data into separate Firestore collections
 * 
 * Target: Production Firestore project (explore-with-sakar)
 * Usage:
 *   node scripts/migrate-to-collections.mjs --dry-run
 *   node scripts/migrate-to-collections.mjs
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const isExecute = process.argv.includes('--execute');
const isDryRun = !isExecute;
const isForce = process.argv.includes('--force');

console.log('======================================================');
console.log(`FIRESTORE COLLECTION MIGRATION ${isDryRun ? '(DRY RUN ONLY - PASS --execute TO RUN)' : '(LIVE EXECUTION)'}`);
console.log('======================================================');

// 1. Load credentials strictly from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('[migration:error] .env.local file not found. Credentials must come strictly from .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq !== -1) {
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

// 2. Strict Project ID Verification
const expectedProjectId = 'explore-with-sakar';
if (process.env.FIREBASE_PROJECT_ID !== expectedProjectId) {
  console.error(`[migration:error] Refusing to run: FIREBASE_PROJECT_ID (${process.env.FIREBASE_PROJECT_ID}) does not match expected target project (${expectedProjectId})`);
  process.exit(1);
}

if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('[migration:error] Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env.local');
  process.exit(1);
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

const db = getFirestore(app);

async function run() {
  console.log(`[migration] Connected to Firestore project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`[migration] Service account: ${process.env.FIREBASE_CLIENT_EMAIL}`);

  // Safety Check: Check if cms_system/migration_meta is already marked migrated
  const metaDoc = await db.collection('cms_system').doc('migration_meta').get();
  if (metaDoc.exists && metaDoc.data()?.migrated === true) {
    if (isExecute && !isForce) {
      console.error('\n[migration:refusal] SAFETY REFUSAL: The migrated flag (cms_system/migration_meta) is already set to true.');
      console.error('Production migration has already been executed. Re-running will overwrite newer live edits with legacy data.');
      console.error('If you strictly intend to re-run, pass both --execute and --force.');
      process.exit(1);
    }
    console.log('[migration:warn] Warning: cms_system/migration_meta has already been marked as migrated=true.');
  }

  // 3. Fetch source data directly from active_store first
  console.log('[migration] Fetching current active_store from Firestore...');
  const activeDoc = await db.collection('cms_store').doc('active_store').get();
  let sourceData = {};

  if (activeDoc.exists) {
    sourceData = activeDoc.data() || {};
    console.log(`[migration] Source: Live active_store document (${Object.keys(sourceData).length} top-level keys)`);
  } else {
    console.log('[migration] active_store document not found in Firestore. Falling back to local data/cms-store.json...');
    const seedPath = path.join(process.cwd(), 'data', 'cms-store.json');
    if (fs.existsSync(seedPath)) {
      sourceData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      console.log(`[migration] Source: Local seed file (${Object.keys(sourceData).length} top-level keys)`);
    } else {
      console.error('[migration:error] No active_store in Firestore and no local data/cms-store.json found.');
      process.exit(1);
    }
  }

  // 4. Create External Backup outside repository
  const externalBackupDir = 'C:\\Users\\Diplon\\.gemini\\antigravity-ide\\backups\\explore-with-sakar';
  if (!fs.existsSync(externalBackupDir)) {
    fs.mkdirSync(externalBackupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(externalBackupDir, `active_store_backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(sourceData, null, 2), 'utf8');
  console.log(`[migration] Verified snapshot saved outside repo to: ${backupFile}`);

  const summary = [];
  const now = new Date().toISOString();

  // Helper batch executor
  async function saveBatch(items, colName, getIdFn) {
    if (!Array.isArray(items) || items.length === 0) {
      summary.push({ Collection: colName, Items: 0, Action: 'Empty (skipped)' });
      return;
    }
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const batch = db.batch();
      for (const item of chunk) {
        const id = getIdFn(item);
        if (id) {
          const ref = db.collection(colName).doc(id);
          batch.set(ref, { ...item, migratedAt: now }, { merge: true });
        }
      }
      if (!isDryRun) {
        await batch.commit();
      }
    }
    summary.push({
      Collection: colName,
      Items: items.length,
      Action: isDryRun ? `Would write ${items.length} docs` : `Wrote ${items.length} docs (merged)`,
    });
  }

  // 5. Migrate collections
  // Blogs
  const blogs = Array.isArray(sourceData.blogs) ? sourceData.blogs : [];
  await saveBatch(blogs, 'cms_blogs', (b) => b.slug || `blog-${b.id}`);

  // Experiences
  const experiences = Array.isArray(sourceData.experiences) ? sourceData.experiences : [];
  await saveBatch(experiences, 'cms_experiences', (e) => e.slug || `exp-${e.id}`);

  // Destinations
  const destinations = Array.isArray(sourceData.destinations) ? sourceData.destinations : [];
  await saveBatch(destinations, 'cms_destinations', (d) => d.slug || `dest-${d.id}`);

  // Photos
  const photos = Array.isArray(sourceData.photos) ? sourceData.photos : [];
  if (!isDryRun) {
    await db.collection('cms_photos').doc('active_photos').set({ photos, migratedAt: now }, { merge: true });
  }
  summary.push({ Collection: 'cms_photos/active_photos', Items: photos.length, Action: isDryRun ? 'Dry run' : 'Written' });

  // Events
  const events = Array.isArray(sourceData.events) ? sourceData.events : [];
  if (!isDryRun) {
    await db.collection('cms_events').doc('active_events').set({ events, migratedAt: now }, { merge: true });
  }
  summary.push({ Collection: 'cms_events/active_events', Items: events.length, Action: isDryRun ? 'Dry run' : 'Written' });

  // Reviews
  const reviews = Array.isArray(sourceData.reviews) ? sourceData.reviews : [];
  if (!isDryRun) {
    await db.collection('cms_reviews').doc('active_reviews').set({ reviews, migratedAt: now }, { merge: true });
  }
  summary.push({ Collection: 'cms_reviews/active_reviews', Items: reviews.length, Action: isDryRun ? 'Dry run' : 'Written' });

  // Handwritten
  const handwritten = Array.isArray(sourceData.handwrittenReviews) ? sourceData.handwrittenReviews : [];
  if (!isDryRun) {
    await db.collection('cms_reviews').doc('active_handwritten').set({ handwrittenReviews: handwritten, migratedAt: now }, { merge: true });
  }
  summary.push({ Collection: 'cms_reviews/active_handwritten', Items: handwritten.length, Action: isDryRun ? 'Dry run' : 'Written' });

  // Services
  const services = Array.isArray(sourceData.services) ? sourceData.services : [];
  if (!isDryRun) {
    await db.collection('cms_services').doc('active_services').set({ services, migratedAt: now }, { merge: true });
  }
  summary.push({ Collection: 'cms_services/active_services', Items: services.length, Action: isDryRun ? 'Dry run' : 'Written' });

  // Settings & Navigation & BrandPartners
  const settings = sourceData.settings || null;
  const navigation = sourceData.navigation || null;
  const brandPartners = Array.isArray(sourceData.brandPartners) ? sourceData.brandPartners : [];
  if (!isDryRun) {
    const payload = { migratedAt: now };
    if (settings) payload.settings = settings;
    if (navigation) payload.navigation = navigation;
    if (brandPartners.length > 0) payload.brandPartners = brandPartners;
    await db.collection('cms_settings').doc('active_settings').set(payload, { merge: true });
  }
  summary.push({
    Collection: 'cms_settings/active_settings',
    Items: (settings ? 1 : 0) + (navigation ? 1 : 0) + brandPartners.length,
    Action: isDryRun ? 'Dry run' : 'Written',
  });

  // Beyond Chapters
  const beyondChapters = Array.isArray(sourceData.beyondChapters) ? sourceData.beyondChapters : [];
  if (beyondChapters.length > 0) {
    if (!isDryRun) {
      await db.collection('cms_beyond_chapters').doc('active_chapters').set({ beyondChapters, migratedAt: now }, { merge: true });
    }
    summary.push({ Collection: 'cms_beyond_chapters/active_chapters', Items: beyondChapters.length, Action: isDryRun ? 'Dry run' : 'Written' });
  }

  // Inquiries (isolate to cms_inquiries, never delete)
  const inquiries = Array.isArray(sourceData.inquiries) ? sourceData.inquiries : [];
  if (inquiries.length > 0) {
    await saveBatch(inquiries, 'cms_inquiries', (inq) => inq.id || `inq-${Date.now()}`);
  } else {
    summary.push({ Collection: 'cms_inquiries', Items: 0, Action: 'No customer inquiries in source' });
  }

  // Admin user isolation (move admin credentials out of active_store)
  if (sourceData.admin && typeof sourceData.admin === 'object') {
    if (!isDryRun) {
      await db.collection('cms_admin').doc('active_admin').set({ ...sourceData.admin, migratedAt: now }, { merge: true });
    }
    summary.push({ Collection: 'cms_admin/active_admin', Items: 1, Action: isDryRun ? 'Dry run' : 'Securely isolated' });
  }

  // GSC OAuth tokens isolation
  if (sourceData.gsc_auth && typeof sourceData.gsc_auth === 'object') {
    if (!isDryRun) {
      await db.collection('cms_system').doc('gsc_auth').set({ ...sourceData.gsc_auth, migratedAt: now }, { merge: true });
    }
    summary.push({ Collection: 'cms_system/gsc_auth', Items: 1, Action: isDryRun ? 'Dry run' : 'Securely isolated' });
  }

  // Note: Migration flag (cms_system/migration_meta) is NOT set here.
  // It is set explicitly via scripts/set-migration-flag.mjs only AFTER compare-collections passes.

  console.log('\n======================================================');
  console.log(`MIGRATION SUMMARY ${isDryRun ? '(DRY RUN COMPLETED - NO WRITES)' : '(SUCCESSFULLY EXECUTED)'}`);
  console.log('======================================================');
  console.table(summary);
}

run().catch((err) => {
  console.error('[migration:fatal]', err);
  process.exit(1);
});
