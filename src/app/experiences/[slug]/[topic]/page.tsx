import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  Users,
  MapPin,
  Sun,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Quote,
} from 'lucide-react';
import { getPublicExperienceBySlug, getPublicExperiences } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import CTASection from '@/components/common/CTASection';
import { EXPERIENCE_PILLARS } from '@/lib/experiencePillars';
import { EXPERIENCES } from '@/data/experiences';
import { getCanonicalUrl } from '@/lib/config';

// ISR: cached for 5 minutes at Edge, revalidated on-demand when admin updates experiences
export const revalidate = 300;

interface Props {
  params: { slug: string; topic: string };
}

const TOPIC_ALIASES: Record<string, string> = {
  // Go Beyond the Map
  'kathmandu-square': 'kathmandu-durbar-square',
  'bhaktapur-square': 'bhaktapur-durbar-square',
  'patan-square': 'patan-durbar-square',
  'pokhara': 'pokhara-laid-back-city',
  'living-courtyards': 'kathmandu-durbar-square',
  'living-courtyards-kathmandu': 'kathmandu-durbar-square',
  'echoes-in-stone': 'patan-durbar-square',
  'echoes-in-stone-patan-bhaktapur': 'patan-durbar-square',
  'artisans-path': 'bhaktapur-durbar-square',
  'artisans-path-heritage-deep-dive': 'bhaktapur-durbar-square',
  'sacred-geometry-architecture-valley': 'sacred-geometry-valley',
  'chitwan-national-park': 'beyond-the-map',
  'muktinath-sacred-pilgrimage-passage': 'beyond-the-map',

  // Go Within (Spiritual & Sound Sanctuary)
  'singing-bowls': 'cosmic-language-of-sound',
  'spiritual-immersion-singing-bowls': 'cosmic-language-of-sound',
  'cosmic-sound': 'cosmic-language-of-sound',
  'nada-yoga': 'cosmic-language-of-sound',
  'pharping': 'taudaha-and-pharping',
  'pharping-sacred-cave-meditation': 'taudaha-and-pharping',
  'taudaha': 'taudaha-and-pharping',
  'namo-buddha': 'essence-of-buddhism',
  'namo-buddha-sacred-ridge-walk': 'essence-of-buddhism',
  'monastery-chanting': 'essence-of-buddhism',
  'monastery-chanting-inner-silence': 'essence-of-buddhism',
  'buddhism': 'essence-of-buddhism',
  'pashupati': 'pashupati-life-and-eternity',
  'pashupatinath': 'pashupati-life-and-eternity',
  'shamanism': 'himalayan-shamanism',
  'dhami-jhankri': 'himalayan-shamanism',
  'ashram': 'beyond-names-ashram',
  'beyond-names': 'beyond-names-ashram',
  'sacred-geometry': 'sacred-geometry-valley',
  'astrology': 'nepali-birth-chart-janma-kundali',
  'birth-chart': 'nepali-birth-chart-janma-kundali',
  'janma-kundali': 'nepali-birth-chart-janma-kundali',

  // Feel Closer (Village Homestays)
  'panauti': 'village-homestay-panauti-balalthali',
  'village-homestay-community-immersion': 'village-homestay-panauti-balalthali',
  'ghandruk': 'ghandruk-gurung-heritage-homestay',
  'helambu': 'helambu-hyolmo-hearth-living',
  'bungamati': 'bungamati-khokana-artisan-village',

  // Legacy mappings
  'langtang': 'langtang-tamang-heritage-trail',
  'community-reforestation': 'community-sacred-forest-reforestation',
  'strategic-capacity-building': 'strategic-community-capacity-building',
};

async function getTopic(topicSlug: string) {
  const resolvedSlug = TOPIC_ALIASES[topicSlug] || topicSlug;
  let experience = await getPublicExperienceBySlug(resolvedSlug);
  if (!experience && resolvedSlug !== topicSlug) {
    experience = await getPublicExperienceBySlug(topicSlug);
  }
  if (!experience) {
    const all = await getPublicExperiences();
    experience = all.find(
      (e) =>
        e.slug === resolvedSlug ||
        e.slug === topicSlug ||
        e.slug.includes(topicSlug)
    ) || null;
  }
  // Canonical fallback from EXPERIENCES
  if (!experience) {
    experience = (EXPERIENCES.find(
      (e) =>
        e.slug === resolvedSlug ||
        e.slug === topicSlug ||
        e.id === resolvedSlug ||
        e.id === topicSlug ||
        e.slug.includes(topicSlug)
    ) as any) || null;
  }
  return experience;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, topic } = params;
  const experience = await getTopic(topic);
  if (!experience) {
    return { title: 'Topic Not Found | Explore With Sakar' };
  }

  const canonicalPillar =
    slug === 'go-spiritual' || slug === 'spiritual-wellness' ? 'go-within' : slug;
  const canonicalUrl = getCanonicalUrl(`/experiences/${canonicalPillar}/${experience.slug}`);
  const seoTitle = experience.seoTitle || `${experience.title} | Explore With Sakar`;
  const seoDesc = experience.seoDescription || experience.shortDescription;
  const ogImg =
    experience.ogImage ||
    experience.heroImage?.src ||
    '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg';

  return {
    title: seoTitle,
    description: seoDesc,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: canonicalUrl,
      images: [ogImg],
    },
  };
}

export async function generateStaticParams() {
  const all = await getPublicExperiences();
  const paramsList: { slug: string; topic: string }[] = [];

  const categoryToExperience: Record<string, string> = {
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

  for (const exp of all) {
    const parent = categoryToExperience[exp.category];
    if (parent) {
      paramsList.push({ slug: parent, topic: exp.slug });
    }
  }

  return paramsList;
}

export default async function IndividualTopicPage({ params }: Props) {
  const { slug, topic } = params;

  // Canonicalize legacy spiritual slugs to go-within
  if (slug === 'go-spiritual' || slug === 'spiritual-wellness') {
    const { permanentRedirect } = await import('next/navigation');
    permanentRedirect(`/experiences/go-within/${topic}`);
  }

  const oldPillars = ['leave-a-mark', 'responsible'];
  const oldTopics = [
    'langtang-tamang-heritage-trail',
    'chitwan-indigenous-tharu-guardians',
    'community-sacred-forest-reforestation',
    'strategic-community-capacity-building',
    'langtang',
    'chitwan-old',
    'community-reforestation',
    'strategic-capacity-building',
  ];

  if (oldPillars.includes(slug) || oldTopics.includes(topic)) {
    const { permanentRedirect } = await import('next/navigation');
    permanentRedirect('/experiences/beyond-the-map');
  }

  const experience = await getTopic(topic);

  if (!experience) {
    notFound();
  }

  // 308 Permanent Redirect aliased topic slugs to their canonical experience route
  if (experience.slug !== topic) {
    const { permanentRedirect } = await import('next/navigation');
    permanentRedirect(`/experiences/${slug}/${experience.slug}`);
  }

  const pillar = EXPERIENCE_PILLARS[slug] || {
    name: experience.categoryLabel || 'Experience',
    canonicalSlug: slug,
  };

  const rawDesc: any = experience.fullDescription;
  const fullDesc: string[] = Array.isArray(rawDesc)
    ? rawDesc
    : typeof rawDesc === 'string'
    ? rawDesc.split('\n\n').filter(Boolean)
    : [experience.shortDescription || ''];

  const highlights = experience.highlights || (experience as any).culturalHighlights || [];
  const days = experience.days || (experience as any).itineraryOutline || [];
  const heroImg =
    experience.heroImage?.src ||
    (experience as any).image ||
    '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg';
  const heroAlt = experience.heroImage?.alt || experience.title;
  const quoteData = (experience as any).keyQuote;

  const inquiryHref = `/contact?subject=${encodeURIComponent(`Inquiry for ${experience.title}`)}`;

  return (
    <div className="min-h-screen bg-sand">
      {/* 1. Breadcrumbs Navigation */}
      <div className="bg-parchment-200 border-b border-parchment-300 py-4">
        <div className="editorial-container flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 uppercase font-bold tracking-widest text-himalaya-600">
            <Link href="/" className="hover:text-terracotta transition-colors">
              Home
            </Link>
            <span className="text-himalaya-400">/</span>
            <Link href="/experiences" className="hover:text-terracotta transition-colors">
              Experiences
            </Link>
            <span className="text-himalaya-400">/</span>
            <Link
              href={`/experiences/${pillar.canonicalSlug || slug}`}
              className="hover:text-terracotta transition-colors text-himalaya-800"
            >
              {pillar.name}
            </Link>
            <span className="text-himalaya-400">/</span>
            <span className="text-terracotta truncate max-w-[240px]">{experience.title}</span>
          </div>

          <Link
            href={`/experiences/${pillar.canonicalSlug || slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {pillar.name}</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Header Section: Title & Key Metadata */}
      <section className="bg-parchment-100 py-12 sm:py-16 border-b border-parchment-200">
        <div className="editorial-container max-w-5xl mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-himalaya-950 text-white text-[11px] font-bold uppercase tracking-widest w-max">
              <span>{pillar.name}</span>
              {experience.nepaliTitle && (
                <span className="text-saffron font-serif font-normal">
                  • {experience.nepaliTitle}
                </span>
              )}
            </div>

            <h1 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-himalaya-950 tracking-tight leading-tight">
              {experience.title}
            </h1>

            {experience.tagline || experience.shortDescription ? (
              <p className="text-base sm:text-lg text-himalaya-700 font-display-serif italic leading-relaxed border-l-2 border-terracotta pl-6 max-w-3xl">
                {experience.tagline || experience.shortDescription}
              </p>
            ) : null}

            {/* Quick Metadata: Duration & Group Format */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-parchment-300">
              {experience.duration && (
                <div className="p-3 bg-white rounded-xl border border-parchment-300">
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                    Duration
                  </span>
                  <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-900">
                    <Clock className="w-4 h-4 mr-1.5 text-terracotta shrink-0" />
                    {experience.duration}
                  </span>
                </div>
              )}

              {experience.groupSize && (
                <div className="p-3 bg-white rounded-xl border border-parchment-300">
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                    Group Format
                  </span>
                  <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-900">
                    <Users className="w-4 h-4 mr-1.5 text-terracotta shrink-0" />
                    {experience.groupSize}
                  </span>
                </div>
              )}

              {experience.location && (
                <div className="p-3 bg-white rounded-xl border border-parchment-300">
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                    Location
                  </span>
                  <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-900 truncate">
                    <MapPin className="w-4 h-4 mr-1.5 text-terracotta shrink-0" />
                    <span className="truncate">{experience.location ? experience.location.split(',')[0] : ''}</span>
                  </span>
                </div>
              )}

              {experience.season && (
                <div className="p-3 bg-white rounded-xl border border-parchment-300">
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-himalaya-700 mb-1">
                    Best Season
                  </span>
                  <span className="flex items-center text-xs sm:text-sm font-semibold text-himalaya-900 truncate">
                    <Sun className="w-4 h-4 mr-1.5 text-terracotta shrink-0" />
                    <span className="truncate">{experience.season ? experience.season.split('(')[0].trim() : ''}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Inquiry Button Strip */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href={inquiryHref}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-bold tracking-wide transition-colors shadow-warm"
              >
                <span>Inquire About {experience.title.split(':')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/experiences/${pillar.canonicalSlug || slug}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-parchment-300 text-himalaya-800 text-sm font-medium hover:bg-parchment-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>View All {pillar.name} Topics</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Large Topic Image */}
      <section className="py-8 bg-parchment-50">
        <div className="editorial-container max-w-5xl mx-auto">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden bg-himalaya-900 shadow-editorial border border-parchment-300">
            <Image
              src={heroImg}
              alt={heroAlt}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-himalaya-950/40 via-transparent to-transparent" />
            {experience.heroImage?.caption && (
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 py-2 bg-white/95 backdrop-blur-md text-xs font-display-serif italic text-himalaya-900 max-w-md rounded-xl shadow-subtle">
                {experience.heroImage.caption}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Topic Quote Block */}
      {quoteData && quoteData.quote && (
        <section className="py-8 bg-parchment-50">
          <div className="editorial-container max-w-4xl mx-auto">
            <div className="relative p-8 sm:p-10 rounded-3xl bg-white border border-parchment-300 shadow-editorial">
              <Quote className="w-10 h-10 text-terracotta/20 absolute top-6 right-6" />
              <blockquote className="space-y-4">
                <p className="font-display-serif italic text-lg sm:text-xl text-himalaya-900 leading-relaxed">
                  &ldquo;{quoteData.quote}&rdquo;
                </p>
                {quoteData.attribution && (
                  <footer className="text-xs font-mono font-bold uppercase tracking-wider text-terracotta">
                    — {quoteData.attribution}
                  </footer>
                )}
              </blockquote>
            </div>
          </div>
        </section>
      )}

      {/* 5. Detailed Itinerary / Topic Narrative Content */}
      <div className="editorial-container max-w-5xl mx-auto py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Narrative & Itinerary Outline */}
          <div className="lg:col-span-8 space-y-12">
            {/* Detailed Description */}
            <section className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-terracotta">
                Detailed Itinerary & Cultural Context
              </span>
              <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-himalaya-950">
                Stepping Past the Tourist Facade
              </h2>
              <div className="prose prose-lg prose-himalaya max-w-none font-normal leading-relaxed space-y-5 text-himalaya-800">
                {fullDesc.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Topic Specific Highlights */}
            {highlights.length > 0 && (
              <section className="bg-white border border-parchment-300 rounded-3xl p-8 sm:p-10 shadow-editorial">
                <div className="flex items-center mb-6">
                  <Sparkles className="w-5 h-5 text-terracotta mr-3" />
                  <h3 className="font-editorial-serif text-2xl font-bold text-himalaya-950">
                    Topic Highlights
                  </h3>
                </div>
                <ul className="space-y-4">
                  {highlights.map((highlight: string, idx: number) => (
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

            {/* Chronicle of the Days / Daily Rhythms */}
            {days.length > 0 && (
              <section className="space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-terracotta">
                    Chronicle of the Journey
                  </span>
                  <h3 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-himalaya-950 mt-1">
                    Daily Schedule & Pacing
                  </h3>
                </div>

                <div className="space-y-5">
                  {days.map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-6 sm:p-8 bg-white rounded-2xl border border-parchment-300 shadow-subtle flex flex-col sm:flex-row gap-5"
                    >
                      <div className="sm:w-32 shrink-0">
                        <span className="inline-block px-3 py-1 bg-terracotta text-white text-xs font-bold uppercase tracking-wider rounded-full">
                          {day.day || `Day ${day.dayNumber || idx + 1}`}
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

                <p className="text-xs font-display-serif italic text-himalaya-600 text-center pt-2">
                  * Note: All daily rhythms and walking paces are personalized to your physical comfort.
                </p>
              </section>
            )}
          </div>

          {/* Sticky Sidebar: Host Note & Inquiries */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              {/* Sakar's Personal Note */}
              {experience.sakarNote && (
                <div className="p-6 sm:p-8 rounded-3xl bg-himalaya-950 text-white shadow-editorial">
                  <div className="text-xs uppercase font-bold tracking-widest text-saffron mb-3 border-b border-white/20 pb-2">
                    Host Perspective from Sakar
                  </div>
                  <p className="font-display-serif italic text-sm sm:text-base text-parchment-200 leading-relaxed">
                    &ldquo;{experience.sakarNote}&rdquo;
                  </p>
                </div>
              )}

              {/* Practical Details & Inquiry Card */}
              <div className="p-6 sm:p-8 bg-white border border-parchment-300 rounded-3xl shadow-subtle space-y-5">
                <h4 className="font-editorial-serif text-xl font-bold text-himalaya-950 border-b border-parchment-200 pb-3">
                  Journey Summary
                </h4>

                <div className="space-y-3 text-xs sm:text-sm">
                  {experience.duration && (
                    <div className="flex justify-between py-1.5 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Duration</span>
                      <span className="font-semibold text-himalaya-950">{experience.duration}</span>
                    </div>
                  )}

                  {experience.groupSize && (
                    <div className="flex justify-between py-1.5 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Group Size</span>
                      <span className="font-semibold text-himalaya-950">{experience.groupSize}</span>
                    </div>
                  )}

                  {experience.location && (
                    <div className="flex justify-between py-1.5 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Location</span>
                      <span className="font-semibold text-himalaya-950">{experience.location}</span>
                    </div>
                  )}

                  {experience.season && (
                    <div className="flex justify-between py-1.5 border-b border-parchment-100">
                      <span className="text-himalaya-700 font-mono uppercase text-[11px] font-bold">Best Season</span>
                      <span className="font-semibold text-himalaya-950">{experience.season}</span>
                    </div>
                  )}
                </div>

                {/* Inclusions */}
                {((experience.inclusions && experience.inclusions.length > 0) ||
                  ((experience as any).included && (experience as any).included.length > 0)) && (
                  <div className="pt-2">
                    <span className="block text-himalaya-700 font-mono uppercase text-[11px] mb-2 font-bold">
                      What Is Included
                    </span>
                    <ul className="space-y-1.5">
                      {(experience.inclusions || (experience as any).included || []).map(
                        (item: string, idx: number) => (
                          <li key={idx} className="flex items-start text-himalaya-800 font-medium text-xs">
                            <Check className="w-3.5 h-3.5 text-terracotta mr-2 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Main Inquiry Button */}
                <div className="pt-3">
                  <Link
                    href={inquiryHref}
                    className="block w-full py-4 text-center rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-bold tracking-wide transition-colors shadow-warm text-sm"
                  >
                    Inquire About {experience.title.split(':')[0]} →
                  </Link>
                </div>
              </div>

              {/* Responsible Footprint */}
              {experience.impactFootprint && (
                <div className="p-6 bg-parchment-200/60 rounded-2xl border border-parchment-300">
                  <h5 className="text-[11px] uppercase font-bold tracking-widest text-himalaya-950 mb-2">
                    Responsible Community Footprint
                  </h5>
                  <p className="text-xs text-himalaya-800 font-normal leading-relaxed">
                    {experience.impactFootprint}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bottom CTA Section */}
      <CTASection
        title={`Plan Your Journey to ${experience.title.split(':')[0]}`}
        subtitle="Connect directly with Sakar to discuss unhurried dates, personal pace, and custom inclusions."
        primaryButtonText={`Inquire About ${experience.title.split(':')[0]}`}
        primaryButtonHref={inquiryHref}
        secondaryButtonText={`Explore More in ${pillar.name}`}
        secondaryButtonHref={`/experiences/${pillar.canonicalSlug || slug}`}
      />
    </div>
  );
}
