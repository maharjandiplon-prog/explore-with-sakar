/**
 * Shared edge-safe and node-safe JWT secret accessor.
 * Usable inside Next.js Edge Middleware and Node.js route handlers.
 */
const INSECURE_DEV_SECRET = 'dev-only-insecure-secret-explore-with-sakar';
const FORBIDDEN_SECRETS = new Set([
  INSECURE_DEV_SECRET,
  'secret',
  'jwtsecret',
  'adminsecret',
  'changeme',
  '123456',
  'password',
  'test',
]);

export function getAuthSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

  if (secret && secret.trim().length > 0) {
    const trimmed = secret.trim();
    if (isProduction) {
      if (trimmed.length < 32) {
        throw new Error('ADMIN_JWT_SECRET must be at least 32 characters long in production');
      }
      if (FORBIDDEN_SECRETS.has(trimmed.toLowerCase())) {
        throw new Error('ADMIN_JWT_SECRET is set to an insecure/default value. Please configure a high-entropy secret.');
      }
    }
    return trimmed;
  }

  // Enforce secret presence in production environments
  if (isProduction) {
    throw new Error('ADMIN_JWT_SECRET must be set in production');
  }

  return INSECURE_DEV_SECRET;
}
