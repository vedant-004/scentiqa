import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Block MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions policy — disable unused browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Force HTTPS (Vercel terminates TLS; max-age 1 year)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Basic XSS protection for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Sitemap/robots: cache briefly so crawlers get fresh data
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' }],
      },
    ];
  },
};

export default nextConfig;
