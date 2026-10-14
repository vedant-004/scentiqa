// Site chrome: header, autocomplete search, mobile bottom nav, footer.
'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn, inr } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ThemeToggle, NewsletterSignup, StarRating } from './domain';
import { useAuth } from './auth';
import { NotificationBell } from './notifications';

export const isDemoMode = !isSupabaseConfigured();

export function DemoPill() {
  if (!isDemoMode) return null;
  return (
    <Link href="/methodology" title="This demo build shows illustrative sample data — connect Supabase for live data"
      className="whitespace-nowrap rounded-full border border-dashed border-gold-600/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 transition-colors hover:bg-gold-600/10 dark:text-gold-300">
      Demo data
    </Link>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="wordmark flex items-center gap-2.5" aria-label="Scentiqa home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 via-gold-600 to-gold-700 text-white shadow-card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v4M14 2v4M10 2h4" strokeLinecap="round" /><rect x="9" y="6" width="6" height="3" rx="0.5" /><path d="M7 10h10l1 9.2a1.8 1.8 0 0 1-1.8 1.8H7.8A1.8 1.8 0 0 1 6 19.2L7 10z" strokeLinejoin="round" /><path d="M7.5 14h9" strokeLinecap="round" opacity="0.6" /></svg>
      </span>
      {!compact && (
        <span className="font-display text-[22px] font-bold tracking-tight text-stone-900 dark:text-white">
          Scentiqa
        </span>
      )}
    </Link>
  );
}

/* ---------- Autocomplete search ---------- */

/** What /api/search returns today, plus the richer fields the backend will add soon. */
interface SearchResult {
  slug: string;
  name: string;
  house?: string | null;
  isDupe?: boolean;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  /** Today's field name for the lowest INR price. */
  price?: number | null;
  /** Alternate field name the backend may use. */
  lowestPriceInr?: number | null;
  bottleImage?: string | null;
  dupeCount?: number | null;
  matchedField?: string | null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Bold the matched substring (gold, case-insensitive). */
function MatchedName({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-transparent font-bold text-gold-700 dark:text-gold-300">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Drop a redundant house suffix from the display name ("Aventus by Creed" etc.). */
function displayNameOf(name: string, house?: string | null): string {
  const h = (house ?? '').trim();
  if (h && name.toLowerCase().endsWith(h.toLowerCase())) {
    return name.slice(0, name.length - h.length).trim().replace(/[-–—·•|]\s*$/, '').trim();
  }
  return name;
}

/** Curated fallback when /api/search/trending fails or is empty. */
const FALLBACK_TRENDING = ['Aventus', 'Sauvage', 'Baccarat Rouge 540', 'Khamrah', 'Tobacco Vanille', 'Erba Pura'];

export function SearchBar({ autoFocus = false, big = false, initialQuery, onPick }: { autoFocus?: boolean; big?: boolean; initialQuery?: string; onPick?: (slug: string, name: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQuery ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const { user } = useAuth();
  // Namespace recent searches by signed-in user so shared devices don't leak history.
  const recentKey = `scentiqa-recent:${user?.id ?? 'anon'}`;
  const [recent, setRecent] = useState<string[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [trending, setTrending] = useState<string[]>([]);
  const trendingCache = useRef<{ at: number; data: string[] } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqId = useRef(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const showEmptyPanel = focused && !q.trim() && (recent.length > 0 || trending.length > 0);
  const showPanel = open && (q.trim() ? true : showEmptyPanel);
  // "Did you mean" — only when the backend suggests something different.
  const dym = didYouMean && didYouMean.toLowerCase() !== q.trim().toLowerCase() ? didYouMean : null;
  const popularChips = (trending.length ? trending : FALLBACK_TRENDING).slice(0, 4);

  // Outside click (mousedown) — the portal menu is outside boxRef, so check both.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
      setFocused(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Close dropdown on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Load this user's recent searches (re-runs when sign-in state changes).
  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(recentKey) || '[]')); }
    catch { setRecent([]); }
  }, [recentKey]);

  // Debounced search with stale-result protection: clear immediately, abort in-flight.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    abortRef.current?.abort();
    if (!q.trim()) { setResults([]); setHi(-1); setLoading(false); setDidYouMean(null); return; }
    setLoading(true);
    setResults([]);
    setHi(-1);
    setDidYouMean(null);
    timer.current = setTimeout(async () => {
      const id = ++reqId.current;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, { signal: ctrl.signal });
        const j = await r.json();
        if (reqId.current !== id || ctrl.signal.aborted) return;
        setResults(j.results ?? []);
        setDidYouMean(typeof j.didYouMean === 'string' && j.didYouMean.trim() ? j.didYouMean : null);
        setHi(-1);
        setOpen(true);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') { /* offline — keep silent */ }
      } finally {
        if (reqId.current === id) setLoading(false);
      }
    }, 220);
    return () => { if (timer.current) clearTimeout(timer.current); abortRef.current?.abort(); };
  }, [q]);

  // Prefetch the top suggestions so tapping one navigates instantly instead
  // of waiting on a cold ISR render + Supabase round trips.
  useEffect(() => {
    for (const p of results.slice(0, 3)) router.prefetch(`/perfume/${p.slug}`);
  }, [results, router]);

  // Position the portal menu under the input; re-position on scroll/resize.
  useEffect(() => {
    if (!showPanel) { setMenuPos(null); return; }
    const place = () => {
      const r = boxRef.current?.getBoundingClientRect();
      if (r) setMenuPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX, width: r.width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [showPanel, q, results.length]);

  const loadTrending = async () => {
    if (trendingCache.current && Date.now() - trendingCache.current.at < 60000) {
      setTrending(trendingCache.current.data);
      return;
    }
    let data: string[] = FALLBACK_TRENDING;
    try {
      const r = await fetch('/api/search/trending');
      const j = await r.json();
      const list = Array.isArray(j.trending) ? j.trending.filter((x: unknown) => typeof x === 'string') : [];
      if (list.length) data = list.slice(0, 6);
    } catch { /* offline — curated fallback */ }
    trendingCache.current = { at: Date.now(), data };
    setTrending(data);
  };

  // Pressing "/" anywhere (outside a text field) focuses the search input.
  useEffect(() => {
    const onSlash = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onSlash);
    return () => document.removeEventListener('keydown', onSlash);
  }, []);

  const goToSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    // Don't call setOpen(false) here — it can unmount the button before the
    // tap registers (especially on mobile). The pathname effect closes the menu.
    setQ('');
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  const pick = (slug: string, name: string) => {
    try {
      const r = [name, ...recent.filter((x) => x !== name)].slice(0, 5);
      localStorage.setItem(recentKey, JSON.stringify(r));
      setRecent(r);
    } catch { /* noop */ }
    // onPick closes the wrapping overlay (e.g. header search on mobile).
    // When onPick is provided (e.g. Compare page), the caller handles the
    // selection — do NOT navigate to the perfume page.
    if (onPick) {
      onPick(slug, name);
      setQ('');
      setOpen(false);
      return;
    }
    // Don't call the inner setOpen(false) here — it can unmount the button
    // before the tap registers on mobile. The pathname effect closes the menu.
    setQ('');
    router.push(`/perfume/${slug}`);
  };

  const clearRecent = () => {
    try { localStorage.removeItem(recentKey); } catch { /* noop */ }
    setRecent([]);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) { setOpen(true); setHi((h) => (h + 1) % results.length); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) setHi((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && hi >= 0 && results[hi]) {
      pick(results[hi].slug, results[hi].name);
    } else if (e.key === 'Enter') {
      goToSearch(q);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const menu = showPanel && menuPos && typeof document !== 'undefined' ? createPortal(
    <div
      ref={menuRef}
      id="scentiqa-search-list"
      role="listbox"
      aria-label="Search suggestions"
      className="z-[100] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-ink-600 dark:bg-ink-900"
      style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, width: menuPos.width }}
    >
      {!q.trim() && (
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {recent.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center justify-between px-3 py-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Recent</p>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearRecent}
                  className="text-[11px] font-semibold text-gold-700 hover:underline dark:text-gold-300"
                >
                  Clear
                </button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setQ(r)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream-100 dark:hover:bg-white/5"
                >
                  <span className="text-stone-400" aria-hidden="true">↻</span>
                  <span className="truncate">{r}</span>
                </button>
              ))}
            </div>
          )}
          {trending.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">Trending</p>
              {trending.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setQ(term)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream-100 dark:hover:bg-white/5"
                >
                  <span className="text-gold-600 dark:text-gold-400" aria-hidden="true">↗</span>
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {q.trim() && (
        <>
          <div className="max-h-[60vh] overflow-y-auto">
            {dym && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setQ(dym)}
                className="flex min-h-[48px] w-full items-center gap-2 border-b border-stone-200 px-4 py-2.5 text-left text-sm hover:bg-cream-100 dark:border-ink-700 dark:hover:bg-white/5"
              >
                <span className="text-gold-600 dark:text-gold-400" aria-hidden="true">✎</span>
                <span className="truncate">
                  Did you mean <span className="font-bold text-gold-700 dark:text-gold-300">&ldquo;{dym}&rdquo;</span>?
                </span>
              </button>
            )}
            {loading && (
              <p className="px-4 py-4 text-sm text-stone-500 dark:text-stone-400">Searching&hellip;</p>
            )}
            {!loading && results.length === 0 && (
              <div className="px-4 py-4">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                  No perfumes found for &ldquo;{q.trim()}&rdquo;
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Try one of these instead:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {popularChips.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setQ(term)}
                      className="min-h-[44px] rounded-full border border-stone-300/70 px-3.5 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:border-gold-600 hover:text-gold-700 dark:border-ink-700 dark:text-stone-300 dark:hover:border-gold-400 dark:hover:text-gold-300"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {results.map((p, i) => {
              const price = p.price ?? p.lowestPriceInr ?? null;
              const ratingAvg = typeof p.ratingAvg === 'number' ? p.ratingAvg : null;
              const ratingCount = typeof p.ratingCount === 'number' ? p.ratingCount : 0;
              const dupeCount = typeof p.dupeCount === 'number' ? p.dupeCount : 0;
              const name = displayNameOf(p.name, p.house);
              return (
                <button
                  key={p.slug}
                  type="button"
                  role="option"
                  id={`scentiqa-search-opt-${i}`}
                  aria-selected={hi === i}
                  onClick={() => pick(p.slug, p.name)}
                  onMouseEnter={() => setHi(i)}
                  className={cn(
                    'flex min-h-[56px] w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                    hi === i
                      ? 'bg-gold-600/10 outline outline-1 outline-gold-600/40 dark:bg-gold-500/10 dark:outline-gold-400/40'
                      : 'hover:bg-cream-100 dark:hover:bg-white/5'
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-100 dark:bg-ink-800">
                    {p.bottleImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.bottleImage} alt="" loading="lazy" className="h-full w-full object-contain" />
                    ) : (
                      <span className="font-display text-sm font-bold text-gold-700 dark:text-gold-300">
                        {(name || '?')[0]}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      <MatchedName text={name} query={q} />
                    </span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-stone-400">
                      {p.house && <span className="truncate">{p.house}</span>}
                      {ratingAvg !== null && ratingAvg > 0 && ratingCount > 0 && (
                        <span className="flex shrink-0 items-center gap-1">
                          <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">·</span>
                          <StarRating value={ratingAvg} size={11} />
                          <span>({ratingCount.toLocaleString('en-IN')})</span>
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="ml-auto flex shrink-0 flex-col items-end gap-1">
                    {price != null && price > 0 && (
                      <span className="text-[13px] font-bold text-stone-800 dark:text-stone-100">
                        {inr(price)}
                      </span>
                    )}
                    {(dupeCount > 0 || p.isDupe) && (
                      <span className="flex items-center gap-1.5">
                        {dupeCount > 0 && (
                          <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {dupeCount} {dupeCount === 1 ? 'dupe' : 'dupes'}
                          </span>
                        )}
                        {p.isDupe && (
                          <span className="rounded-full bg-gold-600/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-700 dark:text-gold-300">
                            Dupe
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
              onMouseDown={(e) => e.preventDefault()}
            onClick={() => goToSearch(q)}
            className="flex min-h-[48px] w-full items-center justify-between border-t border-stone-200 px-4 py-3 text-sm font-semibold text-gold-700 transition-colors hover:bg-cream-100 dark:border-ink-700 dark:text-gold-300 dark:hover:bg-white/5"
          >
            <span className="truncate">View all results for &ldquo;{q.trim()}&rdquo;</span>
            <span aria-hidden="true" className="ml-2 shrink-0">→</span>
          </button>
        </>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={boxRef} className="relative w-full">
      <div className={cn('flex items-center gap-2 rounded-2xl border border-stone-300/80 bg-white transition-all duration-200 dark:border-ink-700 dark:bg-ink-800', big ? 'h-14 px-5' : 'h-11 px-4')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-stone-400"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          ref={inputRef}
          value={q} onChange={(e) => { const v = e.target.value; setQ(v); }} onKeyDown={onKey}
          onFocus={() => { setFocused(true); setOpen(true); if (!q.trim()) loadTrending(); }}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus} placeholder="Search perfumes, houses, dupes…"
          aria-label="Search perfumes" role="combobox" aria-expanded={open} aria-controls="scentiqa-search-list"
          aria-activedescendant={hi >= 0 ? `scentiqa-search-opt-${hi}` : undefined}
          autoComplete="off"
          className={cn('w-full bg-transparent outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500', big ? 'text-lg' : 'text-[15px]')} />
        {loading && (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-gold-600 dark:border-ink-600 dark:border-t-gold-400" aria-label="Loading suggestions" />
        )}
        {!q && !focused && !loading && (
          <kbd className="hidden shrink-0 items-center rounded-md border border-stone-300/80 px-1.5 py-0.5 text-[11px] font-semibold text-stone-400 sm:flex dark:border-ink-600 dark:text-stone-500" aria-hidden="true">/</kbd>
        )}
        {q && !loading && (
          <button onClick={() => { setQ(''); loadTrending(); }} aria-label="Clear search" className="shrink-0 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">✕</button>
        )}
      </div>
      {menu}
    </div>
  );
}

/* ---------- Header ---------- */
const NAV = [
  { href: '/finder', label: '✨ Find Your Scent' },
  { href: '/find-alternative', label: 'Find a Dupe' },
  { href: '/battles', label: 'Battles' },
  { href: '/climate', label: 'Heat Lab' },
  { href: '/houses', label: 'Houses' },
  { href: '/notes', label: 'Notes' },
  { href: '/accords', label: 'Accords' },
  { href: '/sellers', label: 'Sellers' },
  { href: '/news', label: 'News' },
  { href: '/forum', label: 'Community' },
  { href: '/requests', label: 'Requests' },
  { href: '/sniff', label: 'Sniff Guide' },
  { href: '/awards/2026', label: 'Awards' },
  { href: '/about', label: 'About' },
];
/* ---------- Auth-aware nav button ---------- */
function AuthButton() {
  const { user, loading } = useAuth();
  if (loading) return <span className="ml-1 inline-flex h-10 w-10 animate-pulse rounded-full bg-stone-200 dark:bg-ink-700" />;
  if (!user) {
    return (
      <Link href="/login" aria-label="Log in"
        className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-white transition-all hover:bg-stone-700 active:scale-95 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0" strokeLinecap="round" /></svg>
      </Link>
    );
  }
  const initial = (user.email ?? 'S')[0].toUpperCase();
  // Direct link to dashboard — no dropdown. The /account page has the
  // sign-out button. Simpler and bulletproof on mobile.
  return (
    <Link href="/account" aria-label="My dashboard"
      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-gold-600 font-display text-sm font-bold text-white shadow-card transition-transform hover:scale-105 active:scale-95">
      {initial}
    </Link>
  );
}

/* ---------- Header search: icon button opening a full search overlay ---------- */
function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close overlay on navigation
  useEffect(() => { setOpen(false); }, [pathname]);
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Search"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all hover:bg-stone-900/5 hover:text-stone-900 active:scale-90 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-0 mx-auto max-w-2xl px-4 pt-20 sm:pt-24">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-ink-900">
              <SearchBar autoFocus big onPick={() => setOpen(false)} />
            </div>
            <p className="mt-3 text-center text-xs text-white/70">Press <kbd className="rounded bg-white/20 px-1.5 py-0.5 font-mono">Esc</kbd> to close</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ---------- Mobile nav: hamburger toggling a full overlay menu ---------- */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close overlay on navigation
  useEffect(() => { setOpen(false); }, [pathname]);
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all hover:bg-stone-900/5 hover:text-stone-900 active:scale-90 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
        )}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl dark:bg-ink-900">
            <div className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4 dark:border-ink-700/50">
              <span className="font-display text-lg font-bold text-stone-900 dark:text-white">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-stone-900/5 hover:text-stone-900 active:scale-90 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-stone-700 transition-colors hover:bg-stone-900/5 hover:text-stone-900 active:bg-stone-900/10 dark:text-stone-200 dark:hover:bg-white/10 dark:hover:text-white">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function Header({ stats }: { stats?: { perfumes: number; houses: number; reviews: number; members: number } }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={cn('sticky top-0 z-[60] border-b transition-all duration-300',
      scrolled ? 'border-stone-200/70 bg-cream-50/85 shadow-card backdrop-blur-xl dark:border-ink-700/50 dark:bg-ink-950/85' : 'border-transparent bg-cream-50/60 backdrop-blur dark:bg-ink-950/60')}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Wordmark />
        <DemoPill />
        <div className="relative ml-2 hidden min-w-0 flex-1 lg:block">
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Primary" style={{ scrollbarWidth: 'none' }}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
          {/* Fade indicator showing the nav is scrollable */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cream-50 to-transparent dark:from-ink-950" aria-hidden="true" />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <HeaderSearch />
          <MobileMenu />
          <ThemeToggle />
          <NotificationBell />
          <AuthButton />
        </div>
      </div>
      {stats && <StatsStrip stats={stats} />}
    </header>
  );
}

/* ---------- Fragrantica-style stats strip ---------- */
function StatsStrip({ stats }: { stats: { perfumes: number; houses: number; reviews: number; members: number } }) {
  // Labels always render; unavailable counts show "—" (never a bare number without a label).
  const items = [
    { label: 'Perfumes', value: stats.perfumes, dot: 'bg-amber-400' },
    { label: 'Houses', value: stats.houses, dot: 'bg-gold-500' },
    { label: 'Reviews', value: stats.reviews, dot: 'bg-sky-400' },
    { label: 'Members', value: stats.members, dot: 'bg-emerald-400' },
  ];
  return (
    <div className="border-t border-stone-200/50 bg-stone-900/[0.02] dark:border-ink-700/40 dark:bg-black/30">
      <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-1.5 text-[11px] font-medium text-stone-500 sm:gap-5 sm:px-6 dark:text-stone-400">
        {items.map((s) => (
          <span key={s.label} className="flex shrink-0 items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', s.dot)} aria-hidden="true" />
            {s.label}: <strong className="font-bold text-stone-700 dark:text-stone-100">{s.value > 0 ? s.value.toLocaleString('en-IN') : '—'}</strong>
          </span>
        ))}
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 sm:flex">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          India-first perfume data
        </span>
      </div>
    </div>
  );
}

/* ---------- Mobile bottom nav ---------- */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  // Always visible — no hide-on-scroll (users found it confusing).
  const item = (href: string, label: string, d: string, active: boolean) => (
    <Link key={href + label} href={href} aria-label={label}
      className={cn('flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold transition-colors', active ? 'text-gold-600 dark:text-gold-400' : 'text-stone-400 dark:text-stone-500')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d={d} strokeLinecap="round" strokeLinejoin="round" /></svg>
      {label}
    </Link>
  );
  return (
    <nav aria-label="Mobile" className="scentiqa-site-mobile-nav fixed inset-x-0 bottom-0 z-[60] border-t border-stone-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-ink-700/60 dark:bg-ink-950/95 md:hidden">
      <div className="flex items-end justify-around px-2 pb-2 pt-1.5">
        {item('/', 'Home', 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5', pathname === '/')}
        {item('/news', 'Discover', 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-3.5-3.5', pathname.startsWith('/news') || pathname.startsWith('/search'))}
        <Link href="/finder" aria-label="AI Scent Finder"
          className="flex flex-col items-center gap-1 px-3 text-[10px] font-bold text-gold-700 dark:text-gold-300">
          <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 text-white shadow-glow transition-transform active:scale-95">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          AI Finder
        </Link>
        {item('/wardrobe', 'Wardrobe', 'M4 7h16M4 7v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', pathname.startsWith('/wardrobe'))}
        {item(user ? '/account' : '/login', user ? 'Account' : 'Profile', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0', pathname.startsWith('/account') || (!user && pathname.startsWith('/login')))}
      </div>
    </nav>
  );
}

/* ---------- Footer ---------- */
export function Footer({ stats }: { stats: { perfumes: number; houses: number; reviews: number; members: number } }) {
  const cols: Array<{ h: string; links: Array<[string, string]> }> = [
    { h: 'Discover', links: [['Find a dupe', '/find-alternative'], ['Scent Battles', '/battles'], ['Heat Lab', '/climate'], ['Blind-Buy Guide', '/blindbuy'], ['Wear Diary', '/diary'], ['All houses', '/houses'], ['Compare', '/compare'], ['Notes encyclopedia', '/notes'], ['Notes library', '/search/notes'], ['Accord finder', '/search/accords'], ['AI Scent Quiz', '/quiz'], ['Complete Collection', '/collection'], ['Hidden Gems', '/hidden-gems'], ['AI Scent Finder', '/finder']] },
    { h: 'Community', links: [['Forum', '/forum'], ['Awards 2026', '/awards/2026'], ['Giveaways', '/giveaways'], ['News', '/news'], ['Member spotlight', '/members']] },
    { h: 'Trust', links: [['Our methodology', '/methodology'], ['Climate protocol', '/climate-protocol'], ['Trust charter', '/trust-charter'], ['Verified sellers', '/sellers'], ['Spot fakes', '/fake-guide'], ['About', '/about']] },
    { h: 'Company', links: [['Contact', '/contact'], ['Terms', '/terms'], ['Privacy', '/privacy'], ['Log in', '/login']] },
  ];
  return (
    <footer className="scentiqa-site-footer mt-20 border-t border-stone-200/70 bg-white/60 dark:border-ink-700/50 dark:bg-ink-900/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10 grid gap-6 rounded-2xl border border-stone-200/70 bg-cream-100/60 p-6 md:grid-cols-[1fr_auto] md:items-center dark:border-ink-700/50 dark:bg-white/[0.03]">
          <NewsletterSignup source="footer" compact />
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {cols.map((c) => (
            <div key={c.h}>
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">{c.h}</h4>
              <ul className="space-y-2">
                {c.links.map(([label, href]) => (
                  <li key={href + label}><Link href={href} className="text-sm text-stone-600 transition-colors hover:text-gold-700 dark:text-stone-300 dark:hover:text-gold-300">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 rounded-2xl border border-stone-200/70 bg-cream-100/60 p-5 sm:grid-cols-4 dark:border-ink-700/50 dark:bg-white/[0.03]">
          {[
            [stats.perfumes, 'perfumes indexed'],
            [stats.reviews, 'community reviews'],
            [stats.members, 'members'],
            [stats.houses, 'houses tracked'],
          ].map(([v, l]) => (
            <div key={l as string} className="text-center">
              <p className="font-display text-2xl font-bold text-stone-900 dark:text-white">{Number(v) > 0 ? Number(v).toLocaleString('en-IN') : '—'}</p>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-stone-200/60 pt-6 sm:flex-row dark:border-ink-700/40">
          <Wordmark compact />
          <p className="text-center text-xs text-stone-400">
            © 2026 Scentiqa. Independent reviews — never sponsored placements.
            {isDemoMode && <span className="mt-1 block">Demo build: scores, prices and community content shown are illustrative samples.</span>}
          </p>
          <div className="flex gap-2">
            {['X', 'IG', 'YT'].map((s) => (
              <span key={s} className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900/5 text-xs font-bold text-stone-500 dark:bg-white/10 dark:text-stone-300">{s}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="h-16 md:hidden" />
    </footer>
  );
}
