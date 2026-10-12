/**
 * Shared edge-safe and node-safe JWT secret accessor.
 * Usable inside Next.js Edge Middleware and Node.js route handlers.
 */
export function getAuthSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  // Enforce secret presence in production environments
  if (process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)) {
    throw new Error('ADMIN_JWT_SECRET must be set in production');
  }

  return 'dev-only-insecure-secret-explore-with-sakar';
}
