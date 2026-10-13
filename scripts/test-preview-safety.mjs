import { writeKey, pushInquiry, readKey } from '../src/lib/store.js';

console.log('======================================================');
console.log('VERCEL PREVIEW SAFETY ISOLATION TEST');
console.log('======================================================');

// TEST 1: In preview mode without ALLOW_PREVIEW_WRITES
process.env.VERCEL_ENV = 'preview';
delete process.env.ALLOW_PREVIEW_WRITES;

console.log('[Test 1] Attempting writeKey in preview mode (ALLOW_PREVIEW_WRITES unset)...');
let blockedWrite = false;
try {
  await writeKey('settings', { test: true });
} catch (err) {
  if (err.message.includes('Preview environment is read-only')) {
    blockedWrite = true;
    console.log('  PASS: writeKey was blocked with expected error:', err.message);
  } else {
    console.error('  FAIL: Unexpected error:', err);
    process.exit(1);
  }
}
if (!blockedWrite) {
  console.error('  FAIL: writeKey was allowed in preview mode!');
  process.exit(1);
}

console.log('\n[Test 2] Attempting pushInquiry in preview mode...');
let blockedInquiry = false;
try {
  await pushInquiry({ id: 'test-preview', name: 'Test', email: 'test@example.com' });
} catch (err) {
  if (err.message.includes('Preview environment is read-only')) {
    blockedInquiry = true;
    console.log('  PASS: pushInquiry was blocked with expected error:', err.message);
  } else {
    console.error('  FAIL: Unexpected error:', err);
    process.exit(1);
  }
}
if (!blockedInquiry) {
  console.error('  FAIL: pushInquiry was allowed in preview mode!');
  process.exit(1);
}

// TEST 3: Reads remain fully functional in preview
console.log('\n[Test 3] Verifying reads remain allowed in preview...');
try {
  const blogs = await readKey('blogs');
  console.log('  PASS: readKey succeeded in preview mode. Items read:', Array.isArray(blogs) ? blogs.length : 'ok');
} catch (err) {
  console.error('  FAIL: Read was blocked in preview mode:', err);
  process.exit(1);
}

// Clean up env vars
delete process.env.VERCEL_ENV;
delete process.env.ALLOW_PREVIEW_WRITES;

console.log('\n======================================================');
console.log('VERCEL PREVIEW SAFETY TESTS PASSED (Exit Code: 0)');
console.log('======================================================');
