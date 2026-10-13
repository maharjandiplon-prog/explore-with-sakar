import { NextResponse } from 'next/server';
import { getPublicSettings, getPublicNavigation } from '@/lib/content';

/**
 * Strict whitelist filter: Only expose public presentation settings to clients.
 * Never allow internal fields, admin credentials, tokens, or system flags.
 */
function sanitizePublicSettings(raw: any) {
  if (!raw || typeof raw !== 'object') return {};
  return {
    contact: raw.contact || {},
    social: raw.social || {},
    branding: raw.branding || {},
    hero: raw.hero || {},
    stats: Array.isArray(raw.stats) ? raw.stats : [],
    announcement: raw.announcement || {},
    footer: raw.footer || {},
  };
}

export async function GET() {
  try {
    const [rawSettings, navigation] = await Promise.all([
      getPublicSettings(),
      getPublicNavigation(),
    ]);

    const settings = sanitizePublicSettings(rawSettings);

    return NextResponse.json(
      { settings, navigation },
      {
        headers: {
          // Cache public settings at the CDN edge for 60s; serve stale for up to 1h while revalidating.
          // Settings change infrequently and are already cached server-side via unstable_cache.
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
