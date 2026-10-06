// Single source of truth for the site's public URL.
// Set NEXT_PUBLIC_SITE_URL=https://scentiqa.in in Vercel when the domain goes live.
// Until then it falls back to the current production URL.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://scentiqa.vercel.app';
