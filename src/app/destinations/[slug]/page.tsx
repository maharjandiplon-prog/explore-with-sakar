import React from 'react';
import { Metadata } from 'next';
import SafeImage from '@/components/common/SafeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicDestinationBySlug, getPublicDestinations, getPublicEvents } from '@/lib/content';
import { MapPin, Mountain, Check, ArrowLeft } from 'lucide-react';
import InquiryForm from '@/components/booking/InquiryForm';

import { SITE_ORIGIN, getCanonicalUrl } from '@/lib/config';
import { safeJsonLd } from '@/lib/json-ld';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const destination = await getPublicDestinationBySlug(params.slug);
  
  if (!destination) {
    return { title: 'Destination Not Found | Explore With Sakar' };
  }
  
  const canonicalUrl = getCanonicalUrl(`/destinations/${destination.slug || destination.id}`);
  const rawImage = destination.image?.src || '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg';
  const ogImage = rawImage.startsWith('http') ? rawImage : `${SITE_ORIGIN}${rawImage}`;

  return {
    title: `${destination.name} | Explore With Sakar`,
    description: destination.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${destination.name} | Explore With Sakar`,
      description: destination.description,
      url: canonicalUrl,
      images: [
        {
          url: ogImage,
          alt: destination.image?.alt || destination.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${destination.name} | Explore With Sakar`,
      description: destination.description,
      images: [ogImage],
    },
  };
}

export async function generateStaticParams() {
  const destinations = await getPublicDestinations();
  return destinations.map((dest) => ({
    slug: dest.slug || dest.id,
  }));
}

export const revalidate = 300;

export default async function DestinationDetailPage({ params }: Props) {
  const [destination, events] = await Promise.all([
    getPublicDestinationBySlug(params.slug),
    getPublicEvents(),
  ]);

  if (!destination) {
    notFound();
  }

  const availableEvents = events.map((evt) => ({
    id: evt.id,
    title: evt.title,
    date: evt.date,
  }));

  return (
    <div className="min-h-screen bg-sand">
      {/* Cinematic Hero Image */}
      <div className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden">
        <SafeImage
          src={destination.image?.src || '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg'}
          alt={destination.image?.alt || destination.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-himalaya-950/40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-himalaya-950/60 via-transparent to-himalaya-950/80"></div>
        
        {/* Breadcrumb */}
        <div className="absolute top-8 left-0 right-0 z-10 editorial-container">
          <Link href="/destinations" className="inline-flex items-center text-xs uppercase font-bold tracking-widest text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Destinations
          </Link>
        </div>

        <div className="absolute inset-0 flex items-end pb-20">
          <div className="editorial-container w-full">
            <div className="max-w-3xl">
              <div className="flex items-center space-x-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase border border-white/30">
                  {destination.nepaliName}
                </span>
                <span className="text-white/80 text-xs font-mono flex items-center">
                  <Mountain className="w-3.5 h-3.5 mr-1.5 text-saffron-light" />
                  {destination.elevation}
                </span>
              </div>
              
              <h1 className="font-editorial-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
                {destination.name}
              </h1>
              <p className="text-lg sm:text-xl text-parchment-200 font-display-serif italic mt-4 max-w-xl">
                {destination.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="editorial-container py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Left Column: Story & Details */}
          <div className="lg:col-span-8 space-y-12">
            <div className="prose prose-lg prose-himalaya max-w-none font-light text-himalaya-800 leading-relaxed">
              <p className="text-xl sm:text-2xl font-display-serif text-himalaya-950 leading-relaxed mb-8">
                {destination.description}
              </p>
              <p>
                Our journeys into {destination.name} are designed to go beyond the surface. We collaborate with local communities, stay in authentic heritage homes, and walk ancient trails that tell the stories of this magnificent region.
              </p>
            </div>

            <div className="bg-white border border-parchment-300 p-8 sm:p-12 rounded-3xl shadow-editorial">
              <h2 className="font-editorial-serif text-3xl font-bold text-himalaya-950 mb-8 pb-4 border-b border-parchment-200">
                Region Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {destination.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-himalaya-800">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar Info */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              {/* Polaroid Image */}
              <div className="polaroid-frame rotate-2 bg-white">
                <div className="relative aspect-square w-full">
                   <SafeImage
                    src={destination.image?.src || '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg'}
                    alt={destination.image?.alt || destination.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                   />
                </div>
                <div className="p-4 text-center">
                   <p className="font-display-serif italic text-sm text-himalaya-700">{destination.name}</p>
                </div>
              </div>
              
              <div className="bg-himalaya-950 text-white rounded-3xl p-8 shadow-editorial">
                <h3 className="font-editorial-serif text-2xl font-bold mb-4 text-saffron-light">
                  Plan Your Journey Here
                </h3>
                <p className="text-sm text-himalaya-300 font-light leading-relaxed mb-8">
                  Let Sakar curate a private itinerary integrating the highlights of {destination.name} at a meaningful pace.
                </p>
                <Link 
                  href="#booking"
                  className="block w-full py-4 text-center rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-bold tracking-wide transition-colors"
                >
                  Inquire Now
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      <InquiryForm availableEvents={availableEvents} />

      {/* JSON-LD TouristDestination Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'TouristDestination',
            name: destination.name,
            description: destination.description,
            url: getCanonicalUrl(`/destinations/${destination.slug || destination.id}`),
            image: [
              destination.image?.src
                ? (destination.image.src.startsWith('http')
                    ? destination.image.src
                    : `${SITE_ORIGIN}${destination.image.src}`)
                : `${SITE_ORIGIN}/explore-with-sakar/images/mountains/sunrise-himalayas.jpg`,
            ],
            containedInPlace: {
              '@type': 'Country',
              name: 'Nepal',
            },
          }),
        }}
      />
    </div>
  );
}
