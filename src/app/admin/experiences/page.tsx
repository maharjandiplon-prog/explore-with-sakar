'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Compass,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  X,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import ImageUploader from '@/components/admin/ImageUploader';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import ToastContainer, { ToastMessage } from '@/components/admin/Toast';
import { ExtendedExperience, ItineraryDay } from '@/types/cms';

const CATEGORY_OPTIONS = [
  { value: 'beyond-the-map', label: 'Go Beyond the Map' },
  { value: 'go-within', label: 'Go Within' },
  { value: 'go-deeper', label: 'Go Deeper' },
  { value: 'homestays', label: 'Feel Closer' },
  { value: 'leave-a-mark', label: 'Leave a Mark' },
  { value: 'all-curated', label: 'All Curated Experiences' },
  { value: 'custom-journeys', label: 'Custom Private Journeys' },
];

function getPillarLabel(category?: string, categoryLabel?: string): string {
  if (
    categoryLabel &&
    [
      'Go Beyond the Map',
      'Go Within',
      'Go Deeper',
      'Feel Closer',
      'Leave a Mark',
      'All Curated Experiences',
      'Custom Private Journeys',
    ].includes(categoryLabel)
  ) {
    return categoryLabel;
  }
  if (!category) return 'Go Beyond the Map';
  if (category === 'go-beyond' || category === 'beyond-the-map' || category === 'heritage') return 'Go Beyond the Map';
  if (category === 'go-within' || category === 'go-spiritual' || category === 'spiritual-wellness' || category === 'spiritual') return 'Go Within';
  if (category === 'go-deeper') return 'Go Deeper';
  if (category === 'feel-closer' || category === 'homestays' || category === 'homestay') return 'Feel Closer';
  if (category === 'leave-a-mark' || category === 'responsible') return 'Leave a Mark';
  if (category === 'all-curated' || category === 'adventure') return 'All Curated Experiences';
  if (category === 'custom-journeys') return 'Custom Private Journeys';
  return categoryLabel || category;
}

function AdminExperiencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPillar = searchParams.get('pillar') || 'all';
  const [experiences, setExperiences] = useState<ExtendedExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string>(urlPillar);

  // Sync pillar filter when URL param changes
  useEffect(() => {
    setSelectedPillar(searchParams.get('pillar') || 'all');
  }, [searchParams]);

  // Edit / New Modal
  const [editingExp, setEditingExp] = useState<Partial<ExtendedExperience> | null>(null);
  const [isNewExp, setIsNewExp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper string states
  const [highlightsText, setHighlightsText] = useState('');
  const [inclusionsText, setInclusionsText] = useState('');
  const [fullDescText, setFullDescText] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ExtendedExperience | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchExperiences = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/experiences');
      if (res.ok) {
        const data = await res.json();
        setExperiences(data.experiences || []);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch itineraries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleOpenNew = () => {
    setIsNewExp(true);
    setHighlightsText('');
    setInclusionsText('');
    setFullDescText('');
    setEditingExp({
      title: '',
      slug: '',
      category: 'beyond-the-map',
      categoryLabel: 'Go Beyond the Map',
      duration: '7 Days / 6 Nights',
      difficulty: 'Moderate',
      location: 'Kathmandu Valley, Nepal',
      groupSize: '1–8 guests (Private)',
      season: 'Year-round (Best: Oct–May)',
      heroImage: {
        src: '/explore-with-sakar/images/culture/bhaktapur-pottery.jpg',
        alt: 'Experience Hero',
      },
      gallery: [],
      shortDescription: '',
      fullDescription: [],
      highlights: [],
      inclusions: [
        'Personal tour directing & hosting by Sakar',
        'Private vehicle logistics & transfers',
        'Handpicked heritage lodgings & homestays',
        'All official permits and monument entries',
      ],
      days: [
        {
          dayNumber: 1,
          title: 'Arrival & Welcome Dinner',
          description: 'Sakar meets you at Tribhuvan International Airport followed by an introductory traditional Nepali meal.',
        },
        {
          dayNumber: 2,
          title: 'Morning Monastery Meditation & Heritage Exploration',
          description: 'Experience dawn chanting with senior monks and explore ancient courtyard crafts.',
        },
      ],
      sakarNote: 'Every step of this journey is crafted to connect you directly with living artisans, masters, and village elders without rushing.',
      impactFootprint: '100% of accommodation and guide fees support local family-run homestays and community trusts.',
      featured: true,
      status: 'published',
    });
    setInclusionsText(
      [
        'Personal tour directing & hosting by Sakar',
        'Private vehicle logistics & transfers',
        'Handpicked heritage lodgings & homestays',
        'All official permits and monument entries',
      ].join('\n')
    );
  };

  const filteredExperiences = useMemo(() => {
    if (selectedPillar === 'all') return experiences;
    const selectedOption = CATEGORY_OPTIONS.find((c) => c.value === selectedPillar);
    return experiences.filter((exp) => {
      const label = getPillarLabel(exp.category, exp.categoryLabel);
      return exp.category === selectedPillar || label === selectedOption?.label;
    });
  }, [experiences, selectedPillar]);

  const handleOpenEdit = (exp: ExtendedExperience) => {
    setIsNewExp(false);
    setEditingExp({ ...exp });
    setHighlightsText((exp.highlights || []).join('\n'));
    setInclusionsText((exp.inclusions || []).join('\n'));
    setFullDescText((exp.fullDescription || []).join('\n\n'));
  };

  const handleAddDay = () => {
    if (!editingExp) return;
    const currentDays = editingExp.days || [];
    const nextDayNum = currentDays.length + 1;
    setEditingExp({
      ...editingExp,
      days: [
        ...currentDays,
        {
          dayNumber: nextDayNum,
          title: `Day ${nextDayNum}: Exploring the Valley`,
          description: 'Journey deeper into remote villages and enjoy slow tea conversations.',
        },
      ],
    });
  };

  const handleRemoveDay = (index: number) => {
    if (!editingExp) return;
    const updated = (editingExp.days || [])
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }));
    setEditingExp({ ...editingExp, days: updated });
  };

  const handleUpdateDay = (index: number, field: keyof ItineraryDay, value: string) => {
    if (!editingExp) return;
    const updated = [...(editingExp.days || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditingExp({ ...editingExp, days: updated });
  };

  const handleSave = async () => {
    if (!editingExp?.title || !editingExp?.slug) {
      showToast('error', 'Experience Title and Slug are required');
      return;
    }

    setIsSaving(true);

    try {
      const selectedCat = CATEGORY_OPTIONS.find((c) => c.value === editingExp.category);
      const payload: Partial<ExtendedExperience> = {
        ...editingExp,
        category: editingExp.category || 'beyond-the-map',
        categoryLabel: selectedCat ? selectedCat.label : 'Go Beyond the Map',
        fullDescription: fullDescText
          .split('\n\n')
          .map((s) => s.trim())
          .filter(Boolean),
        highlights: highlightsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        inclusions: inclusionsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const url = isNewExp ? '/api/admin/experiences' : `/api/admin/experiences/${editingExp.id}`;
      const method = isNewExp ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save experience');
      }

      showToast('success', isNewExp ? 'New itinerary created successfully!' : 'Itinerary updated!');
      setEditingExp(null);
      router.refresh();
      fetchExperiences();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save experience');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/experiences/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete experience');
      }

      showToast('success', 'Experience deleted successfully');
      setDeleteTarget(null);
      router.refresh();
      fetchExperiences();
    } catch (err: any) {
      showToast('error', err?.message || 'Error deleting experience');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (exp: ExtendedExperience) => {
    const newStatus = exp.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/experiences/${exp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to toggle status');
      }

      showToast(
        'success',
        newStatus === 'published'
          ? `"${exp.title}" is now published on the public site`
          : `"${exp.title}" moved to drafts`
      );
      fetchExperiences();
    } catch (err: any) {
      showToast('error', err?.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="All Itineraries & Experiences"
        subtitle="Manage day-by-day itineraries for all experience pillars. Use the pillar filter or navigate via the Experiences menu."
        actionButton={{
          label: 'New Experience',
          onClick: handleOpenNew,
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Info Banner */}
        <div className="bg-himalaya-900/80 border border-himalaya-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/20 text-terracotta flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-editorial-serif text-base font-bold text-white">
                Experience Package Builder & Featured Ordering
              </h3>
              <p className="text-xs text-parchment-400 font-light mt-0.5">
                Manage independent experiences, SEO, and top-3 priority for <code>/experiences/[slug]</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-light text-white text-xs font-semibold shadow-warm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Experience Package</span>
            </button>
          </div>
        </div>

        {/* Pillar Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedPillar('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedPillar === 'all'
                ? 'bg-terracotta text-white shadow-warm'
                : 'bg-himalaya-900/80 text-parchment-300 hover:bg-himalaya-800 border border-himalaya-800'
            }`}
          >
            <span>All Experiences</span>
            <span className="text-[10px] opacity-75 font-mono">({experiences.length})</span>
          </button>

          {CATEGORY_OPTIONS.map((cat) => {
            const count = experiences.filter((e) => {
              const label = getPillarLabel(e.category, e.categoryLabel);
              return e.category === cat.value || label === cat.label;
            }).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedPillar(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedPillar === cat.value
                    ? 'bg-terracotta text-white shadow-warm'
                    : 'bg-himalaya-900/80 text-parchment-300 hover:bg-himalaya-800 border border-himalaya-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-terracotta animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-parchment-400">
              Loading itineraries...
            </p>
          </div>
        ) : filteredExperiences.length === 0 ? (
          <div className="bg-himalaya-900/40 border border-himalaya-800/80 rounded-2xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-himalaya-800 text-parchment-300 flex items-center justify-center mx-auto">
              <Compass className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-editorial-serif text-lg font-bold text-parchment-100">
                No Itineraries Found
              </h4>
              <p className="text-xs text-parchment-400 font-light mt-1">
                {selectedPillar !== 'all'
                  ? `No journeys currently listed under ${CATEGORY_OPTIONS.find((c) => c.value === selectedPillar)?.label}. Create one or select another filter.`
                  : 'Create your first curated journey to showcase on the experiences page.'}
              </p>
            </div>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold shadow-warm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Itinerary</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-himalaya-900/60 border border-himalaya-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-himalaya-700 transition-all shadow-subtle group"
              >
                <div>
                  {/* Image Preview & Badges */}
                  <div className="relative h-44 w-full overflow-hidden bg-himalaya-950">
                    {exp.heroImage?.src ? (
                      <img
                        src={exp.heroImage.src}
                        alt={exp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-parchment-500">
                        <Compass className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-himalaya-950 via-himalaya-950/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
                          exp.status === 'published'
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}
                      >
                        {exp.status}
                      </span>
                      {exp.featuredOrder && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-saffron text-himalaya-950 shadow-sm">
                          Featured #{exp.featuredOrder}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-himalaya-950/80 text-parchment-200 border border-himalaya-700">
                        {getPillarLabel(exp.category, exp.categoryLabel)}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white">
                      <span className="text-[11px] text-parchment-300 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-terracotta-light" /> {exp.duration}
                      </span>
                      <span className="text-[11px] text-parchment-300 font-mono flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-saffron-light" /> {exp.location.split(',')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-editorial-serif text-lg font-bold text-parchment-100 group-hover:text-terracotta-light transition-colors line-clamp-1">
                        {exp.title}
                      </h4>
                      <p className="text-xs text-parchment-400 font-light line-clamp-2 mt-1">
                        {exp.shortDescription}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-himalaya-800/80 flex items-center justify-between text-xs text-parchment-300 font-light">
                      <span className="font-mono text-[10px] text-himalaya-400">
                        {exp.days?.length || 0} ITINERARY DAYS
                      </span>
                      <span className="font-mono text-[10px] text-parchment-400">
                        {exp.highlights?.length || 0} Highlights
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-himalaya-950/60 border-t border-himalaya-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(exp)}
                      className={`p-2 rounded-lg text-xs font-mono transition-colors ${
                        exp.status === 'published'
                          ? 'text-emerald-400 hover:bg-emerald-950/50'
                          : 'text-parchment-400 hover:bg-himalaya-800'
                      }`}
                      title={exp.status === 'published' ? 'Unpublish to draft' : 'Publish to live site'}
                    >
                      {exp.status === 'published' ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`/experiences/${exp.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-parchment-400 hover:text-white hover:bg-himalaya-800 transition-colors"
                      title="View live page"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-himalaya-800 hover:bg-himalaya-700 text-parchment-100 text-xs font-semibold border border-himalaya-700 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-saffron-light" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(exp)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors"
                      title="Delete experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experience Edit/Create Drawer/Modal */}
      {editingExp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-start p-4 sm:p-6 lg:p-8">
          <div className="relative w-full max-w-4xl bg-himalaya-900 border border-himalaya-700 rounded-3xl shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-himalaya-800 flex items-center justify-between bg-himalaya-950/60 sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-terracotta/20 text-terracotta flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial-serif text-lg font-bold text-white">
                    {isNewExp ? 'Create Itinerary Experience' : `Edit: ${editingExp.title}`}
                  </h3>
                  <p className="text-xs text-parchment-400 font-light">
                    Build day-by-day outline, highlights, philosophical notes, and media.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingExp(null)}
                className="p-2 rounded-xl text-parchment-400 hover:text-white hover:bg-himalaya-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Experience Title *
                  </label>
                  <input
                    type="text"
                    value={editingExp.title || ''}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditingExp((prev) => ({
                        ...prev,
                        title,
                        slug: isNewExp
                          ? title
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)+/g, '')
                          : prev?.slug || '',
                      }));
                    }}
                    placeholder="e.g. Kathmandu Heritage & Living Shrines"
                    className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={editingExp.slug || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="e.g. kathmandu-heritage-shrine"
                    className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm font-mono focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={editingExp.subtitle || editingExp.tagline || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({
                        ...prev,
                        subtitle: e.target.value,
                        tagline: e.target.value,
                      }))
                    }
                    placeholder="e.g. Living Courtyards & Medieval Stone Mysteries"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Nepali Script Title
                  </label>
                  <input
                    type="text"
                    value={editingExp.nepaliTitle || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, nepaliTitle: e.target.value }))
                    }
                    placeholder="e.g. नक्साभन्दा परको यात्रा"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm font-serif focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Ideal For
                  </label>
                  <input
                    type="text"
                    value={editingExp.idealFor || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, idealFor: e.target.value }))
                    }
                    placeholder="e.g. Cultural connoisseurs, slow travelers"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Experience Pillar (Category) *
                  </label>
                  <select
                    value={editingExp.category || 'beyond-the-map'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = CATEGORY_OPTIONS.find((c) => c.value === val);
                      setEditingExp((prev) => ({
                        ...prev,
                        category: val as any,
                        categoryLabel: matched?.label || 'Go Beyond the Map',
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={editingExp.duration || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, duration: e.target.value }))
                    }
                    placeholder="e.g. 7 Days / 6 Nights"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Difficulty Pace
                  </label>
                  <select
                    value={editingExp.difficulty || 'Moderate'}
                    onChange={(e) =>
                      setEditingExp((prev) => ({
                        ...prev,
                        difficulty: e.target.value as any,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  >
                    <option value="Gentle">Gentle / Relaxed</option>
                    <option value="Moderate">Moderate / Active</option>
                    <option value="Challenging">Challenging</option>
                    <option value="Custom">Custom Pace</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingExp.location || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="e.g. Bhaktapur & Kathmandu Valley"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Group Size
                  </label>
                  <input
                    type="text"
                    value={editingExp.groupSize || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, groupSize: e.target.value }))
                    }
                    placeholder="e.g. 1–8 guests (Private)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Best Season
                  </label>
                  <input
                    type="text"
                    value={editingExp.season || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, season: e.target.value }))
                    }
                    placeholder="e.g. Oct–Dec & Mar–May"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              {/* Hero Image */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-2">
                  Hero Image
                </label>
                <ImageUploader
                  value={editingExp.heroImage?.src || ''}
                  onChange={(url) =>
                    setEditingExp((prev) => ({
                      ...prev,
                      heroImage: { src: url, alt: prev?.title || 'Experience Hero' },
                    }))
                  }
                />
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                  Short Teaser / Excerpt *
                </label>
                <textarea
                  rows={2}
                  value={editingExp.shortDescription || ''}
                  onChange={(e) =>
                    setEditingExp((prev) => ({ ...prev, shortDescription: e.target.value }))
                  }
                  placeholder="A one or two sentence poetic summary for cards and search..."
                  className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                  Full Story & Overview (Separate paragraphs with double enter)
                </label>
                <textarea
                  rows={5}
                  value={fullDescText}
                  onChange={(e) => setFullDescText(e.target.value)}
                  placeholder="Paragraph 1 describing the atmosphere...&#10;&#10;Paragraph 2 detailing the unique cultural access..."
                  className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                  What Makes This Experience Different (Storytelling Focus)
                </label>
                <textarea
                  rows={3}
                  value={editingExp.whatMakesDifferent || ''}
                  onChange={(e) =>
                    setEditingExp((prev) => ({ ...prev, whatMakesDifferent: e.target.value }))
                  }
                  placeholder="Explain what sets this journey apart from ordinary commercial tours..."
                  className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-sm focus:outline-none focus:border-terracotta"
                />
              </div>

              {/* Day-by-day Itinerary Builder */}
              <div className="p-5 rounded-2xl bg-himalaya-950/70 border border-himalaya-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-editorial-serif text-base font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-terracotta" />
                      <span>Day-by-Day Itinerary Outline</span>
                    </h4>
                    <p className="text-xs text-parchment-400 font-light mt-0.5">
                      Add and order each day&apos;s title and description.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDay}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta-light text-white text-xs font-semibold shadow-warm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Day</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingExp.days || []).map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-4 rounded-xl bg-himalaya-900 border border-himalaya-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-terracotta text-white text-[10px] font-mono uppercase font-bold tracking-wider">
                          Day {day.dayNumber || dIdx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveDay(dIdx)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) => handleUpdateDay(dIdx, 'title', e.target.value)}
                        placeholder="Day Title (e.g. Dawn Meditation & Ancient Courtyards)"
                        className="w-full px-3.5 py-2 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-xs font-semibold focus:outline-none focus:border-terracotta"
                      />

                      <textarea
                        rows={2}
                        value={day.description}
                        onChange={(e) => handleUpdateDay(dIdx, 'description', e.target.value)}
                        placeholder="Day narrative and activities..."
                        className="w-full px-3.5 py-2 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-xs focus:outline-none focus:border-terracotta"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights & Inclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Signature Highlights (One per line)
                  </label>
                  <textarea
                    rows={4}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder="Monastery dawn chanting&#10;Private master pottery session&#10;Homestay feast with Tamang elders"
                    className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-xs font-mono focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Inclusions (One per line)
                  </label>
                  <textarea
                    rows={4}
                    value={inclusionsText}
                    onChange={(e) => setInclusionsText(e.target.value)}
                    placeholder="Private dedicated vehicle&#10;All national park permits&#10;Personal hosting by Sakar"
                    className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-xs font-mono focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              {/* Sakar Note & Responsible Tourism */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Sakar&apos;s Personal Perspective / Note
                  </label>
                  <textarea
                    rows={3}
                    value={editingExp.sakarNote || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, sakarNote: e.target.value }))
                    }
                    placeholder="A personal quote from Sakar on what makes this trip special..."
                    className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-xs focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                    Responsible Tourism Footprint
                  </label>
                  <textarea
                    rows={3}
                    value={editingExp.impactFootprint || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, impactFootprint: e.target.value }))
                    }
                    placeholder="How this journey directly benefits local host families..."
                    className="w-full px-4 py-2.5 rounded-xl bg-himalaya-950 border border-himalaya-700 text-parchment-100 text-xs focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              {/* Featured Priority & Visibility */}
              <div className="p-5 rounded-2xl bg-himalaya-950/80 border border-himalaya-800 space-y-4">
                <div className="flex items-center gap-2 text-saffron text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Homepage & Blog Top 3 Featured System</span>
                </div>
                <p className="text-xs text-parchment-400 font-light">
                  Assign priority order to feature exactly in the Homepage Top 3 and Blog Top 3 experiences sections.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-parchment-300 mb-1.5">
                      Top 3 Priority Slot
                    </label>
                    <select
                      value={editingExp.featuredOrder ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingExp((prev) => ({
                          ...prev,
                          featuredOrder: val > 0 ? val : undefined,
                          featured: val > 0 ? true : prev?.featured,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-himalaya-900 border border-himalaya-700 text-parchment-100 text-xs font-mono focus:outline-none focus:border-terracotta"
                    >
                      <option value={0}>None (Standard Catalog)</option>
                      <option value={1}>Featured #1 (Highest Priority)</option>
                      <option value={2}>Featured #2 (Second Priority)</option>
                      <option value={3}>Featured #3 (Third Priority)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="exp-homepage-vis"
                      checked={editingExp.homepageVisible !== false}
                      onChange={(e) =>
                        setEditingExp((prev) => ({ ...prev, homepageVisible: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-himalaya-700 text-terracotta focus:ring-terracotta"
                    />
                    <label htmlFor="exp-homepage-vis" className="text-xs text-parchment-200 cursor-pointer">
                      Homepage Visible
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="exp-blog-vis"
                      checked={editingExp.blogVisible !== false}
                      onChange={(e) =>
                        setEditingExp((prev) => ({ ...prev, blogVisible: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-himalaya-700 text-terracotta focus:ring-terracotta"
                    />
                    <label htmlFor="exp-blog-vis" className="text-xs text-parchment-200 cursor-pointer">
                      Blog / Stories Visible
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO & Metadata */}
              <div className="p-5 rounded-2xl bg-himalaya-950/70 border border-himalaya-800 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-parchment-200">
                  SEO & Social Sharing Metadata
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-parchment-400 mb-1.5">
                      Custom SEO Title
                    </label>
                    <input
                      type="text"
                      value={editingExp.seoTitle || ''}
                      onChange={(e) =>
                        setEditingExp((prev) => ({ ...prev, seoTitle: e.target.value }))
                      }
                      placeholder="e.g. Go Beyond the Map | Explore With Sakar"
                      className="w-full px-3.5 py-2 rounded-xl bg-himalaya-900 border border-himalaya-700 text-parchment-100 text-xs focus:outline-none focus:border-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-parchment-400 mb-1.5">
                      OG Social Image URL
                    </label>
                    <input
                      type="text"
                      value={editingExp.ogImage || ''}
                      onChange={(e) =>
                        setEditingExp((prev) => ({ ...prev, ogImage: e.target.value }))
                      }
                      placeholder="/images/beyond-the-map/living-courtyards.jpg"
                      className="w-full px-3.5 py-2 rounded-xl bg-himalaya-900 border border-himalaya-700 text-parchment-100 text-xs focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment-400 mb-1.5">
                    SEO Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingExp.seoDescription || ''}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, seoDescription: e.target.value }))
                    }
                    placeholder="Meta description for search engine results..."
                    className="w-full px-3.5 py-2 rounded-xl bg-himalaya-900 border border-himalaya-700 text-parchment-100 text-xs focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-himalaya-950/60 border border-himalaya-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="exp-featured"
                    checked={editingExp.featured || false}
                    onChange={(e) =>
                      setEditingExp((prev) => ({ ...prev, featured: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-himalaya-700 text-terracotta focus:ring-terracotta"
                  />
                  <label htmlFor="exp-featured" className="text-xs text-parchment-200 cursor-pointer">
                    Featured Journey Badge
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-parchment-400">Publication Status:</span>
                  <select
                    value={editingExp.status || 'published'}
                    onChange={(e) =>
                      setEditingExp((prev) => ({
                        ...prev,
                        status: e.target.value as 'draft' | 'published',
                      }))
                    }
                    className="px-3 py-1.5 rounded-xl bg-himalaya-900 border border-himalaya-700 text-parchment-100 text-xs font-mono focus:outline-none focus:border-terracotta"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-himalaya-800 bg-himalaya-950/80 flex items-center justify-end gap-3 sticky bottom-0 z-20 backdrop-blur-md">
              <button
                onClick={() => setEditingExp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-parchment-300 hover:text-white hover:bg-himalaya-800 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta-light text-white text-xs font-semibold shadow-warm transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Itinerary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Itinerary"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Itinerary"
      />

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}

export default function AdminExperiencesPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-parchment-400 font-mono text-xs">Loading itineraries...</div>}>
      <AdminExperiencesContent />
    </Suspense>
  );
}

