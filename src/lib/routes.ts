/**
 * EXPLORE WITH SAKAR — CANONICAL URL & ROUTING ARCHITECTURE
 * 
 * Strict architectural separation:
 * 
 * 1. PUBLIC EXPERIENCES:
 *    Namespace: /experiences/*
 *    - /experiences                              (All Curated Experiences Catalog)
 *    - /experiences/beyond-the-map               (Go Beyond the Map)
 *    - /experiences/spiritual-wellness           (Go Within: Himalayan Sound & Stillness)
 *    - /experiences/homestays                    (Feel Closer: Mountain Homestays & Living Hearths)
 *    - /experiences/leave-a-mark                 (Leave a Mark: Strategic Volunteer Tourism)
 *    - /experiences/custom-journeys              (Custom Private Journeys)
 *    - /experiences/[slug]                       (Specific Curated Experience Departures)
 * 
 * 2. PUBLIC SERVICES:
 *    Namespace: /services/* ONLY when genuinely a distinct non-experience business service.
 *    Any legacy /services/... or /service/... experience URLs permanently redirect (301) to /experiences/...
 * 
 * 3. ADMIN CMS:
 *    Namespace: /admin/*
 *    Completely isolated conceptually and technically from public URLs.
 *    - /admin/experiences                        (Itinerary CMS)
 *    - /admin/pages/*                            (Page Overrides CMS)
 *    - /admin/beyond-chapters                    (Beyond the Map Chapters CMS)
 *    - /admin/leave-a-mark                       (Leave a Mark Strategy CMS)
 * 
 * 4. API:
 *    Namespace: /api/public/* for public cacheable endpoints.
 *    Namespace: /api/admin/* for protected CMS mutation endpoints.
 * 
 * NEVER redirect canonical /experiences/... back to /services or /experience.
 * NEVER create redirect chains.
 * NEVER mix Admin and Public route namespaces.
 */

export const CANONICAL_EXPERIENCE_ROUTES = {
  catalog: '/experiences',
  beyondTheMap: '/experiences/beyond-the-map',
  goWithin: '/experiences/go-within',
  spiritualWellness: '/experiences/go-within',
  homestays: '/experiences/homestays',
  leaveAMark: '/experiences/leave-a-mark',
  customJourneys: '/experiences/custom-journeys',
  detail: (slug: string) => `/experiences/${slug}`,
} as const;

export const LEGACY_EXPERIENCE_REDIRECTS: Record<string, string> = {
  // Singular /experience aliases
  '/experience': '/experiences',
  '/experience/all-curated-experiences': '/experiences',
  '/experience/go-beyond': '/experiences/beyond-the-map',
  '/experience/beyond-the-map': '/experiences/beyond-the-map',
  '/experience/go-spiritual': '/experiences/go-within',
  '/experience/spiritual-wellness': '/experiences/go-within',
  '/experience/go-within': '/experiences/go-within',
  '/experiences/spiritual-wellness': '/experiences/go-within',
  '/experiences/go-spiritual': '/experiences/go-within',
  '/experience/feel-closer': '/experiences/homestays',
  '/experience/homestays': '/experiences/homestays',
  '/experience/leave-a-mark': '/experiences/leave-a-mark',
  '/experience/custom-private-journeys': '/experiences/custom-journeys',
  '/experience/custom-journeys': '/experiences/custom-journeys',

  // Old /services aliases
  '/services': '/experiences',
  '/service': '/experiences',
  '/services/beyond-the-map': '/experiences/beyond-the-map',
  '/service/beyond-the-map': '/experiences/beyond-the-map',
  '/services/spiritual-wellness': '/experiences/go-within',
  '/service/spiritual-wellness': '/experiences/go-within',
  '/services/go-spiritual': '/experiences/go-within',
  '/service/go-spiritual': '/experiences/go-within',
  '/services/go-within': '/experiences/go-within',
  '/service/go-within': '/experiences/go-within',
  '/services/homestays': '/experiences/homestays',
  '/service/homestays': '/experiences/homestays',
  '/services/leave-a-mark': '/experiences/leave-a-mark',
  '/service/leave-a-mark': '/experiences/leave-a-mark',
  '/services/custom-journeys': '/experiences/custom-journeys',
  '/service/custom-journeys': '/experiences/custom-journeys',
  '/services/culture': '/experiences',
  '/services/trekking': '/experiences/beyond-the-map',
};
