'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Globe,
  Share2,
  Sparkles,
  Image as ImageIcon,
  Shield,
  CheckCircle2,
  Loader2,
  Lock,
  Key,
  Palette,
  BookOpen,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import ImageUploader from '@/components/admin/ImageUploader';
import ToastContainer, { ToastMessage } from '@/components/admin/Toast';
import { WebsiteSettings } from '@/types/cms';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'contact' | 'social' | 'hero' | 'announcement' | 'branding' | 'security' | 'guide'>('contact');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Security password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch website settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      router.refresh();
      showToast(
        'success',
        'Website settings saved! Changes are now live on public website.'
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      showToast('success', 'Admin password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', err?.message || 'Error updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-parchment-300">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
        <p className="text-xs uppercase tracking-wider font-semibold">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      <AdminHeader
        title="Website Settings"
        subtitle="Configure live contact information, hero content, logo, social links, and security"
        actionButton={{
          label: isSaving ? 'Saving Changes...' : 'Save All Settings',
          onClick: handleSaveSettings,
          icon: isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />,
        }}
      />

      <div className="px-4 sm:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-himalaya-850 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'contact'
                ? 'bg-terracotta text-white font-bold shadow-warm'
                : 'bg-himalaya-900 text-parchment-300 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact & WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'social'
                ? 'bg-terracotta text-white font-bold shadow-warm'
                : 'bg-himalaya-900 text-parchment-300 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'hero'
                ? 'bg-terracotta text-white font-bold shadow-warm'
                : 'bg-himalaya-900 text-parchment-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Homepage & Hero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcement')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'announcement'
                ? 'bg-terracotta text-white font-bold shadow-warm'
                : 'bg-himalaya-900 text-parchment-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Announcement Bar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'branding'
                ? 'bg-terracotta text-white font-bold shadow-warm'
                : 'bg-himalaya-900 text-parchment-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Branding & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'security'
                ? 'bg-terracotta text-white font-bold shadow-warm'
                : 'bg-himalaya-900 text-parchment-300 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'guide'
                ? 'bg-terracotta text-white font-bold shadow-warm'
                : 'bg-himalaya-900 text-parchment-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Admin Guide</span>
          </button>
        </div>

        {/* TAB 1: Contact Information */}
        {activeTab === 'contact' && (
          <div className="bg-himalaya-900 border border-himalaya-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-himalaya-800">
              <div>
                <h3 className="font-editorial-serif text-lg font-bold text-white">
                  Direct Communications & Contact Info
                </h3>
                <p className="text-xs text-parchment-400 font-light mt-0.5">
                  Updates telephone numbers, WhatsApp floating button, email, and base address dynamically across Navbar, Footer, and Contact page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  Phone Number (Display Format)
                </label>
                <input
                  type="text"
                  value={settings.contact.phoneDisplay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, phoneDisplay: e.target.value, phoneNumber: e.target.value },
                    })
                  }
                  placeholder="+977 984-0482692"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm font-mono text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  WhatsApp Number (Numbers Only with Country Code)
                </label>
                <input
                  type="text"
                  value={settings.contact.whatsappNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, whatsappNumber: e.target.value },
                    })
                  }
                  placeholder="9779840482692"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm font-mono text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                Default WhatsApp Message
              </label>
              <input
                type="text"
                value={settings.contact.whatsappDefaultMessage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact: { ...settings.contact, whatsappDefaultMessage: e.target.value },
                  })
                }
                placeholder="Namaste Sakar, I am interested in planning an authentic Nepal journey."
                className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={settings.contact.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, email: e.target.value },
                    })
                  }
                  placeholder="Explorewithsakar@gmail.com"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  Business / Operating Hours
                </label>
                <input
                  type="text"
                  value={settings.contact.businessHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, businessHours: e.target.value },
                    })
                  }
                  placeholder="Sunday – Saturday: 7:00 AM – 9:00 PM NPT"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  Primary Location / City
                </label>
                <input
                  type="text"
                  value={settings.contact.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, address: e.target.value },
                    })
                  }
                  placeholder="Kathmandu, Nepal"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  Area / Neighborhood Details
                </label>
                <input
                  type="text"
                  value={settings.contact.addressDetails}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, addressDetails: e.target.value },
                    })
                  }
                  placeholder="Patan & Thamel Heritage Quarter"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Social Media */}
        {activeTab === 'social' && (
          <div className="bg-himalaya-900 border border-himalaya-800 rounded-2xl p-6 space-y-5">
            <div className="pb-3 border-b border-himalaya-800">
              <h3 className="font-editorial-serif text-lg font-bold text-white">
                Social Media Profiles & Channels
              </h3>
              <p className="text-xs text-parchment-400 font-light mt-0.5">
                Configures public profile links in footer and headers
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Instagram Profile URL
                </label>
                <input
                  type="url"
                  value={settings.social.instagram}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/explorewithsakar"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Facebook Page URL
                </label>
                <input
                  type="url"
                  value={settings.social.facebook}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, facebook: e.target.value },
                    })
                  }
                  placeholder="https://facebook.com/explorewithsakar"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={settings.social.youtube}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, youtube: e.target.value },
                    })
                  }
                  placeholder="https://youtube.com/@explorewithsakar"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  TripAdvisor Page URL
                </label>
                <input
                  type="url"
                  value={settings.social.tripadvisor}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, tripadvisor: e.target.value },
                    })
                  }
                  placeholder="https://tripadvisor.com"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Homepage & Hero */}
        {activeTab === 'hero' && (
          <div className="bg-himalaya-900 border border-himalaya-800 rounded-2xl p-6 space-y-6">
            <div className="pb-3 border-b border-himalaya-800">
              <h3 className="font-editorial-serif text-lg font-bold text-white">
                Homepage Hero Section & Cutout
              </h3>
              <p className="text-xs text-parchment-400 font-light mt-0.5">
                Customize the visual headline, narrative, and cutout imagery on the homepage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                    Hero Top Badge
                  </label>
                  <input
                    type="text"
                    value={settings.hero.badgeText}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, badgeText: e.target.value },
                      })
                    }
                    placeholder="A Journey Beyond The Surface"
                    className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                      Headline Prefix
                    </label>
                    <input
                      type="text"
                      value={settings.hero.headlinePart1}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, headlinePart1: e.target.value },
                        })
                      }
                      placeholder="Discover Nepal Through"
                      className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                      Italic Highlight 1
                    </label>
                    <input
                      type="text"
                      value={settings.hero.headlineHighlight1}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, headlineHighlight1: e.target.value },
                        })
                      }
                      placeholder="Culture"
                      className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                      Headline Middle
                    </label>
                    <input
                      type="text"
                      value={settings.hero.headlinePart2}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, headlinePart2: e.target.value },
                        })
                      }
                      placeholder=", Spirituality &"
                      className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                      Color Highlight 2
                    </label>
                    <input
                      type="text"
                      value={settings.hero.headlineHighlight2}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, headlineHighlight2: e.target.value },
                        })
                      }
                      placeholder="Meaningful"
                      className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300">
                      Hero Narrative Description
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3 h-3 text-terracotta" />
                      <span className="text-[10px] text-parchment-400 font-mono">Color:</span>
                      {[
                        { name: 'Default Sand', color: '#e5decf' },
                        { name: 'Terracotta', color: '#c85a32' },
                        { name: 'Saffron', color: '#d97706' },
                        { name: 'Emerald', color: '#047857' },
                        { name: 'White', color: '#ffffff' },
                      ].map((s) => (
                        <button
                          key={s.color}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              hero: { ...settings.hero, descriptionColor: s.color },
                            })
                          }
                          className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                            settings.hero.descriptionColor === s.color
                              ? 'ring-2 ring-terracotta scale-110 border-white'
                              : 'border-white/20 hover:scale-105'
                          }`}
                          style={{ backgroundColor: s.color }}
                          title={s.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={settings.hero.descriptionColor || '#e5decf'}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, descriptionColor: e.target.value },
                          })
                        }
                        className="w-3.5 h-3.5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Custom color"
                      />
                      {settings.hero.descriptionColor && (
                        <button
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              hero: { ...settings.hero, descriptionColor: undefined },
                            })
                          }
                          className="text-[10px] text-parchment-400 hover:text-white ml-1"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.hero.description}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, description: e.target.value },
                      })
                    }
                    style={{ color: settings.hero.descriptionColor || undefined }}
                    className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl p-3 text-xs focus:outline-none focus:border-terracotta leading-relaxed transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.hero.ctaText}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, ctaText: e.target.value },
                        })
                      }
                      placeholder="Begin The Journey"
                      className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                      CTA Button Link
                    </label>
                    <input
                      type="text"
                      value={settings.hero.ctaLink}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, ctaLink: e.target.value },
                        })
                      }
                      placeholder="#experiences"
                      className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-3 py-2 text-xs text-parchment-100 focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>
              </div>

              {/* Cutout Image */}
              <div className="space-y-4">
                <ImageUploader
                  value={settings.hero.cutoutImage}
                  onChange={(url) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, cutoutImage: url },
                    })
                  }
                  label="Host Cutout Image (Transparent PNG / WebP)"
                  aspectRatio="portrait"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Announcement Bar */}
        {activeTab === 'announcement' && (
          <div className="bg-himalaya-900 border border-himalaya-800 rounded-2xl p-6 space-y-5">
            <div className="pb-3 border-b border-himalaya-800">
              <h3 className="font-editorial-serif text-lg font-bold text-white">
                Top Announcement Strip
              </h3>
              <p className="text-xs text-parchment-400 font-light mt-0.5">
                Displays the thin banner at the very top of the page
              </p>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="announcementActive"
                checked={settings.announcement.isActive}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, isActive: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-terracotta focus:ring-terracotta bg-himalaya-950 border-himalaya-700"
              />
              <label htmlFor="announcementActive" className="text-xs font-semibold text-parchment-200 cursor-pointer">
                Show Announcement Banner at Top of Page
              </label>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Banner Highlight Badge
                </label>
                <input
                  type="text"
                  value={settings.announcement.badgeText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: { ...settings.announcement, badgeText: e.target.value },
                    })
                  }
                  placeholder="AUTUMN & SPRING TRAVEL CONSULTATIONS OPEN"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Banner Text / Host Title
                </label>
                <input
                  type="text"
                  value={settings.announcement.text}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: { ...settings.announcement, text: e.target.value },
                    })
                  }
                  placeholder="Sakar • Responsible Tour Director"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                  Action Link Text
                </label>
                <input
                  type="text"
                  value={settings.announcement.ctaText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: { ...settings.announcement, ctaText: e.target.value },
                    })
                  }
                  placeholder="WhatsApp Sakar Direct"
                  className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Branding & Logo */}
        {activeTab === 'branding' && (
          <div className="bg-himalaya-900 border border-himalaya-800 rounded-2xl p-6 space-y-6">
            <div className="pb-3 border-b border-himalaya-800">
              <h3 className="font-editorial-serif text-lg font-bold text-white">
                Brand Assets & Identity
              </h3>
              <p className="text-xs text-parchment-400 font-light mt-0.5">
                Upload or replace the site logo and website tagline
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploader
                value={settings.branding.logoUrl}
                onChange={(url) =>
                  setSettings({
                    ...settings,
                    branding: { ...settings.branding, logoUrl: url },
                  })
                }
                label="Site Logo Image"
                aspectRatio="landscape"
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={settings.branding.siteName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, siteName: e.target.value },
                      })
                    }
                    placeholder="Explore With Sakar"
                    className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.branding.tagline}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, tagline: e.target.value },
                      })
                    }
                    placeholder="Authentic Nepal Travel & Cultural Experiences"
                    className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl px-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Security / Change Password */}
        {activeTab === 'security' && (
          <div className="bg-himalaya-900 border border-himalaya-800 rounded-2xl p-6 space-y-6 max-w-xl">
            <div className="pb-3 border-b border-himalaya-800">
              <h3 className="font-editorial-serif text-lg font-bold text-white">
                Admin Password & Access Control
              </h3>
              <p className="text-xs text-parchment-400 font-light mt-0.5">
                Update your administrator credentials securely
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-himalaya-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  New Password (Min. 6 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-himalaya-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-parchment-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-himalaya-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-himalaya-950 border border-himalaya-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-parchment-100 focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-terracotta hover:bg-terracotta-light text-white text-xs font-bold uppercase tracking-wider shadow-warm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Security Credentials...</span>
                  </>
                ) : (
                  <span>Update Admin Password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: Admin Guide */}
        {activeTab === 'guide' && (
          <div className="bg-himalaya-900 border border-himalaya-800 rounded-2xl p-6 space-y-6">
            <div className="pb-3 border-b border-himalaya-800">
              <h3 className="font-editorial-serif text-lg font-bold text-white">Admin Guide</h3>
              <p className="text-xs text-parchment-400 font-light mt-0.5">
                A reference guide to help you understand and manage the website.
              </p>
            </div>

            <div className="space-y-6 text-sm text-parchment-200 leading-relaxed">
              {/* Dashboard */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">📊 Dashboard</h4>
                <p className="text-parchment-300">
                  Your starting point. See recent inquiries, visitor counts, and quick actions. Click any card to dive into that section.
                </p>
              </div>

              {/* Inquiries */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">📬 Inquiries</h4>
                <p className="text-parchment-300">
                  All traveler inquiries from the website contact forms appear here. You can mark them as read, reply, or archive them. The red badge on the sidebar shows unread inquiries.
                </p>
              </div>

              {/* Experiences */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">🧭 Experiences</h4>
                <p className="text-parchment-300 mb-2">
                  The website features four distinct travel experiences, each functioning as a category that houses featured topics/itineraries:
                </p>
                <ul className="list-disc list-inside space-y-1 text-parchment-400 ml-2">
                  <li><strong className="text-parchment-200">Beyond the Map</strong> — Medieval Bahals, Silk Road alleys, and living courtyards</li>
                  <li><strong className="text-parchment-200">Go Within</strong> — Sound vibration therapy, dawn monastery pujas, and cave meditation</li>
                  <li><strong className="text-parchment-200">Go Deeper</strong> — Immersive deep-dive journeys into Nepal&apos;s hidden cultural layers and sacred architecture</li>
                  <li><strong className="text-parchment-200">Leave a Mark</strong> — Strategic community collaboration, indigenous forest guardians, and grassroots empowerment</li>
                </ul>
                <div className="mt-3 bg-himalaya-950 border border-himalaya-700 rounded-xl p-4 space-y-2">
                  <h5 className="font-semibold text-amber-400 text-xs uppercase tracking-wider">How Experiences & Topics Work</h5>
                  <p className="text-xs text-parchment-300">
                    <strong>1. Experience Landing Page:</strong> When a visitor goes to an experience page (e.g. <code>/experiences/beyond-the-map</code>), they see the Experience Overview, Curated Exploration Highlights, and exactly four featured topic discovery cards (Photo, Title, Short Description, and &ldquo;Explore Topic →&rdquo;).
                  </p>
                  <p className="text-xs text-parchment-300">
                    <strong>2. Individual Itinerary Page:</strong> Clicking the photo or the &ldquo;Explore Topic →&rdquo; button opens the detailed topic page (e.g. <code>/experiences/beyond-the-map/kathmandu-durbar-square</code>). This is where duration, group size, quote, detailed itinerary narrative, and inquiry button appear.
                  </p>
                  <p className="text-xs text-parchment-300">
                    <strong>3. Adding & Editing Topics:</strong> From the Experience Hub, click &ldquo;Add Itinerary / Package&rdquo; to create a new topic under that experience, or &ldquo;Edit Itineraries / Packages&rdquo; to update titles, photos, durations, quotes, and descriptions.
                  </p>
                </div>
              </div>

              {/* Blog & Stories */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">📝 Blog & Stories</h4>
                <p className="text-parchment-300">
                  Manage all stories in the Himalayan Journal. You can search by title/content, filter by category or publication status (Published / Draft), edit full article content, and publish updates live to Firestore.
                </p>
              </div>

              {/* Content & Media */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">🖼️ Content & Media</h4>
                <ul className="list-disc list-inside space-y-1.5 text-parchment-400 ml-2">
                  <li><strong className="text-parchment-200">Photo Gallery</strong> — Upload, caption, and reorder photographs displayed on the public gallery.</li>
                  <li><strong className="text-parchment-200">Traveler Reviews</strong> — Upload and manage handwritten guestbook pages and photos from past travelers.</li>
                  <li><strong className="text-parchment-200">Digital Reviews</strong> — Manage verified digital quotes and star ratings from guests.</li>
                  <li><strong className="text-parchment-200">Events & Festivals</strong> — Update seasonal Himalayan festivals and cultural gatherings.</li>
                </ul>
              </div>

              {/* Site Configuration */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">⚙️ Site Configuration</h4>
                <ul className="list-disc list-inside space-y-1.5 text-parchment-400 ml-2">
                  <li><strong className="text-parchment-200">Homepage Content</strong> — Customize the hero headline, slideshow photos, Sakar cutout photo, and trust statistics.</li>
                  <li><strong className="text-parchment-200">Pages</strong> — Manage page-specific content and section visibility.</li>
                  <li><strong className="text-parchment-200">Navigation</strong> — Configure header menus, dropdown links, and footer columns.</li>
                  <li><strong className="text-parchment-200">FAQ</strong> — Organize frequently asked questions into searchable categories for travelers.</li>
                </ul>
              </div>

              {/* Settings */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">🔧 Settings</h4>
                <p className="text-parchment-300">
                  Configure contact info, social media links, homepage hero content, announcement bar, branding/logo, and admin password. All tabs on this page save globally with one click.
                </p>
              </div>

              {/* SEO */}
              <div>
                <h4 className="font-bold text-white text-base mb-1">🔍 SEO</h4>
                <p className="text-parchment-300">
                  Search Engine Optimization settings are built into individual page and experience editors. When editing a blog, page, or experience, look for the SEO fields (title tag, meta description) at the bottom of the editor.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
