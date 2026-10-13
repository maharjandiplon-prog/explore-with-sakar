import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  MapPin,
  Heart,
  Globe,
  Leaf,
  Check,
  ArrowRight,
  ShieldCheck,
  Users,
} from 'lucide-react';
import PageHero from '@/components/common/PageHero';
import SectionHeading from '@/components/common/SectionHeading';
import CTASection from '@/components/common/CTASection';
import TestimonialCard from '@/components/common/TestimonialCard';
import { getPublicReviews, getPageContent } from '@/lib/content';
import { getPageHeroOverrides, isSectionVisible } from '@/lib/pageContentHelper';
import { SITE_ORIGIN } from '@/lib/config';

const FALLBACK_METADATA: Metadata = {
  title: 'About Sakar & Our Story | Explore With Sakar',
  description: 'Meet Sakar, Responsible Tour Director in Nepal. Learn about his background in community development, local roots in Kathmandu, and philosophy of slow, meaningful travel.',
  alternates: { canonical: `${SITE_ORIGIN}/about` },
};

export async function generateMetadata(): Promise<Metadata> {
  return await buildPageMetadata('about', FALLBACK_METADATA);
}

export default async function AboutPage() {
  const [allReviews, pageContent] = await Promise.all([
    getPublicReviews(),
    getPageContent('about'),
  ]);
  const reviews = allReviews.slice(0, 3);

  const hero = getPageHeroOverrides(pageContent, {
    badge: 'Meet Your Local Host',
    title: 'A Journey Rooted in Connection and Purpose',
    subtitle: 'Travel beyond sightseeing. We connect conscious travelers with the living heritage, mountain communities, and untold stories of Nepal.',
  });

  return (
    <div className="min-h-screen bg-parchment-100">
      {/* 1. Page Hero */}
      {hero.visible && (
        <PageHero
          badge={hero.badge}
          nepaliTitle="हाम्रो कथा र साकर"
          title={hero.title}
          subtitle={hero.subtitle}
          backgroundImage="/explore-with-sakar/images/mountains/himalayan-peaks.jpg"
          breadcrumbs={[{ label: 'About Sakar' }]}
        />
      )}

      {/* 2. Personal Story & Background */}
      {isSectionVisible(pageContent, 'sec-about-story', 'story') && (
        <section className="py-20 sm:py-28 bg-white border-b border-parchment-300">
          <div className="editorial-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
              {/* Left Column: Narrative */}
              <div className="lg:col-span-7 space-y-8">
                <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-terracotta/10 text-terracotta text-xs font-semibold uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5" />
                  <span>The Story of Sakar</span>
                </span>

                <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-himalaya-950 leading-tight">
                  Connecting People With the Soul of Nepal
                </h2>

                <div className="prose prose-lg text-himalaya-800 font-light leading-relaxed space-y-6">
                  <p>
                    For Sakar, Nepal has never been just a destination. It has always been a story waiting to be understood. Growing up in the Kathmandu Valley, he was surrounded by a living heritage — ancient temples, traditional courtyards, festivals, artisans and communities where history was not preserved only in books, but experienced through everyday life.
                  </p>

                  <p>
                    Through his involvement in education, social development and community work, Sakar had the opportunity to walk closer with the people of Nepal — listening to their stories, understanding their challenges and witnessing their resilience. These experiences shaped the way he sees travel. For Sakar, a journey is not simply about visiting a monument, capturing a photograph or following a fixed itinerary. It is about discovering the meaning behind a place — the people, traditions, emotions and stories that give it life.
                  </p>

                  <blockquote className="my-8 p-8 rounded-3xl bg-sand/80 border-l-4 border-terracotta text-himalaya-950 italic font-display-serif text-xl sm:text-2xl leading-snug">
                    &ldquo;A temple represents generations of faith and devotion. A village reflects the dreams, memories and relationships of its people. A mountain represents not only nature&rsquo;s beauty, but also humility, strength and connection.&rdquo;
                  </blockquote>

                  <p>
                    This belief inspired him to create <strong>Explore With Sakar</strong> — a platform dedicated to meaningful experiences that connect travellers with the deeper essence of Nepal. As a cultural bridge and local fixer, Sakar helps create authentic connections, bringing together travellers with local communities, artisans, traditions and experiences that are often missed through ordinary travel.
                  </p>
                </div>

                {/* What Travelers Discover */}
                <div className="pt-8 border-t border-parchment-200">
                  <h3 className="font-editorial-serif text-2xl font-bold text-himalaya-950 mb-6 flex items-center">
                    <Globe className="w-6 h-6 text-terracotta mr-3" />
                    Why Travel With Sakar?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      'Meaningful connections with local communities & artisans',
                      'Hidden corners of Nepal beyond the tourist trail',
                      'Ancient wisdom, Himalayan traditions & spiritual landscapes',
                      'Personalised journeys built around your curiosity',
                      'Authentic encounters with Nepal\'s living culture',
                      'A journey of learning, connection and self-discovery',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-sm text-himalaya-800 font-light leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Host Card & Core Values */}
              <div className="lg:col-span-5 sticky top-28 space-y-8">
                {/* Host Portrait Card */}
                <div className="bg-sand p-6 sm:p-8 rounded-3xl border border-parchment-300 shadow-editorial space-y-6">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-himalaya-900">
                    <Image
                      src="/explore-with-sakar/images/sakar/sakar-portrait.jpg"
                      alt="Sakar — Responsible Tour Director"
                      fill
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className="object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-himalaya-950/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                      <p className="font-display-serif italic text-xl">Sakar</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-saffron-light">
                        Responsible Tour Director & Founder
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-himalaya-700 font-light leading-relaxed">
                    <div className="flex items-center space-x-2 text-himalaya-900 font-semibold">
                      <MapPin className="w-4 h-4 text-terracotta" />
                      <span>Based in Kathmandu, Nepal</span>
                    </div>
                    <p>
                      Fluent in English and Nepali, with deep cultural relationships across the Kathmandu Valley, Annapurna foothills, and Langtang.
                    </p>
                  </div>
                </div>

                {/* The Host Promise */}
                <div className="bg-himalaya-950 text-white p-8 rounded-3xl shadow-editorial space-y-4">
                  <div className="flex items-center space-x-2 text-saffron-light text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    <span>The Host Promise</span>
                  </div>
                  <p className="text-sm font-light text-parchment-200 leading-relaxed">
                    &ldquo;As your private host, I ensure no hurried itineraries, no mass-market tourist traps, and no middlemen. Just honest, deeply personal travel with genuine human care.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Traveler Reflections on Sakar */}
      {isSectionVisible(pageContent, 'sec-about-reflections', 'reflections') && (
        <section className="py-20 sm:py-28 bg-sand border-b border-parchment-300">
          <div className="editorial-container">
            <SectionHeading
              tag="Traveler Voices"
              nepaliTag="यात्रीहरूको भनाइ"
              title="What Travelers Say About Exploring With Sakar"
              description="Read firsthand reflections from international guests who journeyed across Nepal with Sakar."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((t, idx) => (
                <TestimonialCard key={t.id} testimonial={t} featured={idx === 0} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. CTA Section */}
      {isSectionVisible(pageContent, 'sec-about-cta', 'cta') && (
        <CTASection
          title="Ready to Explore Nepal with Sakar?"
          subtitle="Connect directly with Sakar to begin co-creating your personalized, unhurried journey."
          primaryButtonText="Start a Conversation"
          primaryButtonHref="/contact"
          secondaryButtonText="Explore Experiences"
          secondaryButtonHref="/experiences"
        />
      )}
    </div>
  );
}
