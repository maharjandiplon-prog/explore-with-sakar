import React from 'react';

export default function BlogListLoading() {
  return (
    <div className="min-h-screen bg-parchment-100 pt-28 pb-20">
      {/* Route Loading Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta via-saffron to-terracotta-dark z-50 animate-pulse motion-reduce:animate-none"
        role="progressbar"
        aria-label="Loading journal articles"
      />

      <div className="editorial-container">
        {/* Header Skeleton */}
        <div className="max-w-2xl mb-12 space-y-4 animate-pulse motion-reduce:animate-none">
          <div className="h-4 w-28 bg-parchment-300/60 rounded-full" />
          <div className="h-10 sm:h-12 w-3/4 bg-parchment-300 rounded-xl" />
          <div className="h-4 w-full bg-parchment-200 rounded-md" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-2 animate-pulse motion-reduce:animate-none">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 bg-parchment-200/80 rounded-full shrink-0" />
          ))}
        </div>

        {/* Featured Post Card Skeleton */}
        <div className="bg-white border border-parchment-300/80 rounded-3xl p-6 sm:p-8 mb-12 animate-pulse motion-reduce:animate-none shadow-subtle grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="aspect-[16/10] bg-parchment-200/80 rounded-2xl w-full" />
          <div className="space-y-4">
            <div className="h-4 w-24 bg-terracotta/20 rounded-full" />
            <div className="h-8 w-4/5 bg-parchment-300 rounded-xl" />
            <div className="h-4 w-full bg-parchment-200 rounded-md" />
            <div className="h-4 w-2/3 bg-parchment-200 rounded-md" />
            <div className="h-4 w-32 bg-parchment-200/60 rounded-md pt-4" />
          </div>
        </div>

        {/* Post Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-parchment-300/80 rounded-3xl p-6 space-y-4 animate-pulse motion-reduce:animate-none shadow-subtle"
            >
              <div className="aspect-[16/10] bg-parchment-200/70 rounded-2xl" />
              <div className="h-4 w-20 bg-parchment-200 rounded-full" />
              <div className="h-6 w-3/4 bg-parchment-300 rounded-lg" />
              <div className="h-4 w-full bg-parchment-200/70 rounded-md" />
              <div className="h-4 w-1/2 bg-parchment-200/60 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
