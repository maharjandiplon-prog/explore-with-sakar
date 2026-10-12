import {
  CMSDataStore,
  ExtendedBlogPost,
  ExtendedGalleryPhoto,
  ExtendedTestimonial,
  ExtendedPackage,
  ExtendedExperience,
  ExtendedServicePillar,
  ContactInquiry,
  WebsiteSettings,
  AdminUser,
  HandwrittenReviewPage,
  CmsEvent,
  CmsDestination,
  CmsFaqItem,
  PageContent,
  PageRevision,
  NavigationConfig,
  CmsBeyondChapter,
  CmsBrandPartner,
} from '@/types/cms';
import { LeaveAMarkData } from '@/data/leave-a-mark';
import { readKey, writeKey, pushInquiry, updateInquiryById, deleteInquiryById } from './store';
import { hashPassword } from './auth';

// Re-export database unavailable errors for callers and API handlers
export { FirebaseUnavailableError, DatabaseUnavailableError, MongoUnavailableError } from './firebase-admin';

// ==================== PACKAGES OPERATIONS ====================

export async function getAllPackages(includeDrafts = true): Promise<ExtendedPackage[]> {
  const list = (await readKey<ExtendedPackage[]>('packages')) || [];
  return includeDrafts ? list : list.filter((p) => p.status === 'published');
}

export async function getPackageBySlug(slug: string, includeDrafts = true): Promise<ExtendedPackage | null> {
  const packages = await getAllPackages(includeDrafts);
  return packages.find((p) => p.slug === slug) || null;
}

export async function createPackage(
  pkgData: Omit<ExtendedPackage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExtendedPackage> {
  const list = (await readKey<ExtendedPackage[]>('packages')) || [];
  const now = new Date().toISOString();
  const newPkg: ExtendedPackage = {
    ...pkgData,
    id: `pkg-${Date.now()}-${pkgData.slug}`,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newPkg);
  await writeKey('packages', list);
  return newPkg;
}

export async function updatePackage(id: string, updates: Partial<ExtendedPackage>): Promise<ExtendedPackage | null> {
  const list = (await readKey<ExtendedPackage[]>('packages')) || [];
  const index = list.findIndex((p) => p.id === id || p.slug === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('packages', list);
  return list[index];
}

export async function deletePackage(id: string): Promise<boolean> {
  const list = (await readKey<ExtendedPackage[]>('packages')) || [];
  const decoded = decodeURIComponent(id).trim();
  let index = list.findIndex((p) => p.id === id || p.id === decoded);
  if (index === -1) {
    index = list.findIndex((p) => p.slug === id || p.slug === decoded);
  }
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('packages', list);
    return true;
  }
  return false;
}

// ==================== EXPERIENCES OPERATIONS ====================

export async function getAllExperiences(includeDrafts = true): Promise<ExtendedExperience[]> {
  const list = (await readKey<ExtendedExperience[]>('experiences')) || [];
  return includeDrafts ? list : list.filter((e) => e.status === 'published');
}

export async function getExperienceBySlug(slug: string, includeDrafts = true): Promise<ExtendedExperience | null> {
  const experiences = await getAllExperiences(includeDrafts);
  return experiences.find((e) => e.slug === slug || e.id === slug) || null;
}

export async function createExperience(
  expData: Omit<ExtendedExperience, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExtendedExperience> {
  const list = (await readKey<ExtendedExperience[]>('experiences')) || [];
  const now = new Date().toISOString();
  const newExp: ExtendedExperience = {
    ...expData,
    id: `exp-${Date.now()}-${expData.slug}`,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newExp);
  await writeKey('experiences', list);
  return newExp;
}

export async function updateExperience(
  id: string,
  updates: Partial<ExtendedExperience>
): Promise<ExtendedExperience | null> {
  const list = (await readKey<ExtendedExperience[]>('experiences')) || [];
  const index = list.findIndex((e) => e.id === id || e.slug === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('experiences', list);
  return list[index];
}

export async function deleteExperience(id: string): Promise<boolean> {
  const list = (await readKey<ExtendedExperience[]>('experiences')) || [];
  const decoded = decodeURIComponent(id).trim();
  let index = list.findIndex((e) => e.id === id || e.id === decoded);
  if (index === -1) {
    index = list.findIndex((e) => e.slug === id || e.slug === decoded);
  }
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('experiences', list);
    return true;
  }
  return false;
}

// ==================== BLOGS OPERATIONS ====================

export async function getAllBlogs(includeDrafts = true): Promise<ExtendedBlogPost[]> {
  const list = (await readKey<ExtendedBlogPost[]>('blogs')) || [];
  return includeDrafts ? list : list.filter((b) => b.status === 'published');
}

export async function getBlogBySlug(slug: string, includeDrafts = true): Promise<ExtendedBlogPost | null> {
  const blogs = await getAllBlogs(includeDrafts);
  const decoded = decodeURIComponent(slug).trim();
  return blogs.find((b) => b.slug === slug || b.id === slug || b.slug === decoded || b.id === decoded) || null;
}

export async function createBlog(
  blogData: Omit<ExtendedBlogPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExtendedBlogPost> {
  const list = (await readKey<ExtendedBlogPost[]>('blogs')) || [];
  const now = new Date().toISOString();
  const newBlog: ExtendedBlogPost = {
    ...blogData,
    id: `blog-${Date.now()}-${blogData.slug}`,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newBlog);
  await writeKey('blogs', list);
  return newBlog;
}

export async function updateBlog(id: string, updates: Partial<ExtendedBlogPost>): Promise<ExtendedBlogPost | null> {
  const list = (await readKey<ExtendedBlogPost[]>('blogs')) || [];
  const decoded = decodeURIComponent(id).trim();
  const index = list.findIndex((b) => b.id === id || b.slug === id || b.id === decoded || b.slug === decoded);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('blogs', list);
  return list[index];
}

export async function deleteBlog(id: string): Promise<boolean> {
  const list = (await readKey<ExtendedBlogPost[]>('blogs')) || [];
  const decoded = decodeURIComponent(id).trim();
  let index = list.findIndex((b) => b.id === id || b.id === decoded);
  if (index === -1) {
    index = list.findIndex((b) => b.slug === id || b.slug === decoded);
  }
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('blogs', list);
    return true;
  }
  return false;
}

// Aliases for backward compatibility during migration
export const getAllBlogsAsync = getAllBlogs;
export const getBlogBySlugAsync = getBlogBySlug;
export const createBlogAsync = createBlog;
export const updateBlogAsync = updateBlog;
export const deleteBlogAsync = deleteBlog;

// ==================== PHOTOS OPERATIONS ====================

export async function getAllPhotos(): Promise<ExtendedGalleryPhoto[]> {
  const list = (await readKey<ExtendedGalleryPhoto[]>('photos')) || [];
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function createPhoto(
  photoData: Omit<ExtendedGalleryPhoto, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<ExtendedGalleryPhoto> {
  const list = (await readKey<ExtendedGalleryPhoto[]>('photos')) || [];
  const now = new Date().toISOString();
  const newPhoto: ExtendedGalleryPhoto = {
    ...photoData,
    id: `photo-${Date.now()}`,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newPhoto);
  await writeKey('photos', list);
  return newPhoto;
}

export async function updatePhoto(id: string, updates: Partial<ExtendedGalleryPhoto>): Promise<ExtendedGalleryPhoto | null> {
  const list = (await readKey<ExtendedGalleryPhoto[]>('photos')) || [];
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('photos', list);
  return list[index];
}

export async function deletePhoto(id: string): Promise<boolean> {
  const list = (await readKey<ExtendedGalleryPhoto[]>('photos')) || [];
  const index = list.findIndex((p) => p.id === id);
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('photos', list);
    return true;
  }
  return false;
}

export async function reorderPhotos(photoIds: string[]): Promise<boolean> {
  const list = (await readKey<ExtendedGalleryPhoto[]>('photos')) || [];
  const orderMap = new Map(photoIds.map((id, index) => [id, index]));
  for (const photo of list) {
    if (orderMap.has(photo.id)) {
      photo.order = orderMap.get(photo.id)!;
    }
  }
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await writeKey('photos', list);
  return true;
}

export const getAllPhotosAsync = getAllPhotos;
export const createPhotoAsync = createPhoto;
export const updatePhotoAsync = updatePhoto;
export const deletePhotoAsync = deletePhoto;

// ==================== REVIEWS OPERATIONS ====================

export async function getAllReviews(onlyApproved = false): Promise<ExtendedTestimonial[]> {
  const list = (await readKey<ExtendedTestimonial[]>('reviews')) || [];
  const filtered = onlyApproved ? list.filter((r) => r.status === 'approved' && r.isVisible !== false) : list;
  return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function createReview(
  reviewData: Omit<ExtendedTestimonial, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<ExtendedTestimonial> {
  const list = (await readKey<ExtendedTestimonial[]>('reviews')) || [];
  const now = new Date().toISOString();
  const newReview: ExtendedTestimonial = {
    ...reviewData,
    id: `review-${Date.now()}`,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newReview);
  await writeKey('reviews', list);
  return newReview;
}

export async function updateReview(id: string, updates: Partial<ExtendedTestimonial>): Promise<ExtendedTestimonial | null> {
  const list = (await readKey<ExtendedTestimonial[]>('reviews')) || [];
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('reviews', list);
  return list[index];
}

export async function deleteReview(id: string): Promise<boolean> {
  const list = (await readKey<ExtendedTestimonial[]>('reviews')) || [];
  const index = list.findIndex((r) => r.id === id);
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('reviews', list);
    return true;
  }
  return false;
}

// ==================== HANDWRITTEN REVIEWS OPERATIONS ====================

export async function getAllHandwrittenReviews(includeHidden = false): Promise<HandwrittenReviewPage[]> {
  const list = (await readKey<HandwrittenReviewPage[]>('handwrittenReviews')) || [];
  const filtered = includeHidden ? list : list.filter((r) => r.isVisible !== false);
  return [...filtered].sort((a, b) => (a.order ?? a.pageNumber ?? 0) - (b.order ?? b.pageNumber ?? 0));
}

export async function getHandwrittenReviewById(id: string): Promise<HandwrittenReviewPage | null> {
  const reviews = await getAllHandwrittenReviews(true);
  return reviews.find((r) => r.id === id) || null;
}

export async function createHandwrittenReview(data: Partial<HandwrittenReviewPage>): Promise<HandwrittenReviewPage> {
  const list = (await readKey<HandwrittenReviewPage[]>('handwrittenReviews')) || [];
  const now = new Date().toISOString();
  const newReview: HandwrittenReviewPage = {
    id: data.id || `hw-${Date.now()}`,
    guestName: data.guestName || 'Anonymous Guest',
    country: data.country || '',
    date: data.date || 'Himalayan Journal Entry',
    image: data.image || '',
    pageNumber: data.pageNumber || list.length + 1,
    note: data.note || "Authentic handwritten letter preserved from Sakar's physical guestbook.",
    isVisible: data.isVisible !== false,
    order: data.order ?? list.length + 1,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newReview);
  await writeKey('handwrittenReviews', list);
  return newReview;
}

export async function updateHandwrittenReview(
  id: string,
  updates: Partial<HandwrittenReviewPage>
): Promise<HandwrittenReviewPage | null> {
  const list = (await readKey<HandwrittenReviewPage[]>('handwrittenReviews')) || [];
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('handwrittenReviews', list);
  return list[index];
}

export async function deleteHandwrittenReview(id: string): Promise<boolean> {
  const list = (await readKey<HandwrittenReviewPage[]>('handwrittenReviews')) || [];
  const index = list.findIndex((r) => r.id === id);
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('handwrittenReviews', list);
    return true;
  }
  return false;
}

// ==================== SETTINGS OPERATIONS ====================

export async function getSettings(): Promise<WebsiteSettings> {
  return await readKey<WebsiteSettings>('settings');
}

export async function updateSettings(updates: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  const current = await getSettings();
  const updated: WebsiteSettings = {
    ...current,
    ...updates,
    contact: { ...current.contact, ...updates.contact },
    social: { ...current.social, ...updates.social },
    branding: { ...current.branding, ...updates.branding },
    hero: { ...current.hero, ...updates.hero },
    announcement: { ...current.announcement, ...updates.announcement },
    footer: { ...current.footer, ...updates.footer },
    stats: updates.stats || current.stats,
  };
  await writeKey('settings', updated);
  return updated;
}

export const getSettingsAsync = getSettings;
export const updateSettingsAsync = updateSettings;

// ==================== SERVICES OPERATIONS ====================

export async function getAllServices(includeDrafts = true): Promise<ExtendedServicePillar[]> {
  const list = (await readKey<ExtendedServicePillar[]>('services')) || [];
  const filtered = includeDrafts ? list : list.filter((s) => s.status === 'published');
  return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getServiceBySlug(slug: string, includeDrafts = true): Promise<ExtendedServicePillar | null> {
  const services = await getAllServices(includeDrafts);
  return services.find((s) => s.slug === slug || s.id === slug) || null;
}

export async function createService(
  serviceData: Omit<ExtendedServicePillar, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<ExtendedServicePillar> {
  const list = (await readKey<ExtendedServicePillar[]>('services')) || [];
  const now = new Date().toISOString();
  const newService: ExtendedServicePillar = {
    ...serviceData,
    id: `service-${Date.now()}-${serviceData.slug}`,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newService);
  await writeKey('services', list);
  return newService;
}

export async function updateService(
  id: string,
  updates: Partial<ExtendedServicePillar>
): Promise<ExtendedServicePillar | null> {
  const list = (await readKey<ExtendedServicePillar[]>('services')) || [];
  const index = list.findIndex((s) => s.id === id || s.slug === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('services', list);
  return list[index];
}

export async function deleteService(id: string): Promise<boolean> {
  const list = (await readKey<ExtendedServicePillar[]>('services')) || [];
  const index = list.findIndex((s) => s.id === id || s.slug === id);
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('services', list);
    return true;
  }
  return false;
}

export async function reorderServices(serviceIds: string[]): Promise<boolean> {
  const list = (await readKey<ExtendedServicePillar[]>('services')) || [];
  const orderMap = new Map(serviceIds.map((id, index) => [id, index]));
  for (const srv of list) {
    if (orderMap.has(srv.id)) {
      srv.order = orderMap.get(srv.id)!;
    }
  }
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await writeKey('services', list);
  return true;
}

// ==================== INQUIRIES OPERATIONS ====================

export async function getAllInquiries(): Promise<ContactInquiry[]> {
  const list = (await readKey<ContactInquiry[]>('inquiries')) || [];
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getInquiryById(id: string): Promise<ContactInquiry | null> {
  const inquiries = await getAllInquiries();
  return inquiries.find((inq) => inq.id === id) || null;
}

export async function createInquiry(
  inquiryData: Omit<ContactInquiry, 'id' | 'createdAt' | 'status' | 'updatedAt'>
): Promise<ContactInquiry> {
  const now = new Date().toISOString();
  const newInquiry: ContactInquiry = {
    ...inquiryData,
    id: `inq-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    status: 'unread',
    createdAt: now,
    updatedAt: now,
  };
  await pushInquiry(newInquiry);
  return newInquiry;
}

export async function updateInquiry(id: string, updates: Partial<ContactInquiry>): Promise<ContactInquiry | null> {
  const success = await updateInquiryById(id, updates);
  if (!success) return null;
  return await getInquiryById(id);
}

export async function deleteInquiry(id: string): Promise<boolean> {
  return await deleteInquiryById(id);
}

// ==================== ADMIN USER OPERATIONS ====================

export async function getAdminUser(): Promise<AdminUser> {
  const user = await readKey<AdminUser>('admin');
  if (user && user.passwordHash) {
    return user;
  }
  // Require environment configuration - never use hardcoded credentials
  const initialPassword = process.env.ADMIN_PASSWORD;
  const initialUsername = process.env.ADMIN_USERNAME || 'admin';

  if (!initialPassword) {
    throw new Error(
      'ADMIN_PASSWORD environment variable is not set. Please define ADMIN_PASSWORD in your environment configuration (.env.local or production host settings).'
    );
  }

  const { hash, salt } = hashPassword(initialPassword);
  const admin: AdminUser = {
    username: initialUsername,
    passwordHash: hash,
    salt,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('admin', admin);
  return admin;
}

export async function updateAdminPassword(passwordHash: string, salt: string): Promise<void> {
  const user = await getAdminUser();
  user.passwordHash = passwordHash;
  user.salt = salt;
  user.updatedAt = new Date().toISOString();
  await writeKey('admin', user);
}

// ==================== EVENTS OPERATIONS ====================

export async function getAllEvents(includeHidden = true): Promise<CmsEvent[]> {
  const list = (await readKey<CmsEvent[]>('events')) || [];
  const filtered = includeHidden ? list : list.filter((e) => e.isVisible !== false);
  return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getEventById(id: string): Promise<CmsEvent | null> {
  const events = await getAllEvents(true);
  return events.find((e) => e.id === id) || null;
}

export async function createEvent(data: Omit<CmsEvent, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<CmsEvent> {
  const list = (await readKey<CmsEvent[]>('events')) || [];
  const now = new Date().toISOString();
  const newEvent: CmsEvent = {
    ...data,
    id: `event-${Date.now()}`,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newEvent);
  await writeKey('events', list);
  return newEvent;
}

export async function updateEvent(id: string, updates: Partial<CmsEvent>): Promise<CmsEvent | null> {
  const list = (await readKey<CmsEvent[]>('events')) || [];
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('events', list);
  return list[index];
}

export async function deleteEvent(id: string): Promise<boolean> {
  const list = (await readKey<CmsEvent[]>('events')) || [];
  const index = list.findIndex((e) => e.id === id);
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('events', list);
    return true;
  }
  return false;
}

export async function reorderEvents(ids: string[]): Promise<boolean> {
  const list = (await readKey<CmsEvent[]>('events')) || [];
  const orderMap = new Map(ids.map((id, index) => [id, index]));
  for (const item of list) {
    if (orderMap.has(item.id)) {
      item.order = orderMap.get(item.id)!;
    }
  }
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await writeKey('events', list);
  return true;
}

// ==================== DESTINATIONS OPERATIONS ====================

export async function getAllDestinations(includeHidden = true): Promise<CmsDestination[]> {
  const list = (await readKey<CmsDestination[]>('destinations')) || [];
  const filtered = includeHidden ? list : list.filter((d) => d.isVisible !== false);
  return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getDestinationById(id: string): Promise<CmsDestination | null> {
  const dests = await getAllDestinations(true);
  return dests.find((d) => d.id === id || d.slug === id) || null;
}

export async function createDestination(
  data: Omit<CmsDestination, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<CmsDestination> {
  const list = (await readKey<CmsDestination[]>('destinations')) || [];
  const now = new Date().toISOString();
  const newDest: CmsDestination = {
    ...data,
    id: data.slug || `dest-${Date.now()}`,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newDest);
  await writeKey('destinations', list);
  return newDest;
}

export async function updateDestination(id: string, updates: Partial<CmsDestination>): Promise<CmsDestination | null> {
  const list = (await readKey<CmsDestination[]>('destinations')) || [];
  const index = list.findIndex((d) => d.id === id || d.slug === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('destinations', list);
  return list[index];
}

export async function deleteDestination(id: string): Promise<boolean> {
  const list = (await readKey<CmsDestination[]>('destinations')) || [];
  const index = list.findIndex((d) => d.id === id || d.slug === id);
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('destinations', list);
    return true;
  }
  return false;
}

export async function reorderDestinations(ids: string[]): Promise<boolean> {
  const list = (await readKey<CmsDestination[]>('destinations')) || [];
  const orderMap = new Map(ids.map((id, index) => [id, index]));
  for (const item of list) {
    if (orderMap.has(item.id)) {
      item.order = orderMap.get(item.id)!;
    }
  }
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await writeKey('destinations', list);
  return true;
}

// ==================== FAQ OPERATIONS ====================

export async function getAllFaq(includeHidden = true): Promise<CmsFaqItem[]> {
  const list = (await readKey<CmsFaqItem[]>('faq')) || [];
  const filtered = includeHidden ? list : list.filter((f) => f.isVisible !== false);
  return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getFaqById(id: string): Promise<CmsFaqItem | null> {
  const faq = await getAllFaq(true);
  return faq.find((f) => f.id === id) || null;
}

export async function createFaq(data: Omit<CmsFaqItem, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<CmsFaqItem> {
  const list = (await readKey<CmsFaqItem[]>('faq')) || [];
  const now = new Date().toISOString();
  const newFaq: CmsFaqItem = {
    ...data,
    id: `faq-${Date.now()}`,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newFaq);
  await writeKey('faq', list);
  return newFaq;
}

export async function updateFaq(id: string, updates: Partial<CmsFaqItem>): Promise<CmsFaqItem | null> {
  const list = (await readKey<CmsFaqItem[]>('faq')) || [];
  const index = list.findIndex((f) => f.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('faq', list);
  return list[index];
}

export async function deleteFaq(id: string): Promise<boolean> {
  const list = (await readKey<CmsFaqItem[]>('faq')) || [];
  const index = list.findIndex((f) => f.id === id);
  if (index !== -1) {
    list.splice(index, 1);
    await writeKey('faq', list);
    return true;
  }
  return false;
}

export async function reorderFaq(ids: string[]): Promise<boolean> {
  const list = (await readKey<CmsFaqItem[]>('faq')) || [];
  const orderMap = new Map(ids.map((id, index) => [id, index]));
  for (const item of list) {
    if (orderMap.has(item.id)) {
      item.order = orderMap.get(item.id)!;
    }
  }
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await writeKey('faq', list);
  return true;
}

// ==================== PAGES OPERATIONS ====================

export async function getAllPages(): Promise<PageContent[]> {
  return (await readKey<PageContent[]>('pages')) || [];
}

export async function getPageBySlug(slug: string): Promise<PageContent | null> {
  const pages = await getAllPages();
  return pages.find((p) => p.slug === slug) || null;
}

export async function createPage(data: Omit<PageContent, 'createdAt' | 'updatedAt'>): Promise<PageContent> {
  const list = (await readKey<PageContent[]>('pages')) || [];
  const now = new Date().toISOString();
  const newPage: PageContent = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newPage);
  await writeKey('pages', list);
  return newPage;
}

export async function updatePage(slug: string, updates: Partial<PageContent>): Promise<PageContent | null> {
  const list = (await readKey<PageContent[]>('pages')) || [];
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('pages', list);
  return list[index];
}

export async function publishPage(slug: string, editedBy: string): Promise<PageContent | null> {
  const list = (await readKey<PageContent[]>('pages')) || [];
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return null;

  await savePageRevision(slug, editedBy, 'published');

  list[index] = {
    ...list[index],
    status: 'published',
    publishedAt: new Date().toISOString(),
    lastEditedBy: editedBy,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('pages', list);
  return list[index];
}

export async function unpublishPage(slug: string): Promise<PageContent | null> {
  const list = (await readKey<PageContent[]>('pages')) || [];
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
  await writeKey('pages', list);
  return list[index];
}

export async function getPageRevisions(pageSlug: string): Promise<PageRevision[]> {
  const list = (await readKey<PageRevision[]>('pageRevisions')) || [];
  return list
    .filter((r) => r.pageSlug === pageSlug)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function savePageRevision(
  pageSlug: string,
  editedBy: string,
  status: 'published' | 'draft' = 'draft'
): Promise<PageRevision | null> {
  const page = await getPageBySlug(pageSlug);
  if (!page) return null;

  const revisions = (await readKey<PageRevision[]>('pageRevisions')) || [];
  const pageRevs = revisions.filter((r) => r.pageSlug === pageSlug);
  const nextVersion = pageRevs.length > 0 ? Math.max(...pageRevs.map((r) => r.version || 1)) + 1 : 1;

  const revision: PageRevision = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    pageSlug,
    version: nextVersion,
    sections: JSON.parse(JSON.stringify(page.sections)),
    seo: JSON.parse(JSON.stringify(page.seo)),
    status,
    editedBy,
    createdAt: new Date().toISOString(),
  };

  revisions.push(revision);

  // Keep maximum 20 revisions per page
  if (pageRevs.length >= 20) {
    pageRevs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const toRemove = pageRevs.slice(19);
    const removeIds = new Set(toRemove.map((r) => r.id));
    const filtered = revisions.filter((r) => !removeIds.has(r.id));
    await writeKey('pageRevisions', filtered);
  } else {
    await writeKey('pageRevisions', revisions);
  }

  return revision;
}

export async function restorePageRevision(revisionId: string, editedBy: string): Promise<PageContent | null> {
  const revisions = (await readKey<PageRevision[]>('pageRevisions')) || [];
  const revision = revisions.find((r) => r.id === revisionId);
  if (!revision) return null;

  const pages = (await readKey<PageContent[]>('pages')) || [];
  const pageIndex = pages.findIndex((p) => p.slug === revision.pageSlug);
  if (pageIndex === -1) return null;

  await savePageRevision(revision.pageSlug, editedBy, 'draft');

  const restored: PageContent = {
    ...pages[pageIndex],
    sections: JSON.parse(JSON.stringify(revision.sections)),
    seo: JSON.parse(JSON.stringify(revision.seo)),
    status: 'draft',
    lastEditedBy: editedBy,
    updatedAt: new Date().toISOString(),
  };

  pages[pageIndex] = restored;
  await writeKey('pages', pages);
  return restored;
}

// ==================== NAVIGATION OPERATIONS ====================

export async function getNavigation(): Promise<NavigationConfig> {
  return await readKey<NavigationConfig>('navigation');
}

export async function updateNavigation(config: NavigationConfig): Promise<NavigationConfig> {
  config.updatedAt = new Date().toISOString();
  await writeKey('navigation', config);
  return config;
}

// ==================== BEYOND THE MAP CHAPTERS OPERATIONS ====================

export async function getAllBeyondChapters(includeUnpublished = true): Promise<CmsBeyondChapter[]> {
  const list = (await readKey<CmsBeyondChapter[]>('beyondChapters')) || [];
  const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return includeUnpublished ? sorted : sorted.filter((c) => c.isPublished !== false);
}

export async function getBeyondChapterById(id: string): Promise<CmsBeyondChapter | null> {
  const list = await getAllBeyondChapters(true);
  return list.find((c) => c.id === id) || null;
}

export async function createBeyondChapter(
  data: Omit<CmsBeyondChapter, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<CmsBeyondChapter> {
  const list = (await readKey<CmsBeyondChapter[]>('beyondChapters')) || [];
  const now = new Date().toISOString();
  const id = (data.title || 'chapter').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newChapter: CmsBeyondChapter = {
    ...data,
    id: id || `chapter-${Date.now()}`,
    order: list.length,
    isPublished: data.isPublished !== undefined ? data.isPublished : true,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newChapter);
  await writeKey('beyondChapters', list);
  return newChapter;
}

export async function updateBeyondChapter(
  id: string,
  updates: Partial<CmsBeyondChapter>
): Promise<CmsBeyondChapter | null> {
  const list = (await readKey<CmsBeyondChapter[]>('beyondChapters')) || [];
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('beyondChapters', list);
  return list[index];
}

export async function deleteBeyondChapter(id: string): Promise<boolean> {
  const list = (await readKey<CmsBeyondChapter[]>('beyondChapters')) || [];
  const filtered = list.filter((c) => c.id !== id);
  if (filtered.length === list.length) return false;
  await writeKey('beyondChapters', filtered);
  return true;
}

export async function reorderBeyondChapters(orderedIds: string[]): Promise<boolean> {
  const list = (await readKey<CmsBeyondChapter[]>('beyondChapters')) || [];
  const map = new Map(list.map((c) => [c.id, c]));
  const reordered: CmsBeyondChapter[] = [];

  orderedIds.forEach((id, index) => {
    const item = map.get(id);
    if (item) {
      reordered.push({ ...item, order: index, updatedAt: new Date().toISOString() });
      map.delete(id);
    }
  });

  // Append any remaining
  map.forEach((item) => {
    reordered.push({ ...item, order: reordered.length });
  });

  await writeKey('beyondChapters', reordered);
  return true;
}

// ==================== LEAVE A MARK SINGLETON OPERATIONS ====================

export async function getLeaveAMark(): Promise<LeaveAMarkData> {
  return await readKey<LeaveAMarkData>('leaveAMark');
}

export async function updateLeaveAMark(data: Partial<LeaveAMarkData>): Promise<LeaveAMarkData> {
  const current = await getLeaveAMark();
  const updated = {
    ...current,
    ...data,
  };
  await writeKey('leaveAMark', updated);
  return updated;
}

// ==================== BRAND PARTNERS OPERATIONS ====================

export async function getAllBrandPartners(includeHidden = true): Promise<CmsBrandPartner[]> {
  const list = (await readKey<CmsBrandPartner[]>('brandPartners')) || [];
  const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return includeHidden ? sorted : sorted.filter((p) => p.isVisible !== false);
}

export async function getBrandPartnerById(id: string): Promise<CmsBrandPartner | null> {
  const list = await getAllBrandPartners(true);
  return list.find((p) => p.id === id) || null;
}

export async function createBrandPartner(
  data: Omit<CmsBrandPartner, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<CmsBrandPartner> {
  const list = (await readKey<CmsBrandPartner[]>('brandPartners')) || [];
  const now = new Date().toISOString();
  const slug = (data.name || 'partner').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newPartner: CmsBrandPartner = {
    ...data,
    id: `partner-${Date.now()}-${slug}`,
    slug,
    order: list.length,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newPartner);
  await writeKey('brandPartners', list);
  return newPartner;
}

export async function updateBrandPartner(
  id: string,
  updates: Partial<CmsBrandPartner>
): Promise<CmsBrandPartner | null> {
  const list = (await readKey<CmsBrandPartner[]>('brandPartners')) || [];
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeKey('brandPartners', list);
  return list[index];
}

export async function deleteBrandPartner(id: string): Promise<boolean> {
  const list = (await readKey<CmsBrandPartner[]>('brandPartners')) || [];
  const filtered = list.filter((p) => p.id !== id);
  if (filtered.length === list.length) return false;
  await writeKey('brandPartners', filtered);
  return true;
}

export async function reorderBrandPartners(orderedIds: string[]): Promise<boolean> {
  const list = (await readKey<CmsBrandPartner[]>('brandPartners')) || [];
  const map = new Map(list.map((p) => [p.id, p]));
  const reordered: CmsBrandPartner[] = [];

  orderedIds.forEach((id, index) => {
    const item = map.get(id);
    if (item) {
      reordered.push({ ...item, order: index, updatedAt: new Date().toISOString() });
      map.delete(id);
    }
  });

  map.forEach((item) => {
    reordered.push({ ...item, order: reordered.length });
  });

  await writeKey('brandPartners', reordered);
  return true;
}
