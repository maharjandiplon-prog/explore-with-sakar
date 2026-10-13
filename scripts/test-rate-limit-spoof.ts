import { getClientIp, checkRateLimit, recordFailedAttempt, clearRateLimit } from '../src/lib/rate-limit';

async function main() {
  console.log('======================================================');
  console.log('RATE LIMITER SPOOFING & ACCOUNT BRUTE FORCE TEST');
  console.log('======================================================');

  // TEST 1: Default behavior (TRUST_CLOUDFLARE_PROXY is unset)
  delete process.env.TRUST_CLOUDFLARE_PROXY;

  const forgedHeaders1 = new Headers({
    'cf-connecting-ip': '1.1.1.1', // Attacker attempting to claim Cloudflare IP
    'x-real-ip': '2.2.2.2',        // Attacker attempting to forge real IP
    'x-vercel-forwarded-for': '198.51.100.50', // Genuine Vercel edge IP
  });

  const resolvedIp1 = getClientIp(forgedHeaders1);
  console.log('[Test 1] Forged cf-connecting-ip + x-real-ip with Vercel edge:');
  console.log('  Resolved IP:', resolvedIp1);
  if (resolvedIp1 === '198.51.100.50') {
    console.log('  PASS: Forged headers ignored; genuine Vercel edge IP used.');
  } else {
    console.error('  FAIL: Spoofed header was accepted!');
    process.exit(1);
  }

  // TEST 2: Attacker injects forged leading entries in x-forwarded-for
  const forgedHeaders2 = new Headers({
    'x-forwarded-for': 'attacker.spoofed.ip, 198.51.100.75', // Last entry appended by edge proxy
  });

  const resolvedIp2 = getClientIp(forgedHeaders2);
  console.log('\n[Test 2] Forged leading IP in x-forwarded-for:');
  console.log('  Resolved IP:', resolvedIp2);
  if (resolvedIp2 === '198.51.100.75') {
    console.log('  PASS: Forged leading IP ignored; last entry (trusted edge proxy) used.');
  } else {
    console.error('  FAIL: Forged leading IP was accepted!');
    process.exit(1);
  }

  // TEST 3: Attacker attempts to change forged cf-connecting-ip to get a fresh bucket
  const bucketKey1 = `login_${resolvedIp1}`;
  const attackerForgedHeaders3 = new Headers({
    'cf-connecting-ip': '9.9.9.9', // Different forged CF IP
    'x-vercel-forwarded-for': '198.51.100.50', // Same real connection
  });
  const bucketKey2 = `login_${getClientIp(attackerForgedHeaders3)}`;
  console.log('\n[Test 3] Bucket isolation with varying forged cf-connecting-ip:');
  console.log('  Bucket 1:', bucketKey1);
  console.log('  Bucket 2:', bucketKey2);
  if (bucketKey1 === bucketKey2) {
    console.log('  PASS: Attacker cannot obtain a fresh bucket by spoofing cf-connecting-ip.');
  } else {
    console.error('  FAIL: Attacker obtained a fresh rate limit bucket via spoofing!');
    process.exit(1);
  }

  // TEST 4: Account-level rate limiting prevents rotating IP attacks (10 attempts per 15 min)
  console.log('\n[Test 4] Rotating IP brute force attack against target account "sakar_admin":');
  const targetAccountKey = 'login_account_sakar_admin';
  await clearRateLimit(targetAccountKey);

  for (let i = 1; i <= 11; i++) {
    const fakeIpKey = `login_rotating_ip_${i}`;
    const accountCheck = await checkRateLimit(targetAccountKey, 10, 900);
    
    if (i <= 10) {
      if (!accountCheck.allowed) {
        console.error(`  FAIL: Attempt ${i} prematurely blocked.`);
        process.exit(1);
      }
      await recordFailedAttempt(fakeIpKey, 900);
      await recordFailedAttempt(targetAccountKey, 900);
      if (i === 1 || i === 10) {
        console.log(`  Attempt ${i}: Allowed (new IP rotating_ip_${i}). Recorded failure on account.`);
      }
    } else {
      // Attempt 11 should be BLOCKED despite coming from a completely new IP
      if (!accountCheck.allowed) {
        console.log(`  Attempt 11: BLOCKED (account rate limit triggered, remaining: ${accountCheck.remaining}).`);
        console.log('  PASS: Rotating IPs blocked from brute-forcing target account after 10 failed attempts.');
      } else {
        console.error('  FAIL: Attempt 11 was not blocked by account limiter!');
        process.exit(1);
      }
    }
  }

  // Clean up test key
  await clearRateLimit(targetAccountKey);
  console.log('\n======================================================');
  console.log('ALL RATE LIMIT SPOOFING & ACCOUNT TESTS PASSED (Exit Code: 0)');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
