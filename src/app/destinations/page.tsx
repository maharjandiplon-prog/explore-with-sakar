import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { Sparkles, Mountain, ArrowRight } from 'lucide-react';
import PageHero from '@/components/common/PageHero';
import SectionHeading from '@/components/common/SectionHeading';
import DestinationCard from '@/components/common/DestinationCard';
import CTASection from '@/components/common/CTASection';
import { getPublicDestinations } from '@/lib/content';
import { SITE_ORIGIN } from '@/lib/config';

const FALLBACK_METADATA: Metadata = {
  title: 'Curated Destinations in Nepal | Explore With Sakar',
  description: 'Explore curated regions in Nepal: Kathmandu Valley, Pokhara & Annapurna, Mustang & Muktinath, Langtang, Chitwan Lowlands, and Bandipur.',
  alternates: { canonical: `${SITE_ORIGIN}/destinations` },
};

export async function generateMetadata(): Promise<Metadata> {
  return await buildPageMetadata('destinations', FALLBACK_METADATA);
}

export const revalidate = 300;

export default async function DestinationsPage() {
  const destinations = await getPublicDestinations();
  return (
    <div className="min-h-screen bg-parchment-100">
      {/* 1. Page Hero */}
      <PageHero
        badge="Sacred Lands"
        nepaliTitle="नेपालका प्रमुख गन्तव्यहरू"
        title="Curated Destinations of Nepal"
        subtitle="From the medieval brick courtyards of the Kathmandu Valley to the sacred rainshadow gorges of Mustang and the peaceful Annapurna foothills."
        backgroundImage="/explore-with-sakar/images/mountains/mountain-ridge.jpg"
        breadcrumbs={[{ label: 'Destinations' }]}
      />

      {/* 2. Destination Discovery Grid */}
      <section className="py-20 sm:py-32 bg-sand">
        <div className="editorial-container">
          <SectionHeading
            tag="Explore Regions"
            nepaliTag="गन्तव्य परिचय"
            title="Six Distinct Valleys & Landscapes"
            description="Every valley holds a unique cultural heritage, climate, and mountain backdrop. Discover our curated regional guides."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. CTA Section */}
      <CTASection
        title="Which Valley Speaks to Your Curiosity?"
        subtitle="Whether you dream of monastic courtyards, quiet mountain trails, or wildlife canoeing, Sakar will craft your itinerary."
        primaryButtonText="Inquire About Destinations"
        primaryButtonHref="/contact"
        secondaryButtonText="Explore Experiences"
        secondaryButtonHref="/experiences"
      />
    </div>
  );
}
