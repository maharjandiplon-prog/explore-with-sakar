import React from 'react';

export default function DestinationsLoading() {
  return (
    <div className="min-h-screen bg-parchment-100 pt-28 pb-20">
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta via-saffron to-terracotta-dark z-50 animate-pulse motion-reduce:animate-none"
        role="progressbar"
        aria-label="Loading destinations"
      />

      <div className="editorial-container">
        {/* Header */}
        <div className="max-w-2xl mb-12 space-y-4 animate-pulse motion-reduce:animate-none">
          <div className="h-4 w-28 bg-parchment-300/60 rounded-full" />
          <div className="h-10 sm:h-12 w-3/4 bg-parchment-300 rounded-xl" />
          <div className="h-4 w-full bg-parchment-200 rounded-md" />
        </div>

        {/* Destination Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-parchment-300/80 rounded-3xl overflow-hidden animate-pulse motion-reduce:animate-none shadow-subtle flex flex-col"
            >
              <div className="aspect-[16/10] bg-parchment-200/80 w-full" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-24 bg-parchment-200 rounded-full" />
                <div className="h-6 w-3/4 bg-parchment-300 rounded-lg" />
                <div className="h-4 w-full bg-parchment-200/70 rounded-md" />
                <div className="h-4 w-2/3 bg-parchment-200/70 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
