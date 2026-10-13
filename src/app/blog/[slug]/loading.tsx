import React from 'react';

export default function BlogPostLoading() {
  return (
    <article className="min-h-screen bg-parchment-100 pt-28 pb-20">
      {/* Route Loading Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta via-saffron to-terracotta-dark z-50 animate-pulse motion-reduce:animate-none"
        role="progressbar"
        aria-label="Loading article"
      />

      <div className="editorial-container max-w-4xl">
        {/* Breadcrumb / Category Skeleton */}
        <div className="flex items-center gap-3 mb-6 animate-pulse motion-reduce:animate-none">
          <div className="h-4 w-20 bg-parchment-200 rounded-full" />
          <div className="h-4 w-4 bg-parchment-200 rounded-full" />
          <div className="h-4 w-28 bg-parchment-300 rounded-full" />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-4 mb-8 animate-pulse motion-reduce:animate-none">
          <div className="h-10 sm:h-14 w-11/12 bg-parchment-300 rounded-2xl" />
          <div className="h-10 sm:h-14 w-2/3 bg-parchment-300 rounded-2xl" />
          <div className="h-5 w-48 bg-parchment-200 rounded-md pt-2" />
        </div>

        {/* Hero Cover Image Skeleton */}
        <div className="aspect-[16/9] w-full bg-parchment-200/80 rounded-3xl mb-12 animate-pulse motion-reduce:animate-none" />

        {/* Body Text Skeleton */}
        <div className="space-y-6 animate-pulse motion-reduce:animate-none max-w-3xl">
          <div className="h-4 w-full bg-parchment-300/60 rounded" />
          <div className="h-4 w-full bg-parchment-300/60 rounded" />
          <div className="h-4 w-4/5 bg-parchment-300/60 rounded" />
          <div className="h-8 w-1/2 bg-parchment-300 rounded-lg pt-4" />
          <div className="h-4 w-full bg-parchment-300/60 rounded" />
          <div className="h-4 w-full bg-parchment-300/60 rounded" />
          <div className="h-4 w-3/4 bg-parchment-300/60 rounded" />
        </div>
      </div>
    </article>
  );
}
