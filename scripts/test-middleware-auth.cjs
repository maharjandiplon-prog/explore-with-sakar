const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

function req(path, cookie) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 3005,
      path,
      method: 'GET',
      headers: cookie ? { 'Cookie': cookie } : {}
    };
    const r = http.request(opts, (res) => {
      resolve({ status: res.statusCode, location: res.headers.location });
    });
    r.on('error', (e) => resolve({ error: e.message }));
    r.end();
  });
}

async function run() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ username: 'admin', role: 'admin', exp: 1900000000 })).toString('base64url');

  // Test 1: No token
  const t1 = await req('/admin');
  console.log('1. No token -> /admin:', t1.status, 'Location:', t1.location);

  // Test 2: Forged token (valid JSON payload with exp in year 2030, garbage signature)
  const forgedToken = `${header}.${payload}.garbage_forged_sig`;
  const t2 = await req('/admin', `sakar_admin_session=${forgedToken}`);
  console.log('2. Forged token -> /admin:', t2.status, 'Location:', t2.location);

  const t2api = await req('/api/admin/blogs', `sakar_admin_session=${forgedToken}`);
  console.log('2b. Forged token -> /api/admin/blogs:', t2api.status);

  // Test 3: Validly signed token
  let secret = 'dev-only-insecure-secret-explore-with-sakar';
  if (fs.existsSync('.env.local')) {
    const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
    for (const l of lines) {
      if (l.startsWith('ADMIN_JWT_SECRET=')) {
        secret = l.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
  const realSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  const validToken = `${header}.${payload}.${realSig}`;
  const t3 = await req('/admin', `sakar_admin_session=${validToken}`);
  console.log('3. Valid token -> /admin:', t3.status);

  const t3api = await req('/api/admin/blogs', `sakar_admin_session=${validToken}`);
  console.log('3b. Valid token -> /api/admin/blogs:', t3api.status);

  process.exit(0);
}

run();
