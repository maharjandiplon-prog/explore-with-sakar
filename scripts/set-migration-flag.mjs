/**
 * Explicit command to set the migrated flag in Firestore.
 * 
 * Must ONLY be run AFTER:
 * 1. Migration to collections completes.
 * 2. compare-collections.mjs passes with zero mismatches.
 * 
 * Usage:
 *   node scripts/set-migration-flag.mjs            # Dry run / Status check
 *   node scripts/set-migration-flag.mjs --execute  # Write flag to Firestore
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const isExecute = process.argv.includes('--execute');
const isDryRun = !isExecute;

console.log('======================================================');
console.log(`SET MIGRATION FLAG: cms_system/migration_meta ${isDryRun ? '(DRY RUN - STATUS CHECK)' : '(LIVE EXECUTION)'}`);
console.log('======================================================');

// 1. Load credentials strictly from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('[flag:error] .env.local file not found.');
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

const expectedProjectId = 'explore-with-sakar';
if (process.env.FIREBASE_PROJECT_ID !== expectedProjectId) {
  console.error(`[flag:error] Refusing to run: FIREBASE_PROJECT_ID (${process.env.FIREBASE_PROJECT_ID}) != ${expectedProjectId}`);
  process.exit(1);
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
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
  const docRef = db.collection('cms_system').doc('migration_meta');
  const snap = await docRef.get();

  console.log(`[flag] Connected to Firestore project: ${process.env.FIREBASE_PROJECT_ID}`);
  if (snap.exists) {
    console.log('[flag] Current cms_system/migration_meta document:');
    console.log(JSON.stringify(snap.data(), null, 2));
  } else {
    console.log('[flag] cms_system/migration_meta does not currently exist.');
  }

  const now = new Date().toISOString();
  const payload = {
    migrated: true,
    migratedAt: now,
    project: expectedProjectId,
  };

  if (isDryRun) {
    console.log('\n[flag:dry-run] Would write the following payload to cms_system/migration_meta:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\nTo execute live, run:');
    console.log('  node scripts/set-migration-flag.mjs --execute');
  } else {
    await docRef.set(payload, { merge: true });
    console.log('\n✅ [flag:success] cms_system/migration_meta has been successfully set:');
    console.log(JSON.stringify(payload, null, 2));
  }
}

run().catch((err) => {
  console.error('[flag:fatal]', err);
  process.exit(1);
});
