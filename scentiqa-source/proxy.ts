import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Scentiqa kill switch.
 *
 * site_settings.maintenance_mode.value.mode controls the public site:
 *   live         normal site
 *   maintenance  every public page shows the /maintenance page
 *   ghost        every public page returns a blank 503 (looks dead)
 *
 * The switch is FAIL-OPEN by design: any error, missing env var, or bad DB
 * response keeps the site LIVE. Only an explicit mode in the database changes
 * anything, and only a deliberate toggle in /admin can write that value.
 * Legacy { enabled: true } rows are treated as maintenance.
 *
 * Paths that must ALWAYS stay reachable (the way back to the switch):
 *   /admin        the kill switch itself
 *   /login, /auth  sign-in, in case the admin session expired while offline
 *   /api          the toggle endpoint
 *   /maintenance  the offline page (must not rewrite to itself)
 */
const ALWAYS_OPEN = ['/admin', '/api', '/login', '/auth', '/maintenance', '/_next'];

const STATIC_EXT = /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|js|css|woff2?|ttf|map|json|xml|txt|webmanifest)$/i;

type SiteMode = 'live' | 'maintenance' | 'ghost';

/** Normalize the DB value. Unknown shapes and legacy { enabled: false } mean live. */
function normalizeMode(v: unknown): SiteMode {
  const o = v as { mode?: unknown; enabled?: unknown } | null;
  if (o && o.mode === 'ghost') return 'ghost';
  if (o && (o.mode === 'maintenance' || o.enabled === true)) return 'maintenance';
  return 'live';
}

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
    const rows = (await res.json()) as Array<{ value?: unknown }>;
    const mode = normalizeMode(rows?.[0]?.value);
    if (mode === 'ghost') {
      // Blank 503: the site looks dead. Retry-After tells Google to come back later.
      return new NextResponse(null, { status: 503, headers: { 'Retry-After': '3600' } });
    }
    if (mode === 'maintenance') {
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
