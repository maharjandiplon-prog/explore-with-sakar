'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  X,
  ChevronDown,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Camera,
  FileText,
  HelpCircle,
  BookOpen,
  Home,
  ShieldCheck,
  Compass,
  Mountain,
  Heart,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, useSiteNavigation } from '@/context/SettingsContext';
import { getNavIcon } from '@/lib/navIcons';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { settings } = useSettings();
  const siteNav = useSiteNavigation();
  const [openSection, setOpenSection] = useState<string | null>('experiences');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isLinkActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-himalaya-950/60 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm bg-parchment-100 h-full shadow-floating flex flex-col justify-between overflow-y-auto border-l border-parchment-300 touch-pan-y"
          >
            {/* Top Bar */}
            <div className="p-5 flex items-center justify-between border-b border-parchment-300 bg-white">
              <Link href="/" onClick={onClose} className="inline-block touch-manipulation">
                <Image
                  src={settings.branding?.logoUrl?.trim() || '/explore-with-sakar/images/logo.png'}
                  alt={settings.branding?.siteName || 'Explore With Sakar'}
                  width={140}
                  height={36}
                  priority
                  className="h-9 w-auto object-contain"
                />
              </Link>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-parchment-100 text-himalaya-800 hover:text-terracotta min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Accordions */}
            <div className="p-5 space-y-3 flex-1">
              {siteNav?.header && siteNav.header.length > 0 ? (
                siteNav.header
                  .filter((item) => item.visible !== false)
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((item) => {
                    const children = (item.children || [])
                      .filter((c) => c.visible !== false)
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    const hasChildren = children.length > 0;
                    const sectionKey = item.id || item.label.toLowerCase();
                    const isSectionOpen =
                      openSection === sectionKey ||
                      (openSection === 'experiences' && sectionKey.includes('exp'));
                    const ParentIcon =
                      (item.icon ? getNavIcon(item.icon) : null) ||
                      (item.label.toLowerCase().includes('exp')
                        ? Compass
                        : item.label.toLowerCase().includes('stor')
                        ? BookOpen
                        : Sparkles);

                    if (hasChildren) {
                      return (
                        <div key={sectionKey} className="rounded-xl border border-parchment-300 bg-white overflow-hidden shadow-xs">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="w-full p-4 flex items-center justify-between font-editorial-serif text-sm font-bold text-himalaya-950"
                          >
                            <span className="flex items-center space-x-2">
                              <ParentIcon className="w-4 h-4 text-terracotta" />
                              <span>{item.label}</span>
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSectionOpen ? 'rotate-180 text-terracotta' : ''
                              }`}
                            />
                          </button>

                          {isSectionOpen && (
                            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-parchment-200 divide-y divide-parchment-100">
                              {children.map((child, cIdx) => {
                                const ChildIcon = (child.icon ? getNavIcon(child.icon) : null) || Compass;
                                return (
                                  <Link
                                    key={child.id || child.url}
                                    href={child.url}
                                    onClick={onClose}
                                    className={`block group pb-1 ${cIdx === 0 ? 'pt-2 first:pt-1' : 'pt-2.5'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                                        <ChildIcon className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                                        {child.label}
                                      </span>
                                      {child.badge && (
                                        <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                                          {child.badge}
                                        </span>
                                      )}
                                    </div>
                                    {child.description && (
                                      <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                                        {child.description}
                                      </p>
                                    )}
                                  </Link>
                                );
                              })}

                              {/* Overview links for experience section */}
                              {(item.url === '/experience' || item.url === '/experiences') && (
                                <div className="pt-2 flex flex-col space-y-1">
                                  <Link
                                    href="/experiences"
                                    onClick={onClose}
                                    className="text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline py-1 flex items-center justify-between"
                                  >
                                    <span>• View All Experiences Catalog</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                  <Link
                                    href="/experiences/custom-journeys"
                                    onClick={onClose}
                                    className="text-xs font-medium text-himalaya-700 hover:text-terracotta py-1"
                                  >
                                    • Custom Tailor-Made Journeys with Sakar
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.url || sectionKey}
                        href={item.url || '#'}
                        onClick={onClose}
                        className="block p-4 rounded-xl border border-parchment-300 bg-white font-editorial-serif text-sm font-bold uppercase tracking-wider text-himalaya-950 hover:text-terracotta hover:border-terracotta/40 transition-colors flex items-center justify-between shadow-xs"
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="w-4 h-4 text-terracotta" />
                      </Link>
                    );
                  })
              ) : (
                <>
                  {/* Fallback Hardcoded Structure */}
                  {/* 1. EXPERIENCES Group */}
                  <div className="rounded-xl border border-parchment-300 bg-white overflow-hidden shadow-xs">
                    <button
                      onClick={() => toggleSection('experiences')}
                      className="w-full p-4 flex items-center justify-between font-editorial-serif text-sm font-bold uppercase tracking-wider text-himalaya-950"
                    >
                      <span className="flex items-center space-x-2">
                        <Compass className="w-4 h-4 text-terracotta" />
                        <span>EXPERIENCES</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-himalaya-500 transition-transform duration-300 ${
                          openSection === 'experiences' ? 'rotate-180 text-terracotta' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'experiences' && (
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-parchment-200 divide-y divide-parchment-100">
                        <Link
                          href="/experiences/beyond-the-map"
                          onClick={onClose}
                          className="block group pt-2 first:pt-1 pb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                              <Compass className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                              Go Beyond the Map
                            </span>
                            <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                              Exploration
                            </span>
                          </div>
                          <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                            Living courtyards, medieval stone mysteries & master artisan guilds.
                          </p>
                        </Link>

                        <Link
                          href="/experiences/go-within"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                              Go Within
                            </span>
                            <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                              Spiritual
                            </span>
                          </div>
                          <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                            Himalayan singing bowl resonance, monastery chanting & meditation caves.
                          </p>
                        </Link>

                        <Link
                          href="/experiences/go-deeper"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                              <Compass className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                              Go Deeper
                            </span>
                            <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                              Immersion
                            </span>
                          </div>
                          <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                            Living courtyards, sacred geometry & generational artisan traditions.
                          </p>
                        </Link>

                        <Link
                          href="/experiences/leave-a-mark"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                              <Heart className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                              Leave a Mark
                            </span>
                            <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                              Strategic
                            </span>
                          </div>
                          <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                            Strategic volunteer tourism & administrative empowerment.
                          </p>
                        </Link>

                        <Link
                          href="/experiences/homestays"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                              <Home className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                              Feel Closer
                            </span>
                            <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                              Homestays
                            </span>
                          </div>
                          <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                            Traditional village homestays, hearthside cooking & warm family bonds.
                          </p>
                        </Link>

                        <div className="pt-3 flex flex-col space-y-1.5">
                          <Link
                            href="/experiences"
                            onClick={onClose}
                            className="text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline py-1 flex items-center justify-between"
                          >
                            <span>• View All Experiences Catalog</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href="/experiences/custom-journeys"
                            onClick={onClose}
                            className="text-xs font-medium text-himalaya-700 hover:text-terracotta py-1"
                          >
                            • Custom Tailor-Made Journeys with Sakar
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. DESTINATIONS Group */}
                  <div className="rounded-xl border border-parchment-300 bg-white overflow-hidden shadow-xs">
                    <button
                      onClick={() => toggleSection('destinations')}
                      className="w-full p-4 flex items-center justify-between font-editorial-serif text-sm font-bold uppercase tracking-wider text-himalaya-950"
                    >
                      <span className="flex items-center space-x-2">
                        <Mountain className="w-4 h-4 text-terracotta" />
                        <span>DESTINATIONS</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-himalaya-500 transition-transform duration-300 ${
                          openSection === 'destinations' ? 'rotate-180 text-terracotta' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'destinations' && (
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-parchment-200 divide-y divide-parchment-100">
                        <Link
                          href="/destinations/kathmandu-valley"
                          onClick={onClose}
                          className="block group pt-2 first:pt-1 pb-1"
                        >
                          <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                            <Mountain className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                            Kathmandu Valley
                          </span>
                        </Link>
                        <Link
                          href="/destinations/pokhara-annapurna"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                            <Mountain className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                            Pokhara & Annapurna Foothills
                          </span>
                        </Link>
                        <Link
                          href="/destinations/mustang-muktinath"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                            <Mountain className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                            Mustang & Muktinath
                          </span>
                        </Link>
                        <Link
                          href="/destinations/langtang-helambu"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                            <Mountain className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                            Langtang & Helambu
                          </span>
                        </Link>
                        <Link
                          href="/destinations/chitwan-subtropics"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                            <Mountain className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                            Chitwan Lowlands
                          </span>
                        </Link>
                        <div className="pt-2">
                          <Link
                            href="/destinations"
                            onClick={onClose}
                            className="text-xs font-semibold uppercase tracking-wider text-terracotta hover:underline py-1 flex items-center justify-between"
                          >
                            <span>• View All Destinations</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. EVENTS */}
                  <Link
                    href="/events"
                    onClick={onClose}
                    className="block p-4 rounded-xl border border-parchment-300 bg-white font-editorial-serif text-sm font-bold uppercase tracking-wider text-himalaya-950 hover:text-terracotta hover:border-terracotta/40 transition-colors flex items-center justify-between shadow-xs"
                  >
                    <span>EVENTS</span>
                    <ArrowRight className="w-4 h-4 text-terracotta" />
                  </Link>

                  {/* 3. STORIES Group */}
                  <div className="rounded-xl border border-parchment-300 bg-white overflow-hidden shadow-xs">
                    <button
                      onClick={() => toggleSection('stories')}
                      className="w-full p-4 flex items-center justify-between font-editorial-serif text-sm font-bold uppercase tracking-wider text-himalaya-950"
                    >
                      <span className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-terracotta" />
                        <span>STORIES</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          openSection === 'stories' ? 'rotate-180 text-terracotta' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'stories' && (
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-parchment-200 divide-y divide-parchment-100">
                        <Link
                          href="/blog"
                          onClick={onClose}
                          className="block group pt-2 first:pt-1 pb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                              Sakar’s Journal & Blogs
                            </span>
                            <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                              Blogs
                            </span>
                          </div>
                          <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                            Field notes, personal essays, and reflections on slow travel and heritage.
                          </p>
                        </Link>

                        <Link
                          href="/reviews"
                          onClick={onClose}
                          className="block group pt-2.5 pb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-editorial-serif text-xs font-bold text-himalaya-900 group-hover:text-terracotta transition-colors flex items-center">
                              <Star className="w-3.5 h-3.5 mr-1.5 text-terracotta" />
                              Traveler Reviews & Guestbook
                            </span>
                            <span className="text-[9px] font-semibold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
                              Reviews
                            </span>
                          </div>
                          <p className="text-[11px] text-himalaya-600 font-light leading-snug pl-5 mt-0.5">
                            Read guest reflections and flip through Sakar’s handwritten guestbook.
                          </p>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* 4. ABOUT SAKAR */}
                  <Link
                    href="/about"
                    onClick={onClose}
                    className="block p-4 rounded-xl border border-parchment-300 bg-white font-editorial-serif text-sm font-bold uppercase tracking-wider text-himalaya-950 hover:text-terracotta hover:border-terracotta/40 transition-colors flex items-center justify-between shadow-xs"
                  >
                    <span>ABOUT SAKAR</span>
                    <ArrowRight className="w-4 h-4 text-terracotta" />
                  </Link>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-parchment-300 bg-white space-y-3">
              <a
                href={`https://wa.me/${settings.contact?.whatsappNumber || '9779840482692'}?text=${encodeURIComponent(
                  'Namaste Sakar, I would like to consult with you about planning a trip in Nepal.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                <span>Chat on WhatsApp</span>
              </a>

              <Link
                href="/contact"
                onClick={onClose}
                className="w-full flex items-center justify-center py-3.5 rounded-xl bg-himalaya-950 hover:bg-terracotta text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                <span>Plan Your Journey</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
