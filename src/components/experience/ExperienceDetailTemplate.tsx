import React from 'react';
import SafeImage from '@/components/common/SafeImage';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Users,
  Sun,
  ArrowLeft,
  Check,
  Sparkles,
  ArrowRight,
  Compass,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { ExtendedExperience } from '@/types/cms';
import ExperienceCard from '@/components/common/ExperienceCard';
import CTASection from '@/components/common/CTASection';
import { SITE_ORIGIN, getCanonicalUrl } from '@/lib/config';
import { safeJsonLd } from '@/lib/json-ld';

interface Props {
  experience: ExtendedExperience;
  relatedExperiences?: ExtendedExperience[];
}

export default function ExperienceDetailTemplate({
  experience,
  relatedExperiences = [],
}: Props) {
  const highlights = experience.highlights || (experience as any).culturalHighlights || [];
  const days = experience.days || (experience as any).itineraryOutline || [];
  const gallery = experience.gallery || (experience as any).galleryImages || [];
  const fullDesc = Array.isArray(experience.fullDescription)
    ? experience.fullDescription
    : [experience.fullDescription || experience.shortDescription];

  const heroImg =
    experience.heroImage?.src ||
    (experience as any).image ||
    '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg';
  const heroAlt = experience.heroImage?.alt || experience.title;

  const canonicalUrl = getCanonicalUrl(`/experiences/${experience.slug}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${SITE_ORIGIN}/`,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Experiences',
            'item': `${SITE_ORIGIN}/experiences`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': experience.title,
            'item': canonicalUrl,
          },
        ],
      },
      {
        '@type': 'TouristTrip',
        'name': experience.title,
        'description': experience.shortDescription,
        'url': canonicalUrl,
        'image': heroImg,
        'touristType': experience.category || 'Cultural',
        'offers': {
          '@type': 'Offer',
          'category': 'Curated Experience',
          'availability': 'https://schema.org/InStock',
        },
        'provider': {
          '@type': 'TravelAgency',
          'name': 'Explore With Sakar',
          'url': `${SITE_ORIGIN}/`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-sand">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      {/* 1. Full-Width Cinematic Hero Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh] lg:min-h-[75vh]">
        {/* Left: Content & Meta */}
        <div className="order-2 lg:order-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-parchment-200">
          <div className="mb-8 flex items-center space-x-2 text-xs uppercase font-bold tracking-widest text-himalaya-600">
            <Link
              href="/"
              className="hover:text-terracotta transition-colors"
            >
              Home
            </Link>
            <span className="text-himalaya-400">/</span>
            <Link
              href="/experiences"
              className="hover:text-terracotta transition-colors inline-flex items-center"
            >
              Experiences
            </Link>
            <span className="text-himalaya-400">/</span>
            <span className="text-terracotta truncate max-w-[200px]">{experience.title}</span>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-himalaya-950 text-white text-[10px] font-bold uppercase tracking-widest w-max mb-6">
            <span>{experience.categoryLabel || experience.category}</span>
            {experience.nepaliTitle && (
              <span className="text-saffron font-serif font-normal">
                • {experience.nepaliTitle}
              </span>
            )}
          </div>

          <h1 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-himalaya-950 tracking-tight leading-tight mb-4">
            {experience.title}
          </h1>

          <p className="text-base sm:text-lg text-himalaya-900 font-display-serif italic leading-relaxed mb-8 border-l-2 border-terracotta pl-6">
            {experience.tagline || experience.subtitle || experience.shortDescription}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-parchment-300">
            {experience.duration && (
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                  Duration
                </span>
                <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-950">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-terracotta shrink-0" />
                  {experience.duration}
                </span>
              </div>
            )}
            {experience.location && (
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                  Location
                </span>
                <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-950">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-terracotta shrink-0" />
                  {experience.location.split(',')[0]}
                </span>
              </div>
            )}
            {experience.groupSize && (
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                  Group Format
                </span>
                <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-950">
                  <Users className="w-3.5 h-3.5 mr-1.5 text-terracotta shrink-0" />
                  {experience.groupSize}
                </span>
              </div>
            )}
            {experience.season && (
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                  Best Season
                </span>
                <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-950">
                  <Sun className="w-3.5 h-3.5 mr-1.5 text-terracotta shrink-0" />
                  {experience.season.split('(')[0].trim()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Hero Image */}
        <div className="order-1 lg:order-2 relative w-full min-h-[40vh] lg:min-h-full bg-himalaya-900">
          <SafeImage
            src={heroImg}
            alt={heroAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-himalaya-950/20" />
          {experience.heroImage?.caption && (
            <div className="absolute bottom-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md text-xs font-display-serif italic text-himalaya-900 max-w-sm rounded-lg shadow-subtle">
              {experience.heroImage.caption}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Narrative & Detail Content */}
      <div className="editorial-container py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7 space-y-12">
            {/* Editorial Introduction */}
            <section className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-terracotta">
                Journey Essence
              </span>
              <h2 className="font-editorial-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-himalaya-950">
                Stepping Past the Monument Walls
              </h2>
              <div className="prose prose-lg prose-himalaya max-w-none font-normal leading-relaxed space-y-4 text-himalaya-800 text-base sm:text-lg">
                {fullDesc.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* What Makes This Experience Different */}
            {experience.whatMakesDifferent && (
              <section className="p-8 rounded-3xl bg-terracotta/5 border border-terracotta/20 space-y-3">
                <div className="flex items-center gap-2 text-terracotta text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>What Makes This Experience Different</span>
                </div>
                <p className="text-sm sm:text-base text-himalaya-900 font-normal leading-relaxed">
                  {experience.whatMakesDifferent}
                </p>
              </section>
            )}

            {/* Experience Highlights */}
            {highlights.length > 0 && (
              <section className="bg-white border border-parchment-300 rounded-3xl p-8 sm:p-10 shadow-editorial">
                <div className="flex items-center mb-6">
                  <Sparkles className="w-5 h-5 text-terracotta mr-3" />
                  <h3 className="font-editorial-serif text-2xl font-bold text-himalaya-950">
                    Signature Highlights
                  </h3>
                </div>
                <ul className="space-y-4">
                  {highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start space-x-3.5">
                      <div className="w-5 h-5 rounded-full bg-parchment-200 text-terracotta flex items-center justify-center shrink-0 mt-0.5 border border-parchment-300">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-himalaya-900 font-medium leading-relaxed text-sm sm:text-base">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Itinerary / Sequenced Content Sections */}
            {days.length > 0 && (
              <section className="space-y-8">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-terracotta">
                    Chronicle of the Days
                  </span>
                  <h3 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-himalaya-950 mt-1">
                    A Glimpse of the Journey
                  </h3>
                </div>

                <div className="space-y-6">
                  {days.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 bg-parchment-100 rounded-2xl border border-parchment-300"
                    >
                      <div className="sm:w-1/4 shrink-0">
                        <span className="inline-block px-3 py-1 bg-terracotta text-white text-xs font-bold uppercase tracking-widest rounded-full mb-2">
                          {(day as any).day || `Day ${day.dayNumber || idx + 1}`}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-editorial-serif text-lg sm:text-xl font-bold text-himalaya-950">
                          {day.title}
                        </h4>
                        <p className="text-himalaya-800 font-normal text-xs sm:text-sm leading-relaxed">
                          {day.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs font-display-serif italic text-himalaya-600 text-center">
                  * Note: All daily rhythms are completely customizable to your physical comfort and pacing.
                </p>
              </section>
            )}
          </div>

          {/* Right Column: Sticky Sakar's Note & Practical Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-8">
              {/* Sakar's Personal Note */}
              {experience.sakarNote && (
                <div className="relative p-8 rounded-3xl bg-himalaya-950 text-white shadow-editorial overflow-hidden">
                  <div className="text-xs uppercase font-bold tracking-widest text-saffron mb-4 border-b border-white/20 pb-3">
                    Host Perspective from Sakar
                  </div>
                  <p className="font-display-serif italic text-base sm:text-lg text-parchment-100 leading-relaxed relative z-10">
                    &ldquo;{experience.sakarNote}&rdquo;
                  </p>
                </div>
              )}

              {/* Practical Information Card */}
              <div className="p-8 bg-white border border-parchment-300 rounded-3xl shadow-subtle space-y-6">
                <h4 className="font-editorial-serif text-xl font-bold text-himalaya-950 border-b border-parchment-200 pb-3">
                  Practical Information
                </h4>

                <div className="space-y-4 text-xs sm:text-sm">
                  {experience.duration && (
                    <div className="flex justify-between py-2 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Duration</span>
                      <span className="font-semibold text-himalaya-950">{experience.duration}</span>
                    </div>
                  )}

                  {experience.location && (
                    <div className="flex justify-between py-2 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Location</span>
                      <span className="font-semibold text-himalaya-950">{experience.location}</span>
                    </div>
                  )}

                  {experience.groupSize && (
                    <div className="flex justify-between py-2 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Group Size</span>
                      <span className="font-semibold text-himalaya-950">{experience.groupSize}</span>
                    </div>
                  )}

                  {experience.season && (
                    <div className="flex justify-between py-2 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Best Months</span>
                      <span className="font-semibold text-himalaya-950">{experience.season}</span>
                    </div>
                  )}

                  {experience.idealFor && (
                    <div className="py-2 border-b border-parchment-100">
                      <span className="block text-himalaya-500 font-mono uppercase text-[11px] mb-1">
                        Ideal For
                      </span>
                      <span className="font-light text-himalaya-800 leading-relaxed">
                        {experience.idealFor}
                      </span>
                    </div>
                  )}

                  {((experience.inclusions && experience.inclusions.length > 0) || (experience.included && experience.included.length > 0)) && (
                    <div className="py-2">
                      <span className="block text-himalaya-500 font-mono uppercase text-[11px] mb-2">
                        What Is Included
                      </span>
                      <ul className="space-y-1.5">
                        {(experience.inclusions || experience.included || []).map((item: string, idx: number) => (
                          <li key={idx} className="flex items-center text-himalaya-700 text-xs">
                            <Check className="w-3.5 h-3.5 text-terracotta mr-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    href={`/contact?subject=${encodeURIComponent(`Inquiry for ${experience.title}`)}`}
                    className="block w-full py-4 text-center rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-bold tracking-wide transition-colors shadow-warm"
                  >
                    Inquire About This Journey
                  </Link>
                </div>
              </div>

              {/* Responsible Footprint */}
              {experience.impactFootprint && (
                <div className="p-6 bg-parchment-200/60 rounded-2xl border border-parchment-300">
                  <h5 className="text-[11px] uppercase font-bold tracking-widest text-himalaya-900 mb-2">
                    Responsible Community Footprint
                  </h5>
                  <p className="text-xs text-himalaya-700 font-light leading-relaxed">
                    {experience.impactFootprint}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visual Gallery */}
      {gallery.length > 0 && (
        <section className="border-t border-parchment-300 bg-white py-16 sm:py-24">
          <div className="editorial-container">
            <div className="text-center mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-terracotta">
                Atmosphere & Landscapes
              </span>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-himalaya-950 mt-1">
                Visual Impressions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {gallery.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-2xl overflow-hidden aspect-[4/5] bg-himalaya-900 ${
                    idx === 1 ? 'sm:-translate-y-4' : ''
                  }`}
                >
                  <SafeImage
                    src={img.src}
                    alt={img.alt || 'Experience impression'}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-himalaya-950/20" />
                  {img.caption && (
                    <div className="absolute bottom-3 left-3 right-3 p-2 bg-black/60 backdrop-blur-sm text-[11px] text-white rounded">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Related Experiences (2-3 items, NEVER the current experience) */}
      {relatedExperiences.length > 0 && (
        <section className="border-t border-parchment-300 bg-parchment-100 py-16 sm:py-24">
          <div className="editorial-container">
            <div className="text-center mb-12">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-terracotta">
                Complementary Journeys
              </span>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-himalaya-950 mt-1">
                Other Ways to Experience Nepal
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedExperiences.map((rel) => (
                <ExperienceCard key={rel.id} experience={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Final CTA / Inquiry */}
      <CTASection
        title={`Experience ${experience.title} With Sakar`}
        subtitle="Let us tailor this itinerary around your exact arrival dates, personal pacing, and preferred boutique lodgings."
        primaryButtonText="Start Planning Your Journey"
        primaryButtonHref={`/contact?subject=${encodeURIComponent(`Custom Inquiry: ${experience.title}`)}`}
        secondaryButtonText="Explore All Experiences"
        secondaryButtonHref="/experiences"
      />
    </div>
  );
}
