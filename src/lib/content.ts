import 'server-only';
import { unstable_cache } from 'next/cache';
import { readKey } from './store';
import { getSeedForKey, getDefaultExperiences } from './seed';
import {
  WebsiteSettings,
  NavigationConfig,
  ExtendedPackage,
  ExtendedExperience,
  ExtendedServicePillar,
  CmsEvent,
  CmsDestination,
  CmsFaqItem,
  ExtendedTestimonial,
  HandwrittenReviewPage,
  ExtendedGalleryPhoto,
  ExtendedBlogPost,
  PageContent,
  CmsBeyondChapter,
  CmsBrandPartner,
} from '@/types/cms';
import { LeaveAMarkData } from '@/data/leave-a-mark';

/**
 * Type for public blog list items: strips heavy `content` array
 * to keep cached entry well under 2 MB Vercel Data Cache limit.
 */
export type PublicBlogListItem = Omit<ExtendedBlogPost, 'content'>;

export interface PublicContentOptions {
  /**
   * If true, return seed/static data if Firestore fails.
   * Default is false (throws error so Next.js ISR keeps previous cached page instead of caching fallback).
   */
  allowFallback?: boolean;
}

/**
 * Helper to ensure ISR pages and next build throw on Firestore errors
 * so Next.js does NOT poison its static cache with seed content.
 */
function handleFallbackOrThrow<T>(
  err: any,
  label: string,
  fallbackFactory: () => T,
  options?: PublicContentOptions
): T {
  if (options?.allowFallback) {
    console.warn(`[content] Firestore unreachable, returning static fallback for ${label} (allowFallback=true):`, err);
    return fallbackFactory();
  }
  console.error(`[content] Firestore query failed for ${label} (throwing to prevent ISR cache poisoning):`, err);
  throw err;
}

// ==========================================
// PERFORMANCE: stable per-slug cache maps
// ==========================================

const _slugCaches = {
  package: new Map<string, () => Promise<ExtendedPackage | null>>(),
  experience: new Map<string, () => Promise<ExtendedExperience | null>>(),
  destination: new Map<string, () => Promise<CmsDestination | null>>(),
  blog: new Map<string, () => Promise<ExtendedBlogPost | null>>(),
  page: new Map<string, () => Promise<PageContent | null>>(),
};

function getOrCreateSlugCache<T>(
  map: Map<string, () => Promise<T>>,
  slug: string,
  factory: () => () => Promise<T>
): () => Promise<T> {
  if (!map.has(slug)) {
    map.set(slug, factory());
  }
  return map.get(slug)!;
}

// ==========================================
// 1. Settings
// ==========================================
const fetchCachedSettings = unstable_cache(
  async (): Promise<WebsiteSettings> => {
    return await readKey<WebsiteSettings>('settings', { throwOnError: true });
  },
  ['cms', 'settings'],
  { tags: ['cms:settings'], revalidate: 3600 }
);

export async function getPublicSettings(options?: PublicContentOptions): Promise<WebsiteSettings> {
  try {
    return await fetchCachedSettings();
  } catch (err) {
    return handleFallbackOrThrow(err, 'settings', () => getSeedForKey('settings'), options);
  }
}

// ==========================================
// 2. Navigation
// ==========================================
const fetchCachedNavigation = unstable_cache(
  async (): Promise<NavigationConfig> => {
    return await readKey<NavigationConfig>('navigation', { throwOnError: true });
  },
  ['cms', 'navigation'],
  { tags: ['cms:navigation'], revalidate: 3600 }
);

export async function getPublicNavigation(options?: PublicContentOptions): Promise<NavigationConfig> {
  try {
    return await fetchCachedNavigation();
  } catch (err) {
    return handleFallbackOrThrow(err, 'navigation', () => getSeedForKey('navigation'), options);
  }
}

// ==========================================
// 3. Packages
// ==========================================
const fetchCachedPackages = unstable_cache(
  async (): Promise<ExtendedPackage[]> => {
    const list = await readKey<ExtendedPackage[]>('packages', { throwOnError: true });
    return (list || []).filter((pkg) => pkg.status === 'published');
  },
  ['cms', 'packages'],
  { tags: ['cms:packages'], revalidate: 3600 }
);

export async function getPublicPackages(options?: PublicContentOptions): Promise<ExtendedPackage[]> {
  try {
    return await fetchCachedPackages();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'packages',
      () => {
        const seed = getSeedForKey('packages') as ExtendedPackage[];
        return (seed || []).filter((pkg) => pkg.status === 'published');
      },
      options
    );
  }
}

export async function getPublicPackageBySlug(slug: string, options?: PublicContentOptions): Promise<ExtendedPackage | null> {
  try {
    const all = await fetchCachedPackages();
    return all.find((p) => p.slug === slug || p.id === slug) || null;
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      `package ${slug}`,
      () => {
        const seed = getSeedForKey('packages') as ExtendedPackage[];
        return (seed || []).find((p) => (p.slug === slug || p.id === slug) && p.status === 'published') || null;
      },
      options
    );
  }
}

// ==========================================
// 4. Experiences
// ==========================================
const fetchCachedExperiences = unstable_cache(
  async (): Promise<ExtendedExperience[]> => {
    const list = await readKey<ExtendedExperience[]>('experiences', { throwOnError: true });
    return (list || []).filter((exp) => exp.status === 'published');
  },
  ['cms', 'experiences'],
  { tags: ['cms:experiences'], revalidate: 3600 }
);

export async function getPublicExperiences(options?: PublicContentOptions): Promise<ExtendedExperience[]> {
  try {
    const list = await fetchCachedExperiences();
    const cmsMap = new Map((list || []).map((e) => [e.slug, e]));
    const defaults = getDefaultExperiences();
    const merged: ExtendedExperience[] = [...list];
    for (const def of defaults) {
      if (!cmsMap.has(def.slug)) {
        merged.push(def);
      }
    }
    return merged.filter((exp) => exp.status === 'published');
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'experiences',
      () => {
        const seed = getSeedForKey('experiences') as ExtendedExperience[];
        return (seed || []).filter((exp) => exp.status === 'published');
      },
      options
    );
  }
}

export async function getPublicExperienceBySlug(slug: string, options?: PublicContentOptions): Promise<ExtendedExperience | null> {
  const all = await getPublicExperiences(options);
  return all.find((e) => e.slug === slug || e.id === slug) || null;
}

export async function getPublicTopFeaturedExperiences(limit = 3, options?: PublicContentOptions): Promise<ExtendedExperience[]> {
  const all = await getPublicExperiences(options);
  const candidates = all.filter(
    (e) =>
      e.status === 'published' &&
      (e.featured || (e.featuredOrder !== undefined && e.featuredOrder > 0) || e.homepageVisible !== false)
  );
  const pool = candidates.length >= limit ? candidates : all;

  const sorted = [...pool].sort((a, b) => {
    const orderA = a.featuredOrder !== undefined && a.featuredOrder > 0 ? a.featuredOrder : a.featured ? 10 : 99;
    const orderB = b.featuredOrder !== undefined && b.featuredOrder > 0 ? b.featuredOrder : b.featured ? 10 : 99;
    return orderA - orderB;
  });

  return sorted.slice(0, limit);
}

// ==========================================
// 5. Services
// ==========================================
const fetchCachedServices = unstable_cache(
  async (): Promise<ExtendedServicePillar[]> => {
    const list = await readKey<ExtendedServicePillar[]>('services', { throwOnError: true });
    return (list || []).filter((s) => s.status === 'published');
  },
  ['cms', 'services'],
  { tags: ['cms:services'], revalidate: 3600 }
);

export async function getPublicServices(options?: PublicContentOptions): Promise<ExtendedServicePillar[]> {
  try {
    return await fetchCachedServices();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'services',
      () => {
        const seed = getSeedForKey('services') as ExtendedServicePillar[];
        return (seed || []).filter((s) => s.status === 'published');
      },
      options
    );
  }
}

// ==========================================
// 6. Events
// ==========================================
const fetchCachedEvents = unstable_cache(
  async (): Promise<CmsEvent[]> => {
    const list = await readKey<CmsEvent[]>('events', { throwOnError: true });
    return (list || []).filter((evt) => evt.isVisible !== false);
  },
  ['cms', 'events'],
  { tags: ['cms:events'], revalidate: 3600 }
);

export async function getPublicEvents(options?: PublicContentOptions): Promise<CmsEvent[]> {
  try {
    return await fetchCachedEvents();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'events',
      () => {
        const seed = getSeedForKey('events') as CmsEvent[];
        return (seed || []).filter((evt) => evt.isVisible !== false);
      },
      options
    );
  }
}

// ==========================================
// 7. Destinations
// ==========================================
const fetchCachedDestinations = unstable_cache(
  async (): Promise<CmsDestination[]> => {
    const list = await readKey<CmsDestination[]>('destinations', { throwOnError: true });
    return (list || []).filter((dest) => dest.isVisible !== false);
  },
  ['cms', 'destinations'],
  { tags: ['cms:destinations'], revalidate: 3600 }
);

export async function getPublicDestinations(options?: PublicContentOptions): Promise<CmsDestination[]> {
  try {
    return await fetchCachedDestinations();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'destinations',
      () => {
        const seed = getSeedForKey('destinations') as CmsDestination[];
        return (seed || []).filter((dest) => dest.isVisible !== false);
      },
      options
    );
  }
}

export async function getPublicDestinationBySlug(slug: string, options?: PublicContentOptions): Promise<CmsDestination | null> {
  try {
    const all = await fetchCachedDestinations();
    return all.find((d) => d.slug === slug || d.id === slug) || null;
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      `destination ${slug}`,
      () => {
        const seed = getSeedForKey('destinations') as CmsDestination[];
        return (seed || []).find((d) => (d.slug === slug || d.id === slug) && d.isVisible !== false) || null;
      },
      options
    );
  }
}

// ==========================================
// 8. FAQ
// ==========================================
const fetchCachedFaq = unstable_cache(
  async (): Promise<CmsFaqItem[]> => {
    const list = await readKey<CmsFaqItem[]>('faq', { throwOnError: true });
    return (list || []).filter((item) => item.isVisible !== false);
  },
  ['cms', 'faq'],
  { tags: ['cms:faq'], revalidate: 3600 }
);

export async function getPublicFaq(options?: PublicContentOptions): Promise<CmsFaqItem[]> {
  try {
    return await fetchCachedFaq();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'faq',
      () => {
        const seed = getSeedForKey('faq') as CmsFaqItem[];
        return (seed || []).filter((item) => item.isVisible !== false);
      },
      options
    );
  }
}

// ==========================================
// 9. Reviews & Handwritten Reviews
// ==========================================
const fetchCachedReviews = unstable_cache(
  async (): Promise<ExtendedTestimonial[]> => {
    const list = await readKey<ExtendedTestimonial[]>('reviews', { throwOnError: true });
    return (list || []).filter((r) => r.isVisible !== false && r.status === 'approved');
  },
  ['cms', 'reviews'],
  { tags: ['cms:reviews'], revalidate: 3600 }
);

export async function getPublicReviews(options?: PublicContentOptions): Promise<ExtendedTestimonial[]> {
  try {
    return await fetchCachedReviews();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'reviews',
      () => {
        const seed = getSeedForKey('reviews') as ExtendedTestimonial[];
        return (seed || []).filter((r) => r.isVisible !== false && r.status === 'approved');
      },
      options
    );
  }
}

const fetchCachedHandwrittenReviews = unstable_cache(
  async (): Promise<HandwrittenReviewPage[]> => {
    const list = await readKey<HandwrittenReviewPage[]>('handwrittenReviews', { throwOnError: true });
    return (list || []).filter((p) => p.isVisible !== false);
  },
  ['cms', 'handwrittenReviews'],
  { tags: ['cms:handwrittenReviews'], revalidate: 3600 }
);

export async function getPublicHandwrittenReviews(options?: PublicContentOptions): Promise<HandwrittenReviewPage[]> {
  try {
    return await fetchCachedHandwrittenReviews();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'handwrittenReviews',
      () => {
        const seed = getSeedForKey('handwrittenReviews') as HandwrittenReviewPage[];
        return (seed || []).filter((p) => p.isVisible !== false);
      },
      options
    );
  }
}

// ==========================================
// 10. Photos
// ==========================================
const fetchCachedPhotos = unstable_cache(
  async (): Promise<ExtendedGalleryPhoto[]> => {
    const list = await readKey<ExtendedGalleryPhoto[]>('photos', { throwOnError: true });
    return list || [];
  },
  ['cms', 'photos'],
  { tags: ['cms:photos'], revalidate: 3600 }
);

export async function getPublicPhotos(options?: PublicContentOptions): Promise<ExtendedGalleryPhoto[]> {
  try {
    return await fetchCachedPhotos();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'photos',
      () => (getSeedForKey('photos') as ExtendedGalleryPhoto[]) || [],
      options
    );
  }
}

// ==========================================
// 11. Blogs
// ==========================================

const fetchCachedBlogsList = unstable_cache(
  async (): Promise<PublicBlogListItem[]> => {
    const list = await readKey<ExtendedBlogPost[]>('blogs', { throwOnError: true });
    return (list || [])
      .filter((b) => b.status === 'published')
      .map(({ content, ...rest }) => rest);
  },
  ['cms', 'blogs', 'list'],
  { tags: ['cms:blogs'], revalidate: 3600 }
);

export async function getPublicBlogs(options?: PublicContentOptions): Promise<PublicBlogListItem[]> {
  try {
    return await fetchCachedBlogsList();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'blogs list',
      () => {
        const seed = getSeedForKey('blogs') as ExtendedBlogPost[];
        return (seed || [])
          .filter((b) => b.status === 'published')
          .map(({ content, ...rest }) => rest);
      },
      options
    );
  }
}

function getOrCreateBlogSlugCache(slug: string): () => Promise<ExtendedBlogPost | null> {
  return getOrCreateSlugCache(
    _slugCaches.blog as Map<string, () => Promise<ExtendedBlogPost | null>>,
    slug,
    () =>
      unstable_cache(
        async (): Promise<ExtendedBlogPost | null> => {
          const list = await readKey<ExtendedBlogPost[]>('blogs', { throwOnError: true });
          return (list || []).find((b) => b.slug === slug && b.status === 'published') || null;
        },
        ['cms', 'blog', slug],
        { tags: ['cms:blogs'], revalidate: 3600 }
      )
  );
}

export async function getPublicBlogBySlug(slug: string, options?: PublicContentOptions): Promise<ExtendedBlogPost | null> {
  try {
    return await getOrCreateBlogSlugCache(slug)();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      `blog ${slug}`,
      () => {
        const seed = getSeedForKey('blogs') as ExtendedBlogPost[];
        return (seed || []).find((b) => b.slug === slug && b.status === 'published') || null;
      },
      options
    );
  }
}

export interface PillarStory {
  pillar: 'go-within' | 'go-beyond' | 'leave-a-mark';
  pillarLabel: string;
  pillarHref: string;
  blog: PublicBlogListItem;
}

export async function getPublicPillarStories(options?: PublicContentOptions): Promise<PillarStory[]> {
  const all = await getPublicBlogs(options);

  const pickFirst = (preferredSlugs: string[], fallbackCategories: string[]): PublicBlogListItem | null => {
    for (const slug of preferredSlugs) {
      const found = all.find((b) => b.slug === slug);
      if (found) return found;
    }
    return all.find((b) => fallbackCategories.includes(b.category)) || null;
  };

  const goWithin = pickFirst(
    ['the-cosmic-language-of-sound', 'himalayan-shamanism-ancient-bridge', 'taudaha-and-pharping-living-stories', 'a-leisurely-walk-through-pashupati'],
    ['Spiritual Nepal']
  );
  const goBeyond = pickFirst(
    ['kathmandu-durbar-square-every-stone-holds-a-story', 'exploring-bhaktapur-durbar-square', 'patan-durbar-square-hidden-courtyards-living-craft'],
    ['Living Culture', 'Walking Nepal']
  );
  const leaveAMark = pickFirst(
    ['beyond-tourism-building-trust-volunteering-nepal', 'inspiring-young-lad-logan-storck', 'women-in-the-cold-war-dr-merose-wang'],
    ['Travel With Meaning']
  );

  const result: PillarStory[] = [];
  if (goWithin) result.push({ pillar: 'go-within', pillarLabel: 'Go Within', pillarHref: '/experiences/go-within', blog: goWithin });
  if (goBeyond) result.push({ pillar: 'go-beyond', pillarLabel: 'Go Beyond the Map', pillarHref: '/experiences/beyond-the-map', blog: goBeyond });
  if (leaveAMark) result.push({ pillar: 'leave-a-mark', pillarLabel: 'Leave a Mark', pillarHref: '/experiences/leave-a-mark', blog: leaveAMark });
  return result;
}

export async function getPublicRelatedBlogs(currentSlug: string, count = 3, options?: PublicContentOptions): Promise<PublicBlogListItem[]> {
  const all = await getPublicBlogs(options);
  const current = all.find((b) => b.slug === currentSlug);
  if (!current) return all.slice(0, count);

  const related = (current.relatedSlugs || [])
    .map((slug) => all.find((b) => b.slug === slug))
    .filter((b): b is PublicBlogListItem => Boolean(b && b.slug !== currentSlug));

  if (related.length >= count) return related.slice(0, count);

  const categoryRelated = all.filter(
    (b) => b.slug !== currentSlug && b.category === current.category && !related.some((r) => r.slug === b.slug)
  );

  const combined = [...related, ...categoryRelated];
  if (combined.length >= count) return combined.slice(0, count);

  const fallback = all.filter((b) => b.slug !== currentSlug && !combined.some((c) => c.slug === b.slug));
  return [...combined, ...fallback].slice(0, count);
}

// ==========================================
// 12. Pages Content
// ==========================================

function getOrCreatePageCache(slug: string): () => Promise<PageContent | null> {
  return getOrCreateSlugCache(
    _slugCaches.page as Map<string, () => Promise<PageContent | null>>,
    slug,
    () =>
      unstable_cache(
        async (): Promise<PageContent | null> => {
          const list = await readKey<PageContent[]>('pages', { throwOnError: true });
          return (list || []).find((p) => p.slug === slug) || null;
        },
        ['cms', 'page', slug],
        { tags: ['cms:pages'], revalidate: 3600 }
      )
  );
}

export async function getPageContent(slug: string, options?: PublicContentOptions): Promise<PageContent | null> {
  try {
    return await getOrCreatePageCache(slug)();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      `page ${slug}`,
      () => {
        const seed = getSeedForKey('pages') as PageContent[];
        return (seed || []).find((p) => p.slug === slug) || null;
      },
      options
    );
  }
}

// ==========================================
// 13. Beyond the Map Chapters
// ==========================================
const fetchCachedBeyondChapters = unstable_cache(
  async (): Promise<CmsBeyondChapter[]> => {
    const list = await readKey<CmsBeyondChapter[]>('beyondChapters', { throwOnError: true });
    return (list || [])
      .filter((c) => c.isPublished !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  ['cms', 'beyondChapters'],
  { tags: ['cms:beyondChapters'], revalidate: 3600 }
);

export async function getPublicBeyondChapters(options?: PublicContentOptions): Promise<CmsBeyondChapter[]> {
  try {
    return await fetchCachedBeyondChapters();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'beyondChapters',
      () => {
        const seed = getSeedForKey('beyondChapters') as CmsBeyondChapter[];
        return (seed || [])
          .filter((c) => c.isPublished !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      },
      options
    );
  }
}

// ==========================================
// 14. Leave a Mark Singleton
// ==========================================
const fetchCachedLeaveAMark = unstable_cache(
  async (): Promise<LeaveAMarkData> => {
    const data = await readKey<LeaveAMarkData>('leaveAMark', { throwOnError: true });
    return data;
  },
  ['cms', 'leaveAMark'],
  { tags: ['cms:leaveAMark'], revalidate: 3600 }
);

export async function getPublicLeaveAMark(options?: PublicContentOptions): Promise<LeaveAMarkData> {
  try {
    return await fetchCachedLeaveAMark();
  } catch (err) {
    return handleFallbackOrThrow(
      err,
      'leaveAMark',
      () => getSeedForKey('leaveAMark') as LeaveAMarkData,
      options
    );
  }
}

// ==========================================
// 15. Brand Partners
// ==========================================
const fetchCachedBrandPartners = unstable_cache(
  async (): Promise<CmsBrandPartner[]> => {
    const list = await readKey<CmsBrandPartner[]>('brandPartners', { throwOnError: true });
    return (list || [])
      .filter((p) => p.isVisible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  ['cms', 'brandPartners'],
  { tags: ['cms:brandPartners'], revalidate: 3600 }
);

export async function getPublicBrandPartners(options?: PublicContentOptions): Promise<CmsBrandPartner[]> {
  try {
    return await fetchCachedBrandPartners();
  } catch (err) {
    return handleFallbackOrThrow(err, 'brandPartners', () => [], options);
  }
}
