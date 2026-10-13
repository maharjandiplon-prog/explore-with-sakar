import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Revalidates cache tags and route paths for a mutated collection.
 * Must be called in every mutating admin route after writeKey succeeds.
 */
export function revalidateContent(collection: string, extraPathOrSlug?: string): void {
  try {
    // 1. Revalidate Next.js Data Cache tag
    revalidateTag(`cms:${collection}`);

    // Also revalidate general tag if applicable
    if (collection === 'handwrittenReviews') {
      revalidateTag('cms:reviews');
    }

    // 2. Revalidate paths
    switch (collection) {
      case 'settings':
      case 'navigation':
        revalidatePath('/', 'layout');
        revalidatePath('/api/public/settings');
        break;
      case 'packages':
        revalidatePath('/experiences', 'layout');
        revalidatePath('/');
        break;
      case 'experiences':
        revalidatePath('/experiences', 'layout');
        revalidatePath('/blog');
        revalidatePath('/');
        revalidatePath('/sitemap.xml');
        break;
      case 'beyondChapters':
        revalidatePath('/experiences/beyond-the-map');
        revalidatePath('/experiences', 'layout');
        break;
      case 'services':
        revalidatePath('/');
        break;
      case 'blogs':
        revalidatePath('/blog', 'layout');
        revalidatePath('/');
        revalidatePath('/sitemap.xml');
        break;
      case 'photos':
        revalidatePath('/gallery');
        revalidatePath('/');
        break;
      case 'reviews':
      case 'handwrittenReviews':
        revalidatePath('/reviews');
        revalidatePath('/about');
        revalidatePath('/');
        break;
      case 'events':
        revalidatePath('/events');
        break;
      case 'destinations':
        revalidatePath('/destinations', 'layout');
        break;
      case 'faq':
        revalidatePath('/faq');
        break;
      case 'brandPartners':
        revalidatePath('/');
        break;
      case 'pages':
        if (extraPathOrSlug) {
          const url = extraPathOrSlug.startsWith('/') ? extraPathOrSlug : `/${extraPathOrSlug}`;
          revalidatePath(url);
        }
        break;
    }
  } catch (err) {
    console.warn(`[revalidate] Failed to revalidate collection '${collection}':`, err);
  }
}
