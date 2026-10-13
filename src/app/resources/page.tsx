import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import Link from 'next/link';
import {
  Sun,
  FileText,
  Heart,
  Luggage,
  Activity,
  Wifi,
  Sparkles,
  Check,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import PageHero from '@/components/common/PageHero';
import SectionHeading from '@/components/common/SectionHeading';
import CTASection from '@/components/common/CTASection';
import { TRAVEL_RESOURCES } from '@/data/resources';
import { getPageContent } from '@/lib/content';
import { getPageHeroOverrides, isSectionVisible } from '@/lib/pageContentHelper';
import { SITE_ORIGIN } from '@/lib/config';

const FALLBACK_METADATA: Metadata = {
  title: 'Nepal Travel Resources & Guide | Explore With Sakar',
  description: 'Essential travel advice for visiting Nepal: best seasons & climate, visa & entry, cultural etiquette, packing checklist, altitude safety, and SIM connectivity.',
  alternates: { canonical: `${SITE_ORIGIN}/resources` },
};

export async function generateMetadata(): Promise<Metadata> {
  return await buildPageMetadata('resources', FALLBACK_METADATA);
}

export default async function ResourcesPage() {
  const pageContent = await getPageContent('resources');

  const hero = getPageHeroOverrides(pageContent, {
    badge: 'Traveler Guide',
    title: 'Nepal Travel Resources & Practical Guide',
    subtitle: 'Thoughtful advice curated by local host Sakar to help you prepare respectfully and comfortably for your Himalayan journey.',
  });

  const iconMap: Record<string, any> = {
    Sun,
    FileText,
    Heart,
    Luggage,
    Activity,
    Wifi,
  };

  return (
    <div className="min-h-screen bg-parchment-100">
      {/* 1. Page Hero */}
      {hero.visible && (
        <PageHero
          badge={hero.badge}
          nepaliTitle="नेपाल यात्रा जानकारी"
          title={hero.title}
          subtitle={hero.subtitle}
          backgroundImage="/explore-with-sakar/images/trails/mountain-pass.jpg"
          breadcrumbs={[{ label: 'Resources' }]}
        />
      )}

      {/* 2. Quick Navigation Grid & Detailed Guide Sections */}
      {isSectionVisible(pageContent, 'sec-res-grid', 'resources-grid') && (
        <>
          <section className="py-12 bg-white border-b border-parchment-300">
            <div className="editorial-container">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {TRAVEL_RESOURCES.map((sec) => {
                  const Icon = iconMap[sec.iconName] || Sparkles;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="p-4 rounded-2xl bg-parchment-100 hover:bg-terracotta/10 border border-parchment-300 hover:border-terracotta/30 text-center space-y-2 transition-colors group"
                    >
                      <Icon className="w-5 h-5 mx-auto text-terracotta transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold text-himalaya-900 group-hover:text-terracotta-dark block leading-tight">
                        {sec.title.split('&')[0]}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. Detailed Guide Sections */}
          <section className="py-20 sm:py-28 bg-sand">
            <div className="editorial-container space-y-16">
              {TRAVEL_RESOURCES.map((section, idx) => {
                const Icon = iconMap[section.iconName] || Sparkles;

                return (
                  <div
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-32 bg-white rounded-3xl p-8 sm:p-12 border border-parchment-300 shadow-subtle space-y-8"
                  >
                    {/* Section Header */}
                    <div className="flex items-start space-x-4 border-b border-parchment-200 pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-1">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-terracotta">
                          Guide 0{idx + 1}
                        </span>
                        <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-himalaya-950 mt-1">
                          {section.title}
                        </h2>
                        <p className="text-sm text-himalaya-600 font-light mt-1">
                          {section.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-base text-himalaya-700 font-light leading-relaxed">
                      {section.overview}
                    </p>

                    {/* Key Points Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {section.keyPoints.map((point, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-5 rounded-2xl bg-parchment-50 border border-parchment-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-editorial-serif text-base font-bold text-himalaya-950">
                              {point.heading}
                            </h3>
                            {point.tag && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron/20 text-saffron-dark">
                                {point.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-himalaya-600 font-light leading-relaxed">
                            {point.details}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Sakar's Practical Tips */}
                    {section.practicalTips.length > 0 && (
                      <div className="p-6 rounded-2xl bg-sand/70 border border-parchment-300 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-himalaya-950 flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                          Sakar’s Host Tips
                        </h4>
                        <ul className="space-y-2">
                          {section.practicalTips.map((tip, tIdx) => (
                            <li
                              key={tIdx}
                              className="flex items-start text-xs sm:text-sm text-himalaya-700 font-light"
                            >
                              <span className="text-terracotta mr-2 leading-none mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* 4. Have Specific Questions? Link to FAQ */}
      {isSectionVisible(pageContent, 'sec-res-cta', 'cta') && (
        <>
          <section className="py-16 bg-white border-t border-b border-parchment-300">
            <div className="editorial-container max-w-4xl text-center space-y-4">
              <HelpCircle className="w-10 h-10 text-terracotta mx-auto" />
              <h3 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-himalaya-950">
                Have More Specific Questions?
              </h3>
              <p className="text-sm text-himalaya-600 font-light max-w-xl mx-auto">
                Explore our frequently asked questions covering homestay privacy, dietary options, booking deposits, and packing details.
              </p>
              <div className="pt-2">
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-himalaya-950 hover:bg-terracotta text-white font-bold text-xs tracking-widest uppercase transition-colors"
                >
                  <span>Visit Frequently Asked Questions</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </section>

          {/* 5. CTA Section */}
          <CTASection
            title="Ready to Plan Your Nepal Journey?"
            subtitle="Reach out directly to Sakar to discuss your preferred dates, packing questions, or custom travel ideas."
            primaryButtonText="Contact Sakar Directly"
            primaryButtonHref="/contact"
            secondaryButtonText="Explore Experiences"
            secondaryButtonHref="/experiences"
          />
        </>
      )}
    </div>
  );
}
