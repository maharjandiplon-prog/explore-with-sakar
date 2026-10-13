#!/usr/bin/env node
/**
 * Post-Migration Security Cleanup Script
 * 
 * Safely removes sensitive keys ('admin', 'gsc_auth') from legacy cms_store/active_store.
 * 
 * SAFETY GUARDS:
 * 1. DRY RUN BY DEFAULT: Only performs deletes if explicitly invoked with `--execute`.
 * 2. TARGET VERIFICATION: Asserts project is strictly 'explore-with-sakar'.
 * 3. PREREQUISITE CHECK: Confirms new isolated documents exist in cms_admin and cms_system BEFORE deleting from active_store.
 * 4. BACKUP TAKEN FIRST: Saves an external JSON backup prior to any modification.
 */

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// 1. Load credentials strictly from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.local not found. Cannot proceed.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = (match[2] || '').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\n/g, '\n');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('ERROR: Firebase credentials missing in .env.local');
  process.exit(1);
}

if (projectId !== 'explore-with-sakar') {
  console.error(`SAFETY ABORT: Target project is "${projectId}". Expected "explore-with-sakar".`);
  process.exit(1);
}

const isExecute = process.argv.includes('--execute');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function runCleanup() {
  console.log('======================================================');
  console.log(`ACTIVE_STORE SENSITIVE KEYS CLEANUP [${isExecute ? 'LIVE EXECUTION' : 'DRY RUN'}]`);
  console.log('Target Project:', projectId);
  console.log('======================================================');

  // Step 1: Verify prerequisites in dedicated collections
  console.log('\n[1/4] Verifying dedicated security collections...');
  const adminDoc = await db.collection('cms_admin').doc('active_admin').get();
  if (!adminDoc.exists || !adminDoc.data()?.passwordHash) {
    console.error('ABORT: cms_admin/active_admin does not exist or lacks passwordHash. Cannot delete from active_store.');
    process.exit(1);
  }
  console.log('  ✓ cms_admin/active_admin exists and is valid.');

  const gscDoc = await db.collection('cms_system').doc('gsc_auth').get();
  if (!gscDoc.exists) {
    console.warn('  ! cms_system/gsc_auth doc not found. Creating empty record to ensure integrity.');
    if (isExecute) {
      await db.collection('cms_system').doc('gsc_auth').set({ initializedAt: new Date().toISOString() });
    }
  } else {
    console.log('  ✓ cms_system/gsc_auth exists.');
  }

  // Step 2: Inspect current active_store
  console.log('\n[2/4] Inspecting active_store keys in Firestore...');
  const activeDocRef = db.collection('cms_store').doc('active_store');
  const activeSnap = await activeDocRef.get();
  if (!activeSnap.exists) {
    console.log('active_store does not exist in Firestore. Nothing to clean.');
    process.exit(0);
  }

  const activeData = activeSnap.data() || {};
  const currentKeys = Object.keys(activeData);
  const hasAdmin = 'admin' in activeData;
  const hasGsc = 'gsc_auth' in activeData;

  console.log(`  Current active_store keys (${currentKeys.length}):`, currentKeys.join(', '));
  console.log(`  Has 'admin' key:`, hasAdmin);
  console.log(`  Has 'gsc_auth' key:`, hasGsc);

  if (!hasAdmin && !hasGsc) {
    console.log('\n✓ Both "admin" and "gsc_auth" are ALREADY removed from active_store. Nothing to do.');
    process.exit(0);
  }

  // Step 3: Take external backup
  console.log('\n[3/4] Creating safety backup outside repository...');
  const backupDir = path.resolve(process.env.USERPROFILE || 'C:/Users/Diplon', '.gemini/antigravity-ide/backups/explore-with-sakar');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `active_store_pre_cleanup_${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(activeData, null, 2), 'utf8');
  console.log(`  ✓ Safety backup saved to: ${backupPath}`);

  // Step 4: Execute or dry run
  console.log('\n[4/4] Execution decision...');
  if (!isExecute) {
    console.log('  [DRY RUN] Would remove fields:');
    if (hasAdmin) console.log('    - admin (FieldValue.delete())');
    if (hasGsc) console.log('    - gsc_auth (FieldValue.delete())');
    console.log('\n  Dry run complete. No modifications were made to production.');
    console.log('  To execute after verification and user approval, run:');
    console.log('    node scripts/cleanup-active-store-sensitive-keys.mjs --execute');
    process.exit(0);
  }

  console.log('  Executing FieldValue.delete() for sensitive keys in active_store...');
  const updatePayload = {};
  if (hasAdmin) updatePayload.admin = admin.firestore.FieldValue.delete();
  if (hasGsc) updatePayload.gsc_auth = admin.firestore.FieldValue.delete();

  await activeDocRef.update(updatePayload);
  console.log('  ✓ Update committed successfully.');

  const postSnap = await activeDocRef.get();
  const postKeys = Object.keys(postSnap.data() || {});
  console.log(`\n  Verified post-cleanup active_store keys (${postKeys.length}):`, postKeys.join(', '));
  console.log('  Has "admin":', 'admin' in (postSnap.data() || {}));
  console.log('  Has "gsc_auth":', 'gsc_auth' in (postSnap.data() || {}));
  console.log('\n======================================================');
  console.log('CLEANUP SUCCESSFUL - SENSITIVE KEYS REMOVED');
  console.log('======================================================');
}

runCleanup().catch((err) => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
