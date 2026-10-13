import React from 'react';
import Link from 'next/link';
import { Compass, Home, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[#FBF8F2] text-[#2C2A29]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E5DCD0]/60 text-[#8B6B43] mb-2">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#8B6B43]">
            Path Not Found
          </span>
          <h1 className="text-4xl font-serif text-[#1C1B1A]">
            404
          </h1>
          <p className="text-sm text-[#66615C] leading-relaxed">
            The trail you are looking for has shifted or does not exist. Let us guide you back to familiar grounds.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#2C2A29] text-white text-sm font-medium hover:bg-[#1C1B1A] transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
          <Link
            href="/experiences"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#D5C9B8] text-[#2C2A29] text-sm font-medium hover:bg-[#EFE9DF] transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Explore Journeys
          </Link>
        </div>
      </div>
    </div>
  );
}
