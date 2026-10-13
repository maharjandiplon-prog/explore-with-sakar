import http from 'http';

const routes = [
  // Canonical Public Pillars
  { category: 'Canonical Public Pillar', url: 'http://localhost:3008/experiences/beyond-the-map', expected: 200 },
  { category: 'Canonical Public Pillar', url: 'http://localhost:3008/experiences/go-within', expected: 200 },
  { category: 'Canonical Public Pillar', url: 'http://localhost:3008/experiences/go-deeper', expected: 200 },
  { category: 'Canonical Public Pillar', url: 'http://localhost:3008/experiences/homestays', expected: 200 },
  { category: 'Canonical Public Pillar', url: 'http://localhost:3008/experiences/custom-journeys', expected: 200 },
  { category: 'Canonical Public Pillar', url: 'http://localhost:3008/experiences/leave-a-mark', expected: 200 },

  // Legacy Slug Permanent Redirects (308)
  { category: 'Legacy Redirect (308)', url: 'http://localhost:3008/experiences/feel-closer', expected: 308, target: '/experiences/homestays' },
  { category: 'Legacy Redirect (308)', url: 'http://localhost:3008/experiences/custom-private-journeys', expected: 308, target: '/experiences/custom-journeys' },
  { category: 'Legacy Redirect (308)', url: 'http://localhost:3008/experiences/go-spiritual', expected: 308, target: '/experiences/go-within' },
  { category: 'Legacy Redirect (308)', url: 'http://localhost:3008/experiences/spiritual-wellness', expected: 308, target: '/experiences/go-within' },
  { category: 'Legacy Redirect (308)', url: 'http://localhost:3008/experiences/go-beyond', expected: 308, target: '/experiences/beyond-the-map' },
  { category: 'Legacy Redirect (308)', url: 'http://localhost:3008/experiences/responsible', expected: 308, target: '/experiences/leave-a-mark' },
  { category: 'Legacy Redirect (308)', url: 'http://localhost:3008/experiences/all-curated-experiences', expected: 308, target: '/experiences' },
  
  // Singular /experience/ legacy redirects
  { category: 'Singular /experience/ (308)', url: 'http://localhost:3008/experience/feel-closer', expected: 308, target: '/experiences/homestays' },
  { category: 'Singular /experience/ (308)', url: 'http://localhost:3008/experience/homestays', expected: 308, target: '/experiences/homestays' },

  // Unknown Slug (404)
  { category: 'Unknown Slug (404)', url: 'http://localhost:3008/experiences/non-existent-unknown-slug-test-404', expected: 404 },

  // Admin Routes (307 redirect to /admin/login when unauthenticated or 200)
  { category: 'Admin Hub Route', url: 'http://localhost:3008/admin/experiences/beyond-the-map', expected: [200, 307] },
  { category: 'Admin Hub Route', url: 'http://localhost:3008/admin/experiences/go-within', expected: [200, 307] },
  { category: 'Admin Hub Route', url: 'http://localhost:3008/admin/experiences/go-deeper', expected: [200, 307] },
  { category: 'Admin Hub Route', url: 'http://localhost:3008/admin/experiences/feel-closer', expected: [200, 307] },
  { category: 'Admin Hub Route', url: 'http://localhost:3008/admin/experiences/custom-journeys-hub', expected: [200, 307] },
  { category: 'Admin Hub Route', url: 'http://localhost:3008/admin/experiences/leave-a-mark', expected: [200, 307] },
  { category: 'Admin Legacy Redirect', url: 'http://localhost:3008/admin/experiences/homestays', expected: [308, 307] },
];

function checkRoute(route) {
  return new Promise((resolve) => {
    const req = http.request(route.url, { method: 'HEAD' }, (res) => {
      const status = res.statusCode;
      const location = res.headers.location || '-';
      resolve({ ...route, status, location });
    });
    req.on('error', (err) => resolve({ ...route, status: 'ERROR', location: err.message }));
    req.end();
  });
}

async function run() {
  console.log('| Route Tested | Expected | Status | Location / Destination | Match |');
  console.log('|---|---|---|---|---|');
  let allPassed = true;
  for (const r of routes) {
    const res = await checkRoute(r);
    const expectedList = Array.isArray(r.expected) ? r.expected : [r.expected];
    const statusMatch = expectedList.includes(res.status);
    const targetMatch = r.target ? res.location.endsWith(r.target) : true;
    const passed = statusMatch && targetMatch;
    if (!passed) allPassed = false;
    const displayExpected = Array.isArray(r.expected) ? r.expected.join('/') : r.expected;
    console.log(`| \`${res.url.replace('http://localhost:3008', '')}\` | ${displayExpected} | **${res.status}** | \`${res.location}\` | ${passed ? '✅ PASS' : '❌ FAIL'} |`);
  }
  console.log(`\nAll Passed: ${allPassed}`);
  process.exit(allPassed ? 0 : 1);
}

run();
