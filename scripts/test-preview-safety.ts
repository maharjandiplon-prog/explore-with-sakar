import { writeKey, pushInquiry, readKey } from '../src/lib/store';

async function main() {
  console.log('======================================================');
  console.log('VERCEL PREVIEW SAFETY ISOLATION TEST');
  console.log('======================================================');

  // TEST 1: In preview mode without ALLOW_PREVIEW_WRITES -> writeKey blocked
  process.env.VERCEL_ENV = 'preview';
  delete process.env.ALLOW_PREVIEW_WRITES;

  console.log('[Test 1] Attempting writeKey in preview mode (ALLOW_PREVIEW_WRITES unset)...');
  let blockedWrite = false;
  try {
    await writeKey('settings', { test: true });
  } catch (err: any) {
    if (err.message && err.message.includes('Preview environment is read-only')) {
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

  // TEST 2: In preview mode without ALLOW_PREVIEW_WRITES -> pushInquiry blocked
  console.log('\n[Test 2] Attempting pushInquiry in preview mode...');
  let blockedInquiry = false;
  try {
    await pushInquiry({ id: 'test-preview', name: 'Test', email: 'test@example.com' } as any);
  } catch (err: any) {
    if (err.message && err.message.includes('Preview environment is read-only')) {
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
  } catch (err: any) {
    console.error('  FAIL: Read was blocked in preview mode:', err);
    process.exit(1);
  }

  // TEST 4: When ALLOW_PREVIEW_WRITES=true is set, the preview block is bypassed
  console.log('\n[Test 4] Verifying ALLOW_PREVIEW_WRITES=true bypasses preview block...');
  process.env.ALLOW_PREVIEW_WRITES = 'true';
  let allowedInquiry = false;
  try {
    // In dev file mode or memory, pushInquiry succeeds past the preview check
    await pushInquiry({ id: 'test-preview-allowed', name: 'Test Allowed', email: 'test@example.com' } as any);
    allowedInquiry = true;
    console.log('  PASS: pushInquiry succeeded when ALLOW_PREVIEW_WRITES=true.');
  } catch (err: any) {
    if (err.message && err.message.includes('Preview environment is read-only')) {
      console.error('  FAIL: Write was still blocked despite ALLOW_PREVIEW_WRITES=true!');
      process.exit(1);
    }
    // If it threw for another reason (e.g., storage specific), confirm it bypassed the preview guard
    if (!err.message?.includes('Preview environment is read-only')) {
      allowedInquiry = true;
      console.log('  PASS: Preview block was bypassed when ALLOW_PREVIEW_WRITES=true.');
    }
  }
  if (!allowedInquiry) {
    console.error('  FAIL: ALLOW_PREVIEW_WRITES=true did not allow writes.');
    process.exit(1);
  }

  // Clean up env vars
  delete process.env.VERCEL_ENV;
  delete process.env.ALLOW_PREVIEW_WRITES;

  console.log('\n======================================================');
  console.log('VERCEL PREVIEW SAFETY TESTS PASSED (Exit Code: 0)');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
