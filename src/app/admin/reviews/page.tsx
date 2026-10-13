'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Star,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  MoveUp,
  MoveDown,
  Loader2,
  X,
  Sparkles,
  Quote,
  BookOpen,
  Upload,
  User,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import ImageUploader from '@/components/admin/ImageUploader';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import ToastContainer, { ToastMessage } from '@/components/admin/Toast';
import { ExtendedTestimonial, HandwrittenReviewPage } from '@/types/cms';

export default function AdminReviewsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'handwritten' | 'testimonials'>('handwritten');

  // Digital Reviews state
  const [reviews, setReviews] = useState<ExtendedTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Partial<ExtendedTestimonial> | null>(null);
  const [isNewReview, setIsNewReview] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExtendedTestimonial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handwritten Reviews state
  const [handwrittenPages, setHandwrittenPages] = useState<HandwrittenReviewPage[]>([]);
  const [isLoadingHandwritten, setIsLoadingHandwritten] = useState(true);
  const [editingPage, setEditingPage] = useState<Partial<HandwrittenReviewPage> | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [deletePageTarget, setDeletePageTarget] = useState<HandwrittenReviewPage | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch digital reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHandwrittenPages = async () => {
    try {
      setIsLoadingHandwritten(true);
      const res = await fetch('/api/admin/handwritten-reviews');
      if (res.ok) {
        const data = await res.json();
        setHandwrittenPages(data.pages || []);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch handwritten review pages');
    } finally {
      setIsLoadingHandwritten(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchHandwrittenPages();
  }, []);

  // Digital Review Handlers
  const handleToggleVisibility = async (review: ExtendedTestimonial) => {
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !review.isVisible }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update visibility');
      }

      showToast(
        'success',
        review.isVisible
          ? `Review by ${review.author} is now hidden from public site`
          : `Review by ${review.author} is now visible on public site!`
      );
      fetchReviews();
      router.refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Error updating review');
    }
  };

  const handleSaveReviewModal = async () => {
    if (!editingReview?.author || !editingReview?.quote) {
      showToast('error', 'Customer Name and Review Quote are required');
      return;
    }

    setIsSavingReview(true);

    try {
      const url = isNewReview
        ? '/api/admin/reviews'
        : `/api/admin/reviews/${editingReview.id}`;
      const method = isNewReview ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReview),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save review');
      }

      showToast('success', isNewReview ? 'Review created successfully!' : 'Review updated!');
      setEditingReview(null);
      fetchReviews();
      router.refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save review');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete review');
      }

      showToast('success', `Review by ${deleteTarget.author} deleted successfully`);
      setDeleteTarget(null);
      fetchReviews();
      router.refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reviews.length) return;

    const newReviews = [...reviews];
    const temp = newReviews[index];
    newReviews[index] = newReviews[targetIndex];
    newReviews[targetIndex] = temp;

    setReviews(newReviews);

    try {
      await Promise.all([
        fetch(`/api/admin/reviews/${newReviews[index].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        }),
        fetch(`/api/admin/reviews/${newReviews[targetIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: targetIndex }),
        }),
      ]);
      showToast('info', 'Review order updated');
      router.refresh();
    } catch (err) {
      showToast('error', 'Failed to update order');
      fetchReviews();
    }
  };

  // Handwritten Page Handlers
  const handleTogglePageVisibility = async (page: HandwrittenReviewPage) => {
    try {
      const res = await fetch(`/api/admin/handwritten-reviews/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !page.isVisible }),
      });

      if (!res.ok) throw new Error('Failed to update page visibility');

      showToast(
        'success',
        page.isVisible
          ? `Page #${page.pageNumber} (${page.guestName}) is now hidden from guestbook`
          : `Page #${page.pageNumber} (${page.guestName}) is now live in guestbook!`
      );
      fetchHandwrittenPages();
      router.refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Error updating page');
    }
  };

  const handleSavePageModal = async () => {
    if (!editingPage?.guestName || !editingPage?.image) {
      showToast('error', 'Guest Name and Handwritten Review Image are required');
      return;
    }

    setIsSavingPage(true);

    try {
      const url = isNewPage
        ? '/api/admin/handwritten-reviews'
        : `/api/admin/handwritten-reviews/${editingPage.id}`;
      const method = isNewPage ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPage),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save handwritten review');
      }

      showToast(
        'success',
        isNewPage ? 'Handwritten review uploaded successfully!' : 'Handwritten review updated!'
      );
      setEditingPage(null);
      fetchHandwrittenPages();
      router.refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save page');
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleDeletePage = async () => {
    if (!deletePageTarget) return;

    setIsDeletingPage(true);
    try {
      const res = await fetch(`/api/admin/handwritten-reviews/${deletePageTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete review page');
      }

      showToast('success', `Page #${deletePageTarget.pageNumber} deleted successfully`);
      setDeletePageTarget(null);
      fetchHandwrittenPages();
      router.refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete page');
    } finally {
      setIsDeletingPage(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <AdminHeader
        title={`Stories: Traveler Reviews & Guestbook (${activeTab === 'handwritten' ? 'Handwritten Journal' : 'Digital Testimonials'})`}
        subtitle={
          activeTab === 'handwritten'
            ? `Manage ${handwrittenPages.length} physical handwritten journal pages shown in the interactive flipbook on the public website`
            : `Manage ${reviews.length} digital customer testimonial cards displayed on the public website`
        }
        actionButton={
          activeTab === 'handwritten'
            ? {
                label: 'Upload Handwritten Review',
                onClick: () => {
                  setIsNewPage(true);
                  setEditingPage({
                    guestName: '',
                    country: 'International Traveler',
                    date: 'Himalayan Journal Entry',
                    image: '',
                    pageNumber: handwrittenPages.length + 1,
                    order: handwrittenPages.length + 1,
                    note: '',
                    isVisible: true,
                  });
                },
                icon: <Plus className="w-4 h-4" />,
              }
            : {
                label: 'Add Customer Review',
                onClick: () => {
                  setIsNewReview(true);
                  setEditingReview({
                    author: '',
                    country: 'United States',
                    countryFlag: '🇺🇸',
                    journey: '10-Day Authentic Cultural Journey',
                    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    highlight: 'An unforgettable and heartfelt journey through Nepal.',
                    quote: '',
                    rating: 5,
                    avatar: '/explore-with-sakar/images/sakar/sakar-portrait.jpg',
                    isVisible: true,
                  });
                },
                icon: <Plus className="w-4 h-4" />,
              }
        }
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('handwritten')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'handwritten'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Handwritten Journal ({handwrittenPages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('testimonials')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'testimonials'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Quote className="w-4 h-4" />
              <span>Digital Reviews ({reviews.length})</span>
            </button>
          </div>

          <a
            href="/reviews#handwritten-journal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-terracotta transition-colors"
          >
            <span>View Public Guestbook</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Tab 1: Handwritten Journal Management */}
        {activeTab === 'handwritten' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 font-bold">Handwritten Guestbook Configuration:</strong>
                <p className="mt-1 text-slate-600 font-light">
                  Upload photos/scans of physical pages from Sakar&apos;s leatherbound guest journal.
                  The <strong className="text-slate-900 underline font-semibold">Guest Name</strong> entered below is displayed in <strong className="text-terracotta font-bold">bold</strong> directly above the handwritten review in the guestbook at <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-amber-700 text-xs font-mono">/reviews#handwritten-journal</code>.
                </p>
              </div>
            </div>

            {/* Handwritten Pages Grid / List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {isLoadingHandwritten ? (
                <div className="py-20 text-center text-sm text-slate-500 font-light">
                  Loading handwritten journal pages...
                </div>
              ) : handwrittenPages.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-slate-600 text-sm">No handwritten review pages found.</p>
                  <button
                    onClick={() => {
                      setIsNewPage(true);
                      setEditingPage({
                        guestName: '',
                        country: '',
                        date: 'Himalayan Journal Entry',
                        image: '',
                        pageNumber: 1,
                        order: 1,
                        note: '',
                        isVisible: true,
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta text-white rounded-xl text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload First Handwritten Page</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-himalaya-800">
                  {handwrittenPages.map((page, index) => (
                    <div
                      key={page.id}
                      className="p-4 sm:p-5 hover:bg-himalaya-850/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <span className="text-xs font-mono font-bold text-himalaya-400 px-2.5 py-1 rounded bg-himalaya-950 border border-himalaya-800 shrink-0">
                          #{page.pageNumber || index + 1}
                        </span>

                        {/* Page Thumbnail */}
                        <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden bg-white shrink-0 border border-parchment-300 shadow-sm relative flex items-center justify-center p-1">
                          <img
                            src={page.image}
                            alt={page.guestName}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>

                        {/* Guest info with BOLD guest name */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-terracotta font-semibold uppercase tracking-wider">
                              Guest Name:
                            </span>
                            {/* BOLD GUEST NAME */}
                            <h4 className="text-base sm:text-lg font-bold font-editorial-serif text-white tracking-tight">
                              {page.guestName}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-himalaya-400">
                            {page.country && (
                              <span className="flex items-center gap-1 text-parchment-300">
                                <MapPin className="w-3.5 h-3.5 text-terracotta" />
                                <span>{page.country}</span>
                              </span>
                            )}
                            {page.date && (
                              <span className="flex items-center gap-1 text-himalaya-400 font-mono">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{page.date}</span>
                              </span>
                            )}
                          </div>

                          {page.note && (
                            <p className="text-xs text-parchment-300 font-light italic truncate max-w-xl mt-1">
                              &ldquo;{page.note}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePageVisibility(page)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            page.isVisible
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
                          }`}
                          title={page.isVisible ? 'Visible in guestbook - click to hide' : 'Hidden - click to make visible'}
                        >
                          {page.isVisible ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hidden</span>
                            </>
                          )}
                        </button>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewPage(false);
                            setEditingPage({ ...page });
                          }}
                          className="p-2 rounded-lg text-parchment-300 hover:text-white hover:bg-himalaya-800 transition-colors"
                          title="Edit page & guest name"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setDeletePageTarget(page)}
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition-colors"
                          title="Delete page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Digital Testimonials List */}
        {activeTab === 'testimonials' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="py-20 text-center text-sm text-slate-500 font-light">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-slate-600 text-sm">No reviews found.</p>
                <button
                  onClick={() => {
                    setIsNewReview(true);
                    setEditingReview({
                      author: '',
                      country: 'Switzerland',
                      countryFlag: '🇨🇭',
                      journey: 'Cultural Immersion',
                      date: 'October 2025',
                      highlight: 'Wonderful experience',
                      quote: '',
                      rating: 5,
                      avatar: '/images/sakar/sakar-portrait.jpg',
                      isVisible: true,
                    });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add first review</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((review, index) => (
                  <div
                    key={review.id}
                    className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    {/* Left: Reorder + Avatar + Content */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      {/* Order handles */}
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => moveOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded hover:text-slate-800 disabled:opacity-20"
                          title="Move Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-bold">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveOrder(index, 'down')}
                          disabled={index === reviews.length - 1}
                          className="p-1 rounded hover:text-slate-800 disabled:opacity-20"
                          title="Move Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0 border-2 border-terracotta/40 relative">
                        <img
                          src={review.avatar || '/images/sakar/sakar-portrait.jpg'}
                          alt={review.author}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex text-amber-500">
                            {[...Array(review.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                          <span className="text-[12px] font-bold text-slate-900">
                            {review.author} {review.countryFlag}
                          </span>
                          <span className="text-[11px] text-slate-500">({review.country})</span>
                          <span className="text-[10px] text-slate-400 font-mono">• {review.date}</span>
                        </div>

                        <h4 className="text-sm font-editorial-serif font-bold text-slate-900">
                          &ldquo;{review.highlight}&rdquo;
                        </h4>

                        <p className="text-xs text-slate-600 font-light truncate max-w-xl">
                          {review.quote}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(review)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          review.isVisible
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
                        }`}
                        title={review.isVisible ? 'Visible on site - click to hide' : 'Hidden - click to show'}
                      >
                        {review.isVisible ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hidden</span>
                          </>
                        )}
                      </button>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewReview(false);
                          setEditingReview({ ...review });
                        }}
                        className="p-2 rounded-lg text-parchment-300 hover:text-white hover:bg-himalaya-800 transition-colors"
                        title="Edit review"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(review)}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Upload / Edit Handwritten Review Page */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-himalaya-950 border border-himalaya-800 rounded-2xl shadow-floating max-w-lg w-full p-6 text-parchment-100 my-8 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between pb-4 border-b border-himalaya-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-terracotta" />
                <h3 className="font-editorial-serif text-lg font-bold text-white">
                  {isNewPage ? 'Upload Handwritten Review' : 'Edit Handwritten Review Page'}
                </h3>
              </div>
              <button
                onClick={() => setEditingPage(null)}
                className="text-parchment-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Handwritten Page Image */}
            <ImageUploader
              value={editingPage.image || ''}
              onChange={(url) => setEditingPage({ ...editingPage, image: url })}
              label="Handwritten Review Page Scan / Photo *"
              aspectRatio="portrait"
            />

            {/* Guest Name with BOLD notice */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-200 mb-1">
                Guest Name (displayed in bold on guest page) *
              </label>
              <input
                type="text"
                required
                value={editingPage.guestName || ''}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, guestName: e.target.value })
                }
                placeholder="e.g. Elena & Marcus Weber (or Dr. Alistair Campbell)"
                className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-terracotta"
              />
              <span className="text-[11px] text-himalaya-400 mt-1 block">
                This name will appear in <strong className="text-white">bold font</strong> right above the review page in the 3D guestbook.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Country / Origin
                </label>
                <input
                  type="text"
                  value={editingPage.country || ''}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, country: e.target.value })
                  }
                  placeholder="e.g. Switzerland"
                  className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Page Sequence #
                </label>
                <input
                  type="number"
                  min={1}
                  value={editingPage.pageNumber || 1}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      pageNumber: parseInt(e.target.value) || 1,
                      order: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                Date / Tour Season
              </label>
              <input
                type="text"
                value={editingPage.date || ''}
                onChange={(e) => setEditingPage({ ...editingPage, date: e.target.value })}
                placeholder="e.g. October 2025"
                className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                Optional Transcription or Short Note
              </label>
              <textarea
                rows={2}
                value={editingPage.note || ''}
                onChange={(e) => setEditingPage({ ...editingPage, note: e.target.value })}
                placeholder="Brief summary or highlight of what the traveler wrote..."
                className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta resize-none font-light"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isPageVisible"
                checked={editingPage.isVisible !== false}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, isVisible: e.target.checked })
                }
                className="rounded border-himalaya-700 bg-himalaya-900 text-terracotta focus:ring-terracotta w-4 h-4"
              />
              <label htmlFor="isPageVisible" className="text-xs text-parchment-200">
                Display in public interactive 3D guestbook
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-himalaya-800">
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-parchment-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePageModal}
                disabled={isSavingPage}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold transition-all shadow-subtle disabled:opacity-50"
              >
                {isSavingPage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isNewPage ? 'Upload Handwritten Review' : 'Save Changes'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit / New Digital Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-himalaya-950 border border-himalaya-800 rounded-2xl shadow-floating max-w-lg w-full p-6 text-parchment-100 my-8 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between pb-4 border-b border-himalaya-800">
              <h3 className="font-editorial-serif text-lg font-bold text-white">
                {isNewReview ? 'Add Customer Testimonial' : 'Edit Customer Testimonial'}
              </h3>
              <button
                onClick={() => setEditingReview(null)}
                className="text-parchment-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ImageUploader
              value={editingReview.avatar || ''}
              onChange={(url) => setEditingReview({ ...editingReview, avatar: url })}
              label="Customer Photo / Avatar"
              aspectRatio="square"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingReview.author || ''}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, author: e.target.value })
                  }
                  placeholder="e.g. Elena & Marcus Weber"
                  className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Country & Flag Emoji
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingReview.country || ''}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, country: e.target.value })
                    }
                    placeholder="Switzerland"
                    className="flex-1 bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                  />
                  <input
                    type="text"
                    value={editingReview.countryFlag || ''}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, countryFlag: e.target.value })
                    }
                    placeholder="🇨🇭"
                    className="w-14 bg-himalaya-900 border border-himalaya-700 rounded-xl px-2 py-2 text-center text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Journey Name
                </label>
                <input
                  type="text"
                  value={editingReview.journey || ''}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, journey: e.target.value })
                  }
                  placeholder="e.g. 10-Day Village Immersion"
                  className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Travel Date
                </label>
                <input
                  type="text"
                  value={editingReview.date || ''}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, date: e.target.value })
                  }
                  placeholder="e.g. October 2025"
                  className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                Highlight Headline
              </label>
              <input
                type="text"
                value={editingReview.highlight || ''}
                onChange={(e) =>
                  setEditingReview({ ...editingReview, highlight: e.target.value })
                }
                placeholder="e.g. Pure human warmth and breathtaking vistas."
                className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                Review Quote / Feedback *
              </label>
              <textarea
                required
                rows={4}
                value={editingReview.quote || ''}
                onChange={(e) =>
                  setEditingReview({ ...editingReview, quote: e.target.value })
                }
                placeholder="Paste the traveler's feedback or words..."
                className="w-full bg-himalaya-900 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta resize-none font-light"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isReviewVisible"
                checked={editingReview.isVisible !== false}
                onChange={(e) =>
                  setEditingReview({ ...editingReview, isVisible: e.target.checked })
                }
                className="rounded border-himalaya-700 bg-himalaya-900 text-terracotta focus:ring-terracotta w-4 h-4"
              />
              <label htmlFor="isReviewVisible" className="text-xs text-parchment-200">
                Visible on public website
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-himalaya-800">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-parchment-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReviewModal}
                disabled={isSavingReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold transition-all shadow-subtle disabled:opacity-50"
              >
                {isSavingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isNewReview ? 'Create Review' : 'Save Changes'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Digital Review */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Customer Review"
        message={`Are you sure you want to delete the testimonial from "${deleteTarget?.author}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Review"}
        isDestructive={true}
        onConfirm={handleDeleteReview}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmation Modal: Delete Handwritten Page */}
      <ConfirmationModal
        isOpen={Boolean(deletePageTarget)}
        title="Delete Handwritten Review Page"
        message={`Are you sure you want to delete Page #${deletePageTarget?.pageNumber} (${deletePageTarget?.guestName})? This will remove this page from the public 3D guestbook.`}
        confirmLabel={isDeletingPage ? "Deleting..." : "Delete Page"}
        isDestructive={true}
        onConfirm={handleDeletePage}
        onCancel={() => setDeletePageTarget(null)}
      />
    </div>
  );
}
