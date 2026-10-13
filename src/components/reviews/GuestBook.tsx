'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, BookOpen, Layers } from 'lucide-react';
import { HandwrittenReviewPage } from '@/types/cms';

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false });

interface PageProps {
  imageUrl: string;
  guestName: string;
  country?: string;
  date?: string;
  number: number;
  index: number;
}

const Page = forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  return (
    <div
      className="page bg-parchment-50 flex flex-col items-center justify-between overflow-hidden border-x border-parchment-300 relative h-full w-full cursor-pointer select-none"
      ref={ref}
    >
      <div className="absolute inset-0 p-2 sm:p-4 lg:p-6 pb-8 flex flex-col">
        {/* Guest Name in BOLD before review */}
        <div className="w-full bg-parchment-100/95 border border-parchment-300 rounded-t-md px-3 py-2 flex items-center justify-between shrink-0 shadow-sm z-10 mb-1.5">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-terracotta shrink-0"></span>
            <span className="font-bold text-himalaya-950 font-editorial-serif text-xs sm:text-sm tracking-wide truncate">
              {props.guestName}
            </span>
          </div>
          {props.country && (
            <span className="text-[10px] sm:text-xs font-semibold text-terracotta uppercase tracking-wider shrink-0 ml-2">
              {props.country}
            </span>
          )}
        </div>

        {/* Scanned Handwritten Review Image */}
        <div className="relative w-full flex-1 rounded-b-md overflow-hidden shadow-subtle border border-parchment-200 bg-white flex items-center justify-center">
          <img
            src={props.imageUrl}
            alt={`${props.guestName} - Handwritten Review Page ${props.number}`}
            className="w-full h-full object-contain object-center mix-blend-multiply opacity-95 transition-transform"
          />
        </div>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] sm:text-xs text-himalaya-500 font-display-serif">
        — Page {props.number} —
      </div>
    </div>
  );
});

Page.displayName = 'Page';

const CoverPage = forwardRef<HTMLDivElement, { children: React.ReactNode; isBack?: boolean; onClick?: () => void }>(
  ({ children, isBack, onClick }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      className={`page page-cover ${
        isBack ? 'page-cover-bottom' : 'page-cover-top'
      } bg-himalaya-950 border border-himalaya-900 shadow-inner flex flex-col items-center justify-center relative overflow-hidden cursor-pointer h-full w-full`}
      data-density="hard"
    >
      {children}
    </div>
  )
);
CoverPage.displayName = 'CoverPage';

const DEFAULT_HANDWRITTEN_PAGES: HandwrittenReviewPage[] = Array.from({ length: 20 }, (_, i) => ({
  id: `hw-${i + 1}`,
  guestName:
    i === 0
      ? 'Elena & Marcus Weber'
      : i === 1
      ? 'Dr. Alistair Campbell'
      : i === 2
      ? 'Sarah Lin & David Chen'
      : `Guest Reviewer #${i + 1}`,
  country:
    i === 0
      ? 'Switzerland'
      : i === 1
      ? 'United Kingdom'
      : i === 2
      ? 'Canada'
      : 'International Traveler',
  date: 'Himalayan Journal Entry',
  image: `/images/reviews/review-${i + 1}.jpg`,
  pageNumber: i + 1,
  isVisible: true,
  order: i + 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

interface GuestBookProps {
  initialPages?: HandwrittenReviewPage[];
}

export default function GuestBook({ initialPages }: GuestBookProps) {
  const bookRef = React.useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 450, height: 650 });
  const [isMobile, setIsMobile] = useState(false);
  const [pages, setPages] = useState<HandwrittenReviewPage[]>(
    initialPages && initialPages.length > 0 ? initialPages : DEFAULT_HANDWRITTEN_PAGES
  );

  useEffect(() => {
    if (initialPages && initialPages.length > 0) {
      setPages(initialPages);
    }
  }, [initialPages]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      if (width < 640) {
        setDimensions({ width: 320, height: 480 });
      } else if (width < 1024) {
        setDimensions({ width: 420, height: 620 });
      } else {
        setDimensions({ width: 480, height: 680 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visiblePages = pages.filter((p) => p.isVisible !== false);
  const totalPages = visiblePages.length + 2; // cover + pages + back cover

  const handleNext = () => {
    try {
      if (isMobile) {
        setCurrentPage((prev) => Math.min(prev + 1, visiblePages.length - 1));
      } else {
        bookRef.current?.pageFlip()?.flipNext();
      }
    } catch (e) {
      console.warn('Page flip next error', e);
    }
  };

  const handlePrev = () => {
    try {
      if (isMobile) {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
      } else {
        bookRef.current?.pageFlip()?.flipPrev();
      }
    } catch (e) {
      console.warn('Page flip prev error', e);
    }
  };

  // Enable keyboard left/right arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, visiblePages.length]);

  return (
    <div className="flex flex-col justify-center items-center w-full py-6 sm:py-8 relative z-10">
      {/* Flip Instruction Hint */}
      <div className="flex items-center gap-2 text-xs text-himalaya-600 bg-sand/80 px-4 py-1.5 rounded-full border border-parchment-300 mb-6 shadow-subtle">
        <BookOpen className="w-3.5 h-3.5 text-terracotta" />
        <span>
          {isMobile
            ? `Viewing note ${currentPage + 1} of ${visiblePages.length} handwritten pages`
            : `Click page corners or use controls to flip through ${visiblePages.length} handwritten pages`}
        </span>
      </div>

      {/* Mobile Card Carousel View (100% touch-responsive without canvas lock) */}
      {isMobile ? (
        <div className="w-full max-w-sm mx-auto px-4">
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-floating border border-parchment-300 bg-white">
            {visiblePages[currentPage] && (
              <div className="h-full w-full flex flex-col p-3">
                <div className="w-full bg-parchment-100/95 border border-parchment-300 rounded-t-md px-3 py-2 flex items-center justify-between shrink-0 mb-2">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-terracotta shrink-0"></span>
                    <span className="font-bold text-himalaya-950 font-editorial-serif text-sm truncate">
                      {visiblePages[currentPage].guestName}
                    </span>
                  </div>
                  {visiblePages[currentPage].country && (
                    <span className="text-[10px] font-semibold text-terracotta uppercase tracking-wider shrink-0 ml-1">
                      {visiblePages[currentPage].country}
                    </span>
                  )}
                </div>

                <div className="relative flex-1 rounded-b-md overflow-hidden border border-parchment-200 bg-white flex items-center justify-center">
                  <img
                    src={visiblePages[currentPage].image}
                    alt={visiblePages[currentPage].guestName}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                <div className="pt-2 text-center text-[11px] text-himalaya-500 font-display-serif">
                  — Handwritten Entry #{currentPage + 1} of {visiblePages.length} —
                </div>
              </div>
            )}
          </div>

          {/* Mobile direct navigation */}
          <div className="flex items-center justify-between gap-3 mt-5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-parchment-100 disabled:opacity-40 text-himalaya-900 border border-parchment-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Note</span>
            </button>
            <span className="text-xs font-semibold text-himalaya-700 bg-sand px-3 py-2 rounded-xl border border-parchment-300 shrink-0">
              {currentPage + 1} / {visiblePages.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= visiblePages.length - 1}
              className="flex-1 py-3 px-4 rounded-xl bg-himalaya-950 hover:bg-terracotta disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 shadow-sm"
            >
              <span>Next Note</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Desktop FlipBook View */
        <div className="relative flex items-center justify-center w-full max-w-5xl mx-auto">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous Page"
            className="hidden md:flex absolute left-2 lg:-left-6 z-20 w-12 h-12 rounded-full bg-white/95 border border-parchment-300 text-himalaya-800 shadow-floating items-center justify-center hover:bg-terracotta hover:text-white hover:border-terracotta transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* @ts-ignore */}
          <HTMLFlipBook
            key={`flipbook-${visiblePages.length}-${dimensions.width}`}
            ref={bookRef}
            width={dimensions.width}
            height={dimensions.height}
            size="stretch"
            minWidth={300}
            maxWidth={600}
            minHeight={450}
            maxHeight={850}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            className="guestbook-flip shadow-2xl mx-auto"
            style={{ margin: '0 auto' }}
            onFlip={(e: any) => setCurrentPage(e.data)}
          >
            {/* Cover Page */}
            <CoverPage onClick={handleNext}>
              <div className="absolute inset-0 bg-himalaya-900/50 mix-blend-overlay"></div>
              <div className="relative z-10 flex flex-col items-center border-2 border-saffron-dark/40 p-8 sm:p-12 m-4 rounded-sm bg-himalaya-950/80 backdrop-blur-sm shadow-xl w-3/4">
                <span className="text-terracotta text-xs sm:text-sm uppercase tracking-widest font-bold mb-4 text-center">
                  Travelers&apos; Words
                </span>
                <h2 className="text-parchment-100 font-editorial-serif text-2xl sm:text-4xl text-center leading-tight">
                  Sakar&apos;s <br />Guest <br />Journal
                </h2>
                <div className="mt-8 w-12 h-[1px] bg-terracotta/50"></div>
                <span className="text-[10px] text-parchment-300 uppercase tracking-widest mt-4">
                  Click to Open
                </span>
              </div>
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/60 to-transparent border-r border-black/20"></div>
            </CoverPage>

            {/* Inner Pages */}
            {visiblePages.map((page, index) => (
              <Page
                key={page.id || `hw-${index}`}
                guestName={page.guestName}
                country={page.country}
                date={page.date}
                imageUrl={page.image}
                number={index + 1}
                index={index}
              />
            ))}

            {/* Back Cover */}
            <CoverPage isBack>
              <div className="absolute inset-0 bg-himalaya-900/50 mix-blend-overlay"></div>
              <div className="relative z-10 text-saffron-dark font-editorial-serif text-xl opacity-50 text-center px-4">
                <p className="mb-2">Explore With Sakar</p>
                <p className="text-xs font-sans uppercase tracking-widest text-parchment-500/30">
                  Responsible Tour Director
                </p>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/60 to-transparent border-l border-black/20"></div>
            </CoverPage>
          </HTMLFlipBook>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next Page"
            className="hidden md:flex absolute right-2 lg:-right-6 z-20 w-12 h-12 rounded-full bg-white/95 border border-parchment-300 text-himalaya-800 shadow-floating items-center justify-center hover:bg-terracotta hover:text-white hover:border-terracotta transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Bottom Controls for Desktop */}
      {!isMobile && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={handlePrev}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-himalaya-950 text-himalaya-900 hover:text-white border border-parchment-300 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-subtle flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-semibold text-himalaya-700 bg-sand px-4 py-2 rounded-full border border-parchment-300">
            Page {Math.min(currentPage + 1, totalPages)} of {totalPages}
          </span>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-full bg-himalaya-950 hover:bg-terracotta text-white border border-transparent font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-subtle flex items-center gap-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

