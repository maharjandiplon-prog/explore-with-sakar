import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getPublicBlogs,
  getPublicBlogBySlug,
  getPublicRelatedBlogs,
  getPublicTopFeaturedExperiences,
} from '@/lib/content';
import ArticleHeader from '@/components/blog/ArticleHeader';
import ArticleContent from '@/components/blog/ArticleContent';
import AuthorBio from '@/components/blog/AuthorBio';
import JournalCTA from '@/components/blog/JournalCTA';
import RelatedStories from '@/components/blog/RelatedStories';
import BlogFeaturedExperiences from '@/components/blog/BlogFeaturedExperiences';

import { SITE_ORIGIN, getCanonicalUrl } from '@/lib/config';
import { safeJsonLd } from '@/lib/json-ld';

// ISR revalidation window: 5 minutes (300 seconds)
export const revalidate = 300;

export async function generateStaticParams() {
  const blogs = await getPublicBlogs();
  return blogs.map((b) => ({ slug: b.slug }));
}

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const tMeta0 = Date.now();
  const post = await getPublicBlogBySlug(params.slug);
  console.log(`[PERF:BLOG_SLUG:METADATA] slug=${params.slug} durationMs=${Date.now() - tMeta0} found=${Boolean(post)}`);

  if (!post) {
    return {
      title: 'Story Not Found — Sakar’s Journal',
    };
  }

  const canonicalUrl = getCanonicalUrl(`/blog/${post.slug}`);
  const rawImage = post.featuredImage?.src || '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg';
  const ogImage = rawImage.startsWith('http') ? rawImage : `${SITE_ORIGIN}${rawImage}`;

  return {
    title: `${post.title} — Sakar's Journal | Explore With Sakar`,
    description: post.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${post.title} — Sakar's Journal | Explore With Sakar`,
      description: post.excerpt,
      type: 'article',
      url: canonicalUrl,
      publishedTime: post.publishedAt,
      authors: [post.author?.name || 'Sakar'],
      images: [
        {
          url: ogImage,
          alt: post.featuredImage?.alt || post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} — Sakar's Journal`,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const pageStart = Date.now();
  console.log(`[PERF:BLOG_SLUG:PAGE_START] slug=${params.slug}`);

  const postStart = Date.now();
  const post = await getPublicBlogBySlug(params.slug);
  const postDurationMs = Date.now() - postStart;
  console.log(`[PERF:BLOG_SLUG:GET_POST] slug=${params.slug} durationMs=${postDurationMs} found=${Boolean(post)}`);

  if (!post) {
    notFound();
  }

  const relatedStart = Date.now();
  const [relatedPosts, featuredExperiences] = await Promise.all([
    getPublicRelatedBlogs(post.slug, 3),
    getPublicTopFeaturedExperiences(3),
  ]);
  const relatedDurationMs = Date.now() - relatedStart;
  console.log(
    `[PERF:BLOG_SLUG:RELATED_AND_EXP] durationMs=${relatedDurationMs} relatedCount=${relatedPosts.length} expCount=${featuredExperiences.length}`
  );

  const totalServerMs = Date.now() - pageStart;
  console.log(`[PERF:BLOG_SLUG:PAGE_DONE] slug=${params.slug} totalServerMs=${totalServerMs}`);

  return (
    <article className="min-h-screen bg-parchment-100 pb-20">
      {/* 1. Magazine Article Header */}
      <ArticleHeader post={post} />

      {/* 2. Article Content with Rich Blocks & Lightbox */}
      <ArticleContent post={post} />

      {/* 3. Bottom Author & Contextual Action Area */}
      <div className="editorial-container max-w-3xl mx-auto px-4 sm:px-6">
        {/* Author Bio Card */}
        <AuthorBio author={post.author} />

        {/* Contextual Journey Booking CTA */}
        {post.contextualCta ? (
          <JournalCTA cta={post.contextualCta} />
        ) : (
          <JournalCTA
            cta={{
              title: 'Create Your Own Himalayan Story with Sakar',
              description:
                'Explore the quiet valleys, sacred spaces, and living heritage described in this journal.',
              buttonText: 'Consult Sakar',
            }}
          />
        )}
      </div>

      {/* 4. Top 3 Experiences Linked from Story */}
      <BlogFeaturedExperiences
        experiences={featuredExperiences}
        title="Featured Journeys Connected to Our Stories"
      />

      {/* 5. Related Stories Reel */}
      <RelatedStories posts={relatedPosts} />

      {/* JSON-LD Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Article',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': getCanonicalUrl(`/blog/${post.slug}`),
            },
            headline: post.title,
            description: post.excerpt,
            image: [
              post.featuredImage?.src
                ? (post.featuredImage.src.startsWith('http')
                    ? post.featuredImage.src
                    : `${SITE_ORIGIN}${post.featuredImage.src}`)
                : `${SITE_ORIGIN}/explore-with-sakar/images/mountains/sunrise-himalayas.jpg`,
            ],
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: {
              '@type': 'Person',
              name: post.author?.name || 'Sakar',
              jobTitle: post.author?.role || 'Responsible Tour Director & Cultural Guide',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Explore With Sakar',
              url: SITE_ORIGIN,
              logo: {
                '@type': 'ImageObject',
                url: `${SITE_ORIGIN}/explore-with-sakar/images/logo.png`,
              },
            },
          }),
        }}
      />
    </article>
  );
}
