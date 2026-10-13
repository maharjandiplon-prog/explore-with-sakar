import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { getPublicReviews, getPublicHandwrittenReviews } from '@/lib/content';
import { SITE_ORIGIN } from '@/lib/config';
import ReviewsClient from './ReviewsClient';

const FALLBACK_METADATA: Metadata = {
  title: 'Traveler Reviews & Reflections | Explore With Sakar',
  description: 'Genuine traveler reviews and reflections from guests who journeyed with Sakar through living culture, quiet trails, and village homestays in Nepal.',
  alternates: { canonical: `${SITE_ORIGIN}/reviews` },
};

export async function generateMetadata(): Promise<Metadata> {
  return await buildPageMetadata('reviews', FALLBACK_METADATA);
}

export const revalidate = 300;

export default async function ReviewsPage() {
  const [reviews, handwrittenReviews] = await Promise.all([
    getPublicReviews(),
    getPublicHandwrittenReviews(),
  ]);

  return (
    <ReviewsClient
      initialReviews={reviews}
      initialHandwrittenReviews={handwrittenReviews}
    />
  );
}
