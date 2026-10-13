/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://storage.googleapis.com https://firebasestorage.googleapis.com https://explorewithsakar.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://*.google-analytics.com",
      "frame-src 'self' https://www.youtube.com https://www.google.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'explorewithsakar.com',
      },
      {
        protocol: 'https',
        hostname: 'www.explorewithsakar.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/**/*': ['./data/**/*'],
    },
  },
  async redirects() {
    return [
      // 1. Packages legacy redirects
      {
        source: '/packages',
        destination: '/experiences',
        permanent: true,
      },
      {
        source: '/packages/:slug',
        destination: '/experiences',
        permanent: true,
      },
      // 2. Specific blog test redirect
      {
        source: '/blog/test-by-diplon',
        destination: '/blog/bound-by-a-thread-eliza-and-sakar',
        permanent: true,
      },
      {
        source: '/blog/hiring-best-city-tour-guide-in-nepal-what-truly-makes-the-difference-beyond-the-sightseeing',
        destination: '/blog/best-city-tour-guide-nepal',
        permanent: true,
      },
      // 3. Old /services/... Experience redirects
      {
        source: '/services/beyond-the-map',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/service/beyond-the-map',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/services/beyond-a-map',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/service/beyond-a-map',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/services/go-beyond',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/service/go-beyond',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/services/spiritual-wellness',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/service/spiritual-wellness',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/services/go-spiritual',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/service/go-spiritual',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/services/go-within',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/service/go-within',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/services/homestays',
        destination: '/experiences/homestays',
        permanent: true,
      },
      {
        source: '/service/homestays',
        destination: '/experiences/homestays',
        permanent: true,
      },
      {
        source: '/services/feel-closer',
        destination: '/experiences/homestays',
        permanent: true,
      },
      {
        source: '/service/feel-closer',
        destination: '/experiences/homestays',
        permanent: true,
      },
      {
        source: '/services/leave-a-mark',
        destination: '/experiences/leave-a-mark',
        permanent: true,
      },
      {
        source: '/service/leave-a-mark',
        destination: '/experiences/leave-a-mark',
        permanent: true,
      },
      {
        source: '/services/custom-journeys',
        destination: '/experiences/custom-journeys',
        permanent: true,
      },
      {
        source: '/service/custom-journeys',
        destination: '/experiences/custom-journeys',
        permanent: true,
      },
      {
        source: '/services/custom-private-journeys',
        destination: '/experiences/custom-journeys',
        permanent: true,
      },
      {
        source: '/service/custom-private-journeys',
        destination: '/experiences/custom-journeys',
        permanent: true,
      },
      {
        source: '/services/culture',
        destination: '/experiences',
        permanent: true,
      },
      {
        source: '/services/trekking',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/services',
        destination: '/experiences',
        permanent: true,
      },
      {
        source: '/service',
        destination: '/experiences',
        permanent: true,
      },
      {
        source: '/services/:slug',
        destination: '/experiences/:slug',
        permanent: true,
      },
      {
        source: '/service/:slug',
        destination: '/experiences/:slug',
        permanent: true,
      },
      // 4. Old singular /experience/... redirects to canonical /experiences/...
      {
        source: '/experience',
        destination: '/experiences',
        permanent: true,
      },
      {
        source: '/experience/all-curated-experiences',
        destination: '/experiences',
        permanent: true,
      },
      {
        source: '/experience/go-beyond',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/experience/beyond-the-map',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/experience/go-spiritual',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/experience/spiritual-wellness',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/experience/go-within',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/experiences/spiritual-wellness',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/experiences/go-spiritual',
        destination: '/experiences/go-within',
        permanent: true,
      },
      {
        source: '/experiences/feel-closer',
        destination: '/experiences/homestays',
        permanent: true,
      },
      {
        source: '/experiences/custom-private-journeys',
        destination: '/experiences/custom-journeys',
        permanent: true,
      },
      {
        source: '/experiences/go-beyond',
        destination: '/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/experiences/responsible',
        destination: '/experiences/leave-a-mark',
        permanent: true,
      },
      {
        source: '/experiences/all-curated-experiences',
        destination: '/experiences',
        permanent: true,
      },
      {
        source: '/experience/feel-closer',
        destination: '/experiences/homestays',
        permanent: true,
      },
      {
        source: '/experience/homestays',
        destination: '/experiences/homestays',
        permanent: true,
      },
      {
        source: '/experience/leave-a-mark',
        destination: '/experiences/leave-a-mark',
        permanent: true,
      },
      {
        source: '/experience/custom-private-journeys',
        destination: '/experiences/custom-journeys',
        permanent: true,
      },
      {
        source: '/experience/custom-journeys',
        destination: '/experiences/custom-journeys',
        permanent: true,
      },
      {
        source: '/experience/:slug',
        destination: '/experiences/:slug',
        permanent: true,
      },
      // 4. Admin blog route alias
      {
        source: '/admin/blog',
        destination: '/admin/blogs',
        permanent: false,
      },
      {
        source: '/admin/blog/:slug*',
        destination: '/admin/blogs/:slug*',
        permanent: false,
      },
      // 5. Legacy admin experience routes → canonical admin paths
      {
        source: '/admin/experiences/go%20within',
        destination: '/admin/experiences/go-within',
        permanent: true,
      },
      {
        source: '/admin/experiences/go-spiritual',
        destination: '/admin/experiences/go-within',
        permanent: true,
      },
      {
        source: '/admin/experiences/spiritual-wellness',
        destination: '/admin/experiences/go-within',
        permanent: true,
      },
      {
        source: '/admin/experiences/leave%20a%20mark',
        destination: '/admin/experiences/leave-a-mark',
        permanent: true,
      },
      {
        source: '/admin/leave-a-mark',
        destination: '/admin/experiences/leave-a-mark',
        permanent: true,
      },
      {
        source: '/admin/beyond-chapters',
        destination: '/admin/experiences/beyond-the-map',
        permanent: true,
      },
      {
        source: '/admin/services',
        destination: '/admin/experiences',
        permanent: true,
      },
      {
        source: '/admin/services/:slug*',
        destination: '/admin/experiences/:slug*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/explore-with-sakar/:path*',
        destination: '/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
