import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Scentiqa kill switch.
 *
 * When the `maintenance_mode` site setting is enabled, every public page is
 * replaced with the /maintenance page. The switch is FAIL-OPEN by design:
 * any error, missing env var, or bad DB response keeps the site LIVE.
 * Only an explicit `enabled: true` in the database takes the site down,
 * and only a deliberate toggle in /admin can write that value.
 *
 * Paths that must ALWAYS stay reachable (the way back to the switch):
 *   /admin        the kill switch itself
 *   /login, /auth  sign-in, in case the admin session expired while offline
 *   /api          the toggle endpoint
 *   /maintenance  the offline page (must not rewrite to itself)
 */
const ALWAYS_OPEN = ['/admin', '/api', '/login', '/auth', '/maintenance', '/_next'];

const STATIC_EXT = /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|js|css|woff2?|ttf|map|json|xml|txt|webmanifest)$/i;

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (ALWAYS_OPEN.some((p) => path === p || path.startsWith(p + '/'))) return NextResponse.next();
  if (STATIC_EXT.test(path)) return NextResponse.next();

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.next(); // fail open
    const res = await fetch(`${url}/rest/v1/site_settings?key=eq.maintenance_mode&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return NextResponse.next(); // fail open
    const rows = (await res.json()) as Array<{ value?: { enabled?: boolean } }>;
    if (rows?.[0]?.value?.enabled === true) {
      const dest = req.nextUrl.clone();
      dest.pathname = '/maintenance';
      dest.search = '';
      const out = NextResponse.rewrite(dest);
      out.headers.set('Retry-After', '3600');
      return out;
    }
  } catch {
    // Fail open: a broken switch must never take the site down.
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
