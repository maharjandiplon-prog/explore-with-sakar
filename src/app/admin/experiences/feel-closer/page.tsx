'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Edit3, List, ExternalLink, ArrowLeft, ChevronRight, Info, BookOpen, Compass } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

export default function FeelCloserHubPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Feel Closer"
        subtitle="Manage everything for the 'Feel Closer' homestays experience pillar."
      />
      <div className="px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-800 font-medium">Feel Closer</span>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h2 className="font-editorial-serif text-xl font-bold text-slate-900">Feel Closer — Homestays</h2>
              <p className="text-sm text-slate-700 font-normal mt-1 leading-relaxed">
                Traditional village homestays, hearthside cooking & warm family bonds. Manage this pillar&apos;s itineraries and content only.
              </p>
              <div className="mt-3">
                <Link href="/experiences/homestays" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border text-slate-800 bg-slate-100 border-slate-300 hover:bg-slate-200 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-terracotta" />View Public Page
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
          <p><strong className="text-slate-700">This experience is completely separate.</strong> Content you manage here only affects Feel Closer and will never mix with other pillars.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/services" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                <Edit3 className="w-5 h-5 text-slate-600 group-hover:text-emerald-700 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Edit Experience</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5 leading-relaxed">Edit the main Feel Closer experience description, card image, and display text.</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/experiences?pillar=feel-closer" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                <List className="w-5 h-5 text-slate-600 group-hover:text-emerald-700 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Itineraries</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5 leading-relaxed">Add, edit, and manage itinerary packages for Feel Closer homestay journeys only.</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/blogs?category=Homestays" className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                <BookOpen className="w-5 h-5 text-slate-600 group-hover:text-emerald-700 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Related Stories</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5 leading-relaxed">Manage blog stories connected to the homestays experience.</p>
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
