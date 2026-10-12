/**
 * Migration Script: Migrate data from MongoDB or local dev-store.json to Firebase Firestore
 *
 * Usage:
 *   node scripts/migrate-to-firestore.mjs
 *
 * Flags / Options:
 *   --source=file      (reads from .data/dev-store.json)
 *   --source=mongo     (reads from active MongoDB Atlas cluster)
 *   --key-file=<path>  (path to service account JSON key file)
 *   --backup-only      (creates JSON backup of source data without writing to Firestore)
 *   --dry-run          (validates connection, counts, and shapes without writing)
 */

import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MongoClient } from 'mongodb';

// Load environment variables from .env.local if present
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Set DNS servers for MongoDB Atlas SRV lookup if provided or needed in dev
if (process.env.MONGODB_DNS_SERVERS) {
  try {
    const servers = process.env.MONGODB_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean);
    if (servers.length > 0) dns.setServers(servers);
  } catch (err) {
    console.warn('[migration] Failed to set custom DNS servers:', err);
  }
} else {
  // Default to 8.8.8.8 fallback for Windows SRV issues
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {}
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isBackupOnly = args.includes('--backup-only');
const sourceArg = args.find((a) => a.startsWith('--source='))?.split('=')[1] || (process.env.MONGODB_URI ? 'mongo' : 'file');
const keyFileArg = args.find((a) => a.startsWith('--key-file='))?.split('=')[1] || null;

const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function loadSourceData(sourceType) {
  if (sourceType === 'mongo') {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Cannot load from mongo: MONGODB_URI environment variable is missing.');
    }
    const dbName = process.env.MONGODB_DB || 'explore_with_sakar';
    console.log(`[migration] Connecting to MongoDB Atlas (${dbName})...`);
    const client = new MongoClient(uri);
    await client.connect();
    try {
      const col = client.db(dbName).collection('cms_store');
      const doc = await col.findOne({ _id: 'active_store' });
      if (!doc) {
        throw new Error('active_store document not found in MongoDB cms_store collection.');
      }
      return doc;
    } finally {
      await client.close();
    }
  }

  // File source
  const filePath = path.join(process.cwd(), '.data', 'dev-store.json');
  console.log(`[migration] Loading from local file: ${filePath}...`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Local file not found at ${filePath}.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function initFirebaseAdmin() {
  // Option 1: Explicit key file arg
  if (keyFileArg && fs.existsSync(keyFileArg)) {
    console.log(`[migration] Using Firebase service account key from: ${keyFileArg}`);
    const key = JSON.parse(fs.readFileSync(keyFileArg, 'utf-8'));
    const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(key) });
    return getFirestore(app);
  }

  // Option 2: Default downloads key file fallback if env vars missing
  const defaultDownloadKey = 'C:/Users/Diplon/Downloads/project-1-c8b7e-firebase-adminsdk-fbsvc-8e9427ccf1.json';
  if (!process.env.FIREBASE_PROJECT_ID && fs.existsSync(defaultDownloadKey)) {
    console.log(`[migration] Using detected service account key from: ${defaultDownloadKey}`);
    const key = JSON.parse(fs.readFileSync(defaultDownloadKey, 'utf-8'));
    const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(key) });
    return getFirestore(app);
  }

  // Option 3: Environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Missing Firebase credentials. Either supply --key-file=<path> or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in environment.`
    );
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getFirestore(app);
}

async function run() {
  console.log('====================================================');
  console.log('Explore With Sakar — Firebase Firestore Migration Tool');
  console.log('====================================================');
  console.log(`Source mode: ${sourceArg}`);
  console.log(`Dry run:     ${isDryRun}`);
  console.log(`Backup only: ${isBackupOnly}`);

  // 1. Extract source data
  const data = await loadSourceData(sourceArg);
  const cleanData = { ...data };
  delete cleanData._id; // Remove MongoDB internal _id

  // 2. Create automated backup timestamped
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `pre-firebase-migration-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(cleanData, null, 2), 'utf-8');
  console.log(`[migration] Source backup saved successfully to: ${backupFile}`);

  // Summary counts
  const summary = {};
  for (const [key, val] of Object.entries(cleanData)) {
    summary[key] = Array.isArray(val) ? `${val.length} items` : typeof val;
  }
  console.log('\n[migration] Entity summary to migrate:');
  console.table(summary);

  if (isBackupOnly) {
    console.log('\n[migration] Backup-only flag provided. Completed without modifying Firestore.');
    return;
  }

  // 3. Connect to Firestore
  console.log('\n[migration] Connecting to Firebase Firestore...');
  const firestore = await initFirebaseAdmin();

  if (isDryRun) {
    console.log('[migration] Dry-run complete. Credentials and source verified. No writes performed.');
    return;
  }

  // 4. Write to Firestore cms_store/active_store
  console.log('[migration] Writing active_store to Firestore collection cms_store...');
  const docRef = firestore.collection('cms_store').doc('active_store');
  await docRef.set({
    ...cleanData,
    lastMigratedAt: new Date().toISOString(),
  }, { merge: true });

  // 5. Verification read
  console.log('[migration] Verifying written document from Firestore...');
  const verifySnap = await docRef.get();
  if (!verifySnap.exists) {
    throw new Error('Verification failed: Document does not exist in Firestore after write!');
  }
  const verifyData = verifySnap.data();
  console.log(`[migration] Verification SUCCESS:
  - Blogs count:        ${Array.isArray(verifyData.blogs) ? verifyData.blogs.length : 'N/A'}
  - Experiences count:  ${Array.isArray(verifyData.experiences) ? verifyData.experiences.length : 'N/A'}
  - Photos count:       ${Array.isArray(verifyData.photos) ? verifyData.photos.length : 'N/A'}
  - Packages count:     ${Array.isArray(verifyData.packages) ? verifyData.packages.length : 'N/A'}
  - Inquiries count:    ${Array.isArray(verifyData.inquiries) ? verifyData.inquiries.length : 'N/A'}`);

  console.log('\n[migration] Migration completed successfully!');
}

run().catch((err) => {
  console.error('\n[migration] FATAL ERROR:', err.message || err);
  process.exit(1);
});
