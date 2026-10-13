/**
 * Deep Comparison Script: Compares content (SHA-256 content hashes)
 * between active_store and dedicated Firestore collections.
 * 
 * Usage:
 *   node scripts/compare-collections.mjs
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Load .env.local strictly
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
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
}

console.log('======================================================');
console.log('DEEP CONTENT COMPARISON AUDIT (HASH-BASED)');
console.log('Target Project:', process.env.FIREBASE_PROJECT_ID);
console.log('======================================================');

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

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

// Hash helper: normalizes objects and ignores metadata timestamps
function hashItem(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const cleaned = { ...obj };
  delete cleaned.migratedAt;
  delete cleaned.lastUpdated;
  delete cleaned.updatedAt;
  // sort keys for deterministic hash
  const sortedKeys = Object.keys(cleaned).sort();
  const sortedObj = {};
  for (const k of sortedKeys) {
    sortedObj[k] = cleaned[k];
  }
  return crypto.createHash('sha256').update(JSON.stringify(sortedObj)).digest('hex').slice(0, 12);
}

async function runAudit() {
  const activeDoc = await db.collection('cms_store').doc('active_store').get();
  if (!activeDoc.exists) {
    console.error('[audit:error] active_store does not exist in Firestore!');
    process.exit(1);
  }

  const activeData = activeDoc.data() || {};
  const results = [];

  // Helper to compare collections of docs
  async function compareDocCollection(colName, activeArray, getIdFn) {
    const colSnap = await db.collection(colName).get();
    const colDocsMap = new Map();
    for (const doc of colSnap.docs) {
      colDocsMap.set(doc.id, doc.data());
    }

    let matches = 0;
    let contentMismatches = 0;
    let missingInCol = 0;

    for (const item of activeArray) {
      const id = getIdFn(item);
      const colDoc = colDocsMap.get(id);
      if (!colDoc) {
        missingInCol++;
      } else {
        const hashA = hashItem(item);
        const hashB = hashItem(colDoc);
        if (hashA === hashB) {
          matches++;
        } else {
          contentMismatches++;
        }
      }
    }

    results.push({
      Collection: colName,
      ActiveCount: activeArray.length,
      ColCount: colSnap.size,
      HashMatches: matches,
      HashMismatches: contentMismatches,
      MissingInCol: missingInCol,
      Status: missingInCol === 0 && contentMismatches === 0 && activeArray.length === colSnap.size ? 'PERFECT MATCH' : 'DISCREPANCY',
    });
  }

  // 1. Blogs
  const activeBlogs = Array.isArray(activeData.blogs) ? activeData.blogs : [];
  await compareDocCollection('cms_blogs', activeBlogs, (b) => b.slug);

  // 2. Experiences
  const activeExp = Array.isArray(activeData.experiences) ? activeData.experiences : [];
  await compareDocCollection('cms_experiences', activeExp, (e) => e.slug);

  // 3. Destinations
  const activeDest = Array.isArray(activeData.destinations) ? activeData.destinations : [];
  await compareDocCollection('cms_destinations', activeDest, (d) => d.slug);

  // 4. Photos (doc)
  const photosSnap = await db.collection('cms_photos').doc('active_photos').get();
  const colPhotos = photosSnap.exists ? photosSnap.data()?.photos || [] : [];
  const activePhotos = activeData.photos || [];
  const photosMatch = hashItem(activePhotos) === hashItem(colPhotos);
  results.push({
    Collection: 'cms_photos/active_photos',
    ActiveCount: activePhotos.length,
    ColCount: colPhotos.length,
    HashMatches: photosMatch ? activePhotos.length : 0,
    HashMismatches: photosMatch ? 0 : activePhotos.length,
    MissingInCol: photosSnap.exists ? 0 : activePhotos.length,
    Status: photosMatch && activePhotos.length === colPhotos.length ? 'PERFECT MATCH' : 'DISCREPANCY',
  });

  // 5. Events (doc)
  const eventsSnap = await db.collection('cms_events').doc('active_events').get();
  const colEvents = eventsSnap.exists ? eventsSnap.data()?.events || [] : [];
  const activeEvents = activeData.events || [];
  const eventsMatch = hashItem(activeEvents) === hashItem(colEvents);
  results.push({
    Collection: 'cms_events/active_events',
    ActiveCount: activeEvents.length,
    ColCount: colEvents.length,
    HashMatches: eventsMatch ? activeEvents.length : 0,
    HashMismatches: eventsMatch ? 0 : activeEvents.length,
    MissingInCol: eventsSnap.exists ? 0 : activeEvents.length,
    Status: eventsMatch && activeEvents.length === colEvents.length ? 'PERFECT MATCH' : 'DISCREPANCY',
  });

  // 6. Reviews (doc)
  const revSnap = await db.collection('cms_reviews').doc('active_reviews').get();
  const colRev = revSnap.exists ? revSnap.data()?.reviews || [] : [];
  const activeRev = activeData.reviews || [];
  const revMatch = hashItem(activeRev) === hashItem(colRev);
  results.push({
    Collection: 'cms_reviews/active_reviews',
    ActiveCount: activeRev.length,
    ColCount: colRev.length,
    HashMatches: revMatch ? activeRev.length : 0,
    HashMismatches: revMatch ? 0 : activeRev.length,
    MissingInCol: revSnap.exists ? 0 : activeRev.length,
    Status: revMatch && activeRev.length === colRev.length ? 'PERFECT MATCH' : 'DISCREPANCY',
  });

  // 7. Handwritten (doc)
  const hwSnap = await db.collection('cms_reviews').doc('active_handwritten').get();
  const colHw = hwSnap.exists ? hwSnap.data()?.handwrittenReviews || [] : [];
  const activeHw = activeData.handwrittenReviews || [];
  const hwMatch = hashItem(activeHw) === hashItem(colHw);
  results.push({
    Collection: 'cms_reviews/active_handwritten',
    ActiveCount: activeHw.length,
    ColCount: colHw.length,
    HashMatches: hwMatch ? activeHw.length : 0,
    HashMismatches: hwMatch ? 0 : activeHw.length,
    MissingInCol: hwSnap.exists ? 0 : activeHw.length,
    Status: hwMatch && activeHw.length === colHw.length ? 'PERFECT MATCH' : 'DISCREPANCY',
  });

  // 8. Services (doc)
  const servSnap = await db.collection('cms_services').doc('active_services').get();
  const colServ = servSnap.exists ? servSnap.data()?.services || [] : [];
  const activeServ = activeData.services || [];
  const servMatch = hashItem(activeServ) === hashItem(colServ);
  results.push({
    Collection: 'cms_services/active_services',
    ActiveCount: activeServ.length,
    ColCount: colServ.length,
    HashMatches: servMatch ? activeServ.length : 0,
    HashMismatches: servMatch ? 0 : activeServ.length,
    MissingInCol: servSnap.exists ? 0 : activeServ.length,
    Status: servMatch && activeServ.length === colServ.length ? 'PERFECT MATCH' : 'DISCREPANCY',
  });

  // 9. Settings & Navigation
  const setSnap = await db.collection('cms_settings').doc('active_settings').get();
  const colSet = setSnap.exists ? setSnap.data() || {} : {};
  const settingsMatch = hashItem(activeData.settings) === hashItem(colSet.settings);
  const navMatch = hashItem(activeData.navigation) === hashItem(colSet.navigation);
  results.push({
    Collection: 'cms_settings/active_settings (settings)',
    ActiveCount: activeData.settings ? 1 : 0,
    ColCount: colSet.settings ? 1 : 0,
    HashMatches: settingsMatch ? 1 : 0,
    HashMismatches: settingsMatch ? 0 : 1,
    MissingInCol: colSet.settings ? 0 : 1,
    Status: settingsMatch ? 'PERFECT MATCH' : 'DISCREPANCY',
  });
  results.push({
    Collection: 'cms_settings/active_settings (navigation)',
    ActiveCount: activeData.navigation ? 1 : 0,
    ColCount: colSet.navigation ? 1 : 0,
    HashMatches: navMatch ? 1 : 0,
    HashMismatches: navMatch ? 0 : 1,
    MissingInCol: colSet.navigation ? 0 : 1,
    Status: navMatch ? 'PERFECT MATCH' : 'DISCREPANCY',
  });

  // 10. Inquiries
  const inqSnap = await db.collection('cms_inquiries').get();
  results.push({
    Collection: 'cms_inquiries',
    ActiveCount: 'inquiries' in activeData ? (Array.isArray(activeData.inquiries) ? activeData.inquiries.length : 'field') : 0,
    ColCount: inqSnap.size,
    HashMatches: 0,
    HashMismatches: 0,
    MissingInCol: 0,
    Status: 'ISOLATED (Customer PII)',
  });

  console.table(results);
}

runAudit().catch(err => {
  console.error('[audit:fatal]', err);
  process.exit(1);
});
