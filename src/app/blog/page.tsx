import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { getPublicBlogs, getPublicTopFeaturedExperiences } from '@/lib/content';
import { SITE_ORIGIN } from '@/lib/config';
import BlogClient from './BlogClient';

const FALLBACK_METADATA: Metadata = {
  title: 'Sakar’s Journal & Essays | Explore With Sakar',
  description: 'Personal essays, cultural reflections, and field dispatches from Sakar on slow travel, Himalayan spirituality, and Nepal community heritage.',
  alternates: { canonical: `${SITE_ORIGIN}/blog` },
};

export async function generateMetadata(): Promise<Metadata> {
  return await buildPageMetadata('blog', FALLBACK_METADATA);
}

export const revalidate = 300;

export default async function BlogPage() {
  const [blogs, topExperiences] = await Promise.all([
    getPublicBlogs(),
    getPublicTopFeaturedExperiences(3),
  ]);

  const lightweightExperiences = topExperiences.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    location: e.location,
    duration: e.duration,
    shortDescription: e.shortDescription,
    heroImage: e.heroImage ? { src: e.heroImage.src, alt: e.heroImage.alt } : undefined,
    status: 'published' as const,
    featured: true,
  }));

  return <BlogClient initialBlogs={blogs} initialExperiences={lightweightExperiences as any} />;
}
