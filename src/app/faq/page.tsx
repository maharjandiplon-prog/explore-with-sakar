import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { getPublicFaq } from '@/lib/content';
import { SITE_ORIGIN } from '@/lib/config';
import { safeJsonLd } from '@/lib/json-ld';
import FAQClient from './FAQClient';

const FALLBACK_METADATA: Metadata = {
  title: 'Frequently Asked Questions | Explore With Sakar',
  description: 'Clear, honest answers about Nepal travel: best seasons, visa on arrival, homestay living standards, altitude safety, booking deposits, and responsible tourism.',
  alternates: { canonical: `${SITE_ORIGIN}/faq` },
};

export async function generateMetadata(): Promise<Metadata> {
  return await buildPageMetadata('faq', FALLBACK_METADATA);
}

export const revalidate = 300;

export default async function FAQPage() {
  const faqItems = await getPublicFaq();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE_ORIGIN}/faq`,
    mainEntity: (faqItems || []).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />
      <FAQClient initialFaq={faqItems} />
    </>
  );
}
