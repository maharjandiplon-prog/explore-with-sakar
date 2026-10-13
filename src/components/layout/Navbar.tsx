'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Menu,
  X,
  Compass,
  Heart,
  Sparkles,
  MapPin,
  BookOpen,
  Calendar,
  Phone,
  ArrowRight,
  Mountain,
  Home,
  ShieldCheck,
  Camera,
  Layers,
  HelpCircle,
  FileText,
  Star,
} from 'lucide-react';
import MobileNav from './MobileNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, useSiteNavigation } from '@/context/SettingsContext';
import { getNavIcon } from '@/lib/navIcons';

export interface NavChildItem {
  title: string;
  description?: string;
  href: string;
  badge?: string;
  icon?: any;
}

export interface NavItem {
  label: string;
  href?: string;
  subtitle?: string;
  columns?: number;
  children?: NavChildItem[];
}

export const MAIN_NAV_STRUCTURE: NavItem[] = [
  {
    label: 'EXPERIENCES',
    href: '/experiences',
    subtitle: 'Our Curated Travel Experiences',
    columns: 2,
    children: [
      {
        title: 'Beyond the Map',
        description: 'Living courtyards, medieval stone mysteries & master artisan guilds.',
        href: '/experiences/beyond-the-map',
        badge: 'Exploration',
        icon: Compass,
      },
      {
        title: 'Go Within',
        description: 'Himalayan singing bowl resonance, monastery chanting & meditation caves.',
        href: '/experiences/go-within',
        badge: 'Spiritual',
        icon: Sparkles,
      },
      {
        title: 'Go Deeper',
        description: 'Immersive deep-dive journeys into hidden layers, living courtyards & sacred geometry.',
        href: '/experiences/go-deeper',
        badge: 'Immersion',
        icon: Layers,
      },
      {
        title: 'Leave a Mark',
        description: 'Strategic volunteer tourism & administrative empowerment for grassroots communities.',
        href: '/experiences/leave-a-mark',
        badge: 'Strategic',
        icon: Heart,
      },
      {
        title: 'Feel Closer',
        description: 'Traditional village homestays, hearthside cooking & warm family bonds.',
        href: '/experiences/homestays',
        badge: 'Homestays',
        icon: Home,
      },
      {
        title: 'Custom Private Journeys',
        description: '100% tailor-made itineraries for solo travelers, couples & families with Sakar.',
        href: '/experiences/custom-journeys',
        badge: 'Bespoke',
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: 'DESTINATIONS',
    href: '/destinations',
    subtitle: 'Sacred Lands & Regions of Nepal',
    columns: 1,
    children: [
      {
        title: 'Kathmandu Valley',
        description: 'Living museum of sacred shrines & medieval Newar bahals.',
        href: '/destinations/kathmandu-valley',
        icon: Mountain,
      },
      {
        title: 'Pokhara & Annapurna Foothills',
        description: 'Tranquil lakeside reflections & Gurung mountain hamlets.',
        href: '/destinations/pokhara-annapurna',
        icon: Mountain,
      },
      {
        title: 'Mustang & Muktinath',
        description: 'Sacred rainshadow canyons & eternal pilgrimage springs.',
        href: '/destinations/mustang-muktinath',
        icon: Mountain,
      },
      {
        title: 'Langtang & Helambu',
        description: 'Glacial valleys, sacred Tamang gompas & rhododendron forests.',
        href: '/destinations/langtang-helambu',
        icon: Mountain,
      },
      {
        title: 'Chitwan Lowlands',
        description: 'Subtropical jungles & indigenous Tharu conservationists.',
        href: '/destinations/chitwan-subtropics',
        icon: Mountain,
      },
      {
        title: 'All Curated Destinations →',
        description: 'Browse the complete regional directory of Nepal.',
        href: '/destinations',
        icon: Compass,
      },
    ],
  },
  {
    label: 'EVENTS',
    href: '/events',
  },
  {
    label: 'STORIES',
    subtitle: 'Perspectives & Reflections',
    columns: 1,
    children: [
      {
        title: 'Sakar’s Journal & Blogs',
        description: 'Field notes, personal essays, and reflections on slow travel and heritage.',
        href: '/blog',
        badge: 'Essays',
        icon: BookOpen,
      },
      {
        title: 'Traveler Reviews & Guestbook',
        description: 'Read guest reflections and flip through Sakar’s handwritten guestbook.',
        href: '/reviews',
        badge: 'Reviews',
        icon: Star,
      },
    ],
  },
  {
    label: 'ABOUT SAKAR',
    href: '/about',
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const siteNav = useSiteNavigation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = useMemo(() => {
    if (!siteNav?.header || siteNav.header.length === 0) {
      return MAIN_NAV_STRUCTURE;
    }
    return siteNav.header
      .filter((item) => item.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item) => {
        const children =
          item.children && item.children.length > 0
            ? item.children
                .filter((c) => c.visible !== false)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((c) => ({
                  title: c.label,
                  description: c.description,
                  href: c.url,
                  badge: c.badge,
                  icon: (c.icon ? getNavIcon(c.icon) : null) || Compass,
                }))
            : undefined;

        return {
          label: item.label,
          href: item.url,
          subtitle: item.subtitle,
          columns: item.columns || (children && children.length > 3 ? 2 : 1),
          children,
        };
      });
  }, [siteNav]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isRouteActive = (item: NavItem) => {
    if (item.href) {
      if (item.href === '/' && pathname === '/') return true;
      if (item.href !== '/' && pathname.startsWith(item.href)) return true;
    }
    if (item.children) {
      return item.children.some((child) => pathname.startsWith(child.href));
    }
    return false;
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'glass-nav py-3.5 shadow-subtle'
            : 'bg-parchment-100/95 backdrop-blur-md py-4 sm:py-5 border-b border-parchment-300/80'
        }`}
      >
        <div className="editorial-container flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <Image
              src={settings.branding?.logoUrl?.trim() || '/explore-with-sakar/images/logo.png'}
              alt={settings.branding?.siteName || 'Explore With Sakar'}
              width={160}
              height={44}
              priority
              className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navItems.map((item) => {
              const active = isRouteActive(item);
              const hasDropdown = Boolean(item.children && item.children.length > 0);

              if (!hasDropdown && item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
                      active
                        ? 'text-terracotta bg-terracotta/10'
                        : 'text-himalaya-800 hover:text-terracotta hover:bg-parchment-200/60'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    onClick={() =>
                      setActiveDropdown(activeDropdown === item.label ? null : item.label)
                    }
                    className={`inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
                      active || activeDropdown === item.label
                        ? 'text-terracotta bg-terracotta/10'
                        : 'text-himalaya-800 hover:text-terracotta hover:bg-parchment-200/60'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                        activeDropdown === item.label ? 'rotate-180 text-terracotta' : ''
                      }`}
                    />
                  </button>

                  {/* Mega Dropdown Menu */}
                  <AnimatePresence>
                    {activeDropdown === item.label && item.children && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className={`absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-floating border border-parchment-300 p-4 sm:p-5 z-50 ${
                          item.columns === 2 ? 'w-[520px]' : 'w-[320px]'
                        }`}
                      >
                        <div
                          className={`grid gap-2 ${
                            item.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
                          }`}
                        >
                          {item.children.map((child) => {
                            const IconComponent = child.icon || Compass;
                            const isChildActive = pathname === child.href;

                            return (
                              <Link
                                key={child.title}
                                href={child.href}
                                className={`group/child p-3 rounded-xl transition-all duration-200 flex items-start space-x-3 ${
                                  isChildActive
                                    ? 'bg-parchment-100 text-terracotta border border-terracotta/20'
                                    : 'hover:bg-sand/60 text-himalaya-900'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-parchment-200/80 group-hover/child:bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                                  <IconComponent className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-1.5 mb-0.5">
                                    <span className="font-editorial-serif text-xs font-bold leading-tight group-hover/child:text-terracotta transition-colors">
                                      {child.title}
                                    </span>
                                    {child.badge && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-terracotta/10 text-terracotta">
                                        {child.badge}
                                      </span>
                                    )}
                                  </div>
                                  {child.description && (
                                    <p className="text-[11px] text-himalaya-600 font-light leading-snug line-clamp-2">
                                      {child.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <a
              href={`https://wa.me/${settings.contact?.whatsappNumber || '9779840482692'}?text=${encodeURIComponent(
                'Namaste Sakar, I am exploring your website and would like to ask a question.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Chat with Sakar on WhatsApp"
            >
              <Phone className="w-4 h-4" />
            </a>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-himalaya-950 hover:bg-terracotta text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-subtle hover:shadow-warm"
            >
              <span>Plan Your Journey</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <a
              href={`https://wa.me/${settings.contact?.whatsappNumber || '9779840482692'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
              title="WhatsApp"
            >
              <Phone className="w-5 h-5" />
            </a>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl bg-parchment-200 text-himalaya-900 hover:text-terracotta focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
