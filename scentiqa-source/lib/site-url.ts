// Single source of truth for the site's public URL.
// Set NEXT_PUBLIC_SITE_URL=https://scentarchy.com in Vercel when the domain goes live.
// Until then it falls back to the current production URL.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://scentarchy.com';
