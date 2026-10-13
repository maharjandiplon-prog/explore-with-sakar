'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Edit3, List, ExternalLink, ArrowLeft, ChevronRight, Info, Compass } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

export default function CustomJourneysHubPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Custom Journeys"
        subtitle="Manage everything for the 'Custom Private Journeys' experience pillar."
      />
      <div className="px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-800 font-medium">Custom Journeys</span>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h2 className="font-editorial-serif text-xl font-bold text-slate-900">Custom Private Journeys</h2>
              <p className="text-sm text-slate-700 font-normal mt-1 leading-relaxed">
                100% tailor-made itineraries for solo travelers, couples & families with Sakar. Manage this pillar&apos;s packages and offerings only.
              </p>
              <div className="mt-3">
                <Link href="/experiences/custom-journeys" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border text-slate-800 bg-slate-100 border-slate-300 hover:bg-slate-200 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-terracotta" />View Public Page
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
          <p><strong className="text-slate-800">This experience is completely separate.</strong> Content you manage here only affects Custom Journeys and will never mix with other pillars.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/services" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-terracotta hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-terracotta/10 flex items-center justify-center shrink-0 transition-colors">
                <Edit3 className="w-5 h-5 text-slate-700 group-hover:text-terracotta transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Edit Experience</h3>
                <p className="text-xs text-slate-700 font-normal mt-0.5 leading-relaxed">Edit the main Custom Journeys experience description, card image, and display text.</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/experiences?pillar=custom-journeys" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-terracotta hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-terracotta/10 flex items-center justify-center shrink-0 transition-colors">
                <List className="w-5 h-5 text-slate-700 group-hover:text-terracotta transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Itineraries & Packages</h3>
                <p className="text-xs text-slate-700 font-normal mt-0.5 leading-relaxed">Add, edit, and manage custom journey packages and bespoke itineraries only.</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/inquiries" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-terracotta hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-terracotta/10 flex items-center justify-center shrink-0 transition-colors">
                <Star className="w-5 h-5 text-slate-700 group-hover:text-terracotta transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Custom Inquiry Leads</h3>
                <p className="text-xs text-slate-700 font-normal mt-0.5 leading-relaxed">View traveler inquiries from the Custom Journeys contact form.</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/experiences" className="group rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 hover:border-slate-300 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-600 text-sm">All Itineraries (Global)</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5 leading-relaxed">View all experiences across all pillars in one list.</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="pt-2">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
