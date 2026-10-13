import { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_ORIGIN;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
