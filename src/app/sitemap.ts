import { MetadataRoute } from 'next';
import { getPublicExperiences, getPublicBlogs, getPublicDestinations } from '@/lib/content';
import { readKey } from '@/lib/store';
import { PageContent } from '@/types/cms';
import { DEFAULT_PUBLIC_PAGES } from '@/data/pages';
import { SITE_ORIGIN } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_ORIGIN;
  const now = new Date();

  try {
    // 1. Pages from CMS / Seed
    let pages: PageContent[] = [];
    pages = (await readKey<PageContent[]>('pages', { throwOnError: true })) || [];
    if (!pages || pages.length === 0) {
      pages = DEFAULT_PUBLIC_PAGES;
    }

    // Filter pages honoring sitemapVisible and noIndex
    const visiblePages = pages.filter(
      (p) => p.status === 'published' && p.seo?.sitemapVisible !== false && p.seo?.noIndex !== true
    );

    const CANONICAL_EXPERIENCE_MAP: Record<string, string> = {
      'go-beyond': '/experiences/beyond-the-map',
      'beyond-the-map': '/experiences/beyond-the-map',
      'go-within': '/experiences/go-within',
      'go-spiritual': '/experiences/go-within',
      'spiritual-wellness': '/experiences/go-within',
      'go-deeper': '/experiences/go-deeper',
      'feel-closer': '/experiences/homestays',
      'homestays': '/experiences/homestays',
      'leave-a-mark': '/experiences/leave-a-mark',
      'responsible': '/experiences/leave-a-mark',
      'all-curated-experiences': '/experiences',
      'experiences': '/experiences',
      'custom-private-journeys': '/experiences/custom-journeys',
      'custom-journeys': '/experiences/custom-journeys',
    };

    const pageRoutes: MetadataRoute.Sitemap = visiblePages
      .filter((page) => !page.url?.startsWith('/admin') && !page.url?.startsWith('/api'))
      .map((page) => {
        const isHome = page.slug === 'home';
        let pagePath = page.url;

        // Check if page corresponds to one of the canonical experience pillars/catalog
        if (CANONICAL_EXPERIENCE_MAP[page.slug]) {
          pagePath = CANONICAL_EXPERIENCE_MAP[page.slug];
        } else if (pagePath.startsWith('/experience/') || pagePath.startsWith('/services/')) {
          pagePath = pagePath.replace(/^\/(?:experience|services)\//, '/experiences/');
          if (pagePath === '/experiences/spiritual-wellness' || pagePath === '/experiences/go-spiritual') {
            pagePath = '/experiences/go-within';
          }
        }

        const isCanonicalExp = Object.values(CANONICAL_EXPERIENCE_MAP).includes(pagePath);

        return {
          url: isHome ? `${baseUrl}` : `${baseUrl}${pagePath}`,
          lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
          changeFrequency: isHome ? 'daily' : isCanonicalExp ? 'weekly' : 'monthly',
          priority: isHome ? 1.0 : isCanonicalExp ? 0.9 : 0.8,
        };
      });

    // Explicitly guarantee canonical experience routes are included
    const coreExperienceRoutes: MetadataRoute.Sitemap = [
      { url: `${baseUrl}/experiences`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
      { url: `${baseUrl}/experiences/beyond-the-map`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/experiences/go-within`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/experiences/go-deeper`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/experiences/homestays`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/experiences/leave-a-mark`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/experiences/custom-journeys`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ];

    // 2. Curated Experiences (dynamic individual package/topic departures)
    const categoryToParent: Record<string, string> = {
      'beyond-the-map': 'beyond-the-map',
      'go-beyond': 'beyond-the-map',
      'heritage': 'beyond-the-map',
      'go-within': 'go-within',
      'go-spiritual': 'go-within',
      'spiritual-wellness': 'go-within',
      'spiritual': 'go-within',
      'go-deeper': 'go-deeper',
      'homestays': 'homestays',
      'feel-closer': 'homestays',
      'homestay': 'homestays',
    };

    const experiences = await getPublicExperiences();
    const experienceRoutes: MetadataRoute.Sitemap = (experiences || [])
      .filter((exp) => exp.status === 'published' && !CANONICAL_EXPERIENCE_MAP[exp.slug])
      .map((exp) => {
        const parentPillar = categoryToParent[exp.category];
        const path = parentPillar
          ? `/experiences/${parentPillar}/${exp.slug}`
          : `/experiences/${exp.slug}`;
        return {
          url: `${baseUrl}${path}`,
          lastModified: exp.updatedAt ? new Date(exp.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.85,
        };
      });

    // 3. Blogs
    const blogs = await getPublicBlogs();
    const blogRoutes: MetadataRoute.Sitemap = (blogs || [])
      .filter((b) => b.status === 'published')
      .map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: blog.publishedAt ? new Date(blog.publishedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.75,
      }));

    // 4. Destinations (Canonical individual destination guides)
    const destinations = await getPublicDestinations();
    const destinationRoutes: MetadataRoute.Sitemap = (destinations || []).map((dest) => ({
      url: `${baseUrl}/destinations/${dest.slug || dest.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    // Deduplicate URLs
    const routeMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const route of [
      ...coreExperienceRoutes,
      ...pageRoutes,
      ...destinationRoutes,
      ...experienceRoutes,
      ...blogRoutes,
    ]) {
      routeMap.set(route.url, route);
    }

    return Array.from(routeMap.values());
  } catch (err) {
    console.error('[sitemap] Error generating sitemap:', err);
    throw err;
  }
}
