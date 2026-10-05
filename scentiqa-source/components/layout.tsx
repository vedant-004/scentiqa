// Site chrome: header, autocomplete search, mobile bottom nav, footer.
'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from './ui';
import { ThemeToggle } from './domain';
import { useAuth } from './auth';
import type { Perfume } from '@/lib/types';

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
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 via-gold-600 to-gold-700 font-display text-lg font-bold text-white shadow-card">
        S
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
export function SearchBar({ autoFocus = false, big = false, onPick }: { autoFocus?: boolean; big?: boolean; onPick?: (slug: string, name: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Perfume[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('scentiqa-recent') || '[]'); } catch { return []; }
  });
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close dropdown on navigation (replaces the setOpen(false) in pick())
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) return;
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.results ?? []);
        setOpen(true); setHi(-1);
      } catch { /* offline */ }
    }, 220);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  const pick = (slug: string, name: string) => {
    if (onPick) { onPick(slug, name); setQ(''); return; }
    try {
      const r = [name, ...recent.filter((x) => x !== name)].slice(0, 5);
      localStorage.setItem('scentiqa-recent', JSON.stringify(r));
      setRecent(r);
    } catch { /* noop */ }
    // Don't call setOpen(false) here — it can unmount the button before
    // the tap registers on mobile. The pathname effect below closes it.
    setQ('');
    router.push(`/perfume/${slug}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, -1)); }
    else if (e.key === 'Enter' && hi >= 0 && results[hi]) pick(results[hi].slug, results[hi].name);
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <div className={cn('flex items-center gap-2 rounded-2xl border border-stone-300/80 bg-white/80 backdrop-blur transition-all duration-200 focus-within:border-gold-600 focus-within:shadow-glow dark:border-ink-700 dark:bg-ink-800/80', big ? 'h-14 px-5' : 'h-11 px-4')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-stone-400"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          value={q} onChange={(e) => { const v = e.target.value; setQ(v); if (!v.trim()) { setResults([]); setHi(-1); } }} onKeyDown={onKey} onFocus={() => setOpen(true)}
          autoFocus={autoFocus} placeholder="Search perfumes, houses, dupes…"
          aria-label="Search perfumes" role="combobox" aria-expanded={open} aria-controls="scentiqa-search-list"
          className={cn('w-full bg-transparent outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500', big ? 'text-lg' : 'text-[15px]')} />
        {q && <button onClick={() => setQ('')} aria-label="Clear search" className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">✕</button>}
      </div>
      {open && (q.trim() ? results.length > 0 : recent.length > 0) && (
        <div id="scentiqa-search-list" role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-900">
          {!q.trim() && recent.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">Recent</p>
              {recent.map((r) => (
                <button key={r} onClick={() => setQ(r)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream-100 dark:hover:bg-white/5">
                  <span className="text-stone-400">↻</span> {r}
                </button>
              ))}
            </div>
          )}
          {results.map((p, i) => (
            <button key={p.slug} onClick={() => pick(p.slug, p.name)} onMouseEnter={() => setHi(i)}
              className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors', hi === i && 'bg-cream-100 dark:bg-white/5')}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400/30 to-gold-600/20 font-display text-sm font-bold text-gold-700 dark:text-gold-300">
                {p.name[0]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                <span className="block truncate text-xs text-stone-400">{p.house}</span>
              </span>
              {p.isDupe && <span className="ml-auto rounded-full bg-gold-600/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-700 dark:text-gold-300">Dupe</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Header ---------- */
const NAV = [
  { href: '/find-alternative', label: 'Find a Dupe' },
  { href: '/houses', label: 'Houses' },
  { href: '/notes', label: 'Notes' },
  { href: '/accords', label: 'Accords' },
  { href: '/sellers', label: 'Sellers' },
  { href: '/news', label: 'News' },
  { href: '/forum', label: 'Community' },
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

/* ---------- Mobile nav drawer ---------- */
function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} aria-label="Menu" aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all hover:bg-stone-900/5 hover:text-stone-900 active:scale-90 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
      </button>
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-stone-950">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 px-4 dark:border-stone-800">
            <span className="font-display text-xl font-bold text-stone-900 dark:text-white">Menu</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 active:scale-90 dark:text-stone-300 dark:hover:bg-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className="block rounded-xl px-4 py-4 text-lg font-semibold text-stone-800 hover:bg-stone-100 active:bg-stone-200 dark:text-stone-100 dark:hover:bg-white/10">
                {n.label}
              </Link>
            ))}
            <Link href="/contact"
              className="mt-2 block rounded-xl border-t border-stone-200 px-4 py-4 text-lg font-semibold text-stone-500 hover:bg-stone-100 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-white/10">
              Contact
            </Link>
          </nav>
        </div>,
        document.body
      )}
    </div>
  );
}

export function Header({ stats }: { stats?: { perfumes: number; houses: number; reviews: number; members: number } }) {
  const { toast } = useToast();
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
        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden w-72 md:block xl:w-96"><SearchBar /></div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <MobileMenu />
          <ThemeToggle />
          <button onClick={() => toast('Connect Supabase to enable accounts & notifications', 'info')} aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all hover:bg-stone-900/5 hover:text-stone-900 active:scale-90 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0" /></svg>
          </button>
          <AuthButton />
        </div>
      </div>
      {stats && <StatsStrip stats={stats} />}
    </header>
  );
}

/* ---------- Fragrantica-style stats strip ---------- */
function StatsStrip({ stats }: { stats: { perfumes: number; houses: number; reviews: number; members: number } }) {
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
            {s.label}: <strong className="font-bold text-stone-700 dark:text-stone-100">{s.value.toLocaleString('en-IN')}</strong>
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
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 140);
      lastY.current = y;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const item = (href: string, label: string, d: string, active: boolean) => (
    <Link key={href + label} href={href} aria-label={label}
      className={cn('flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold transition-colors', active ? 'text-gold-600 dark:text-gold-400' : 'text-stone-400 dark:text-stone-500')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d={d} strokeLinecap="round" strokeLinejoin="round" /></svg>
      {label}
    </Link>
  );
  return (
    <nav aria-label="Mobile" className={cn('fixed inset-x-0 bottom-0 z-[60] border-t border-stone-200/80 bg-white/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl transition-transform duration-300 dark:border-ink-700/60 dark:bg-ink-950/92 md:hidden', hidden && 'translate-y-full')}>
      <div className="flex items-end justify-around px-2 pb-2 pt-1.5">
        {item('/', 'Home', 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5', pathname === '/')}
        {item('/news', 'Discover', 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-3.5-3.5', pathname.startsWith('/news') || pathname.startsWith('/search'))}
        <Link href="/find-alternative" aria-label="Find a dupe"
          className="flex flex-col items-center gap-1 px-3 text-[10px] font-bold text-gold-700 dark:text-gold-300">
          <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 text-white shadow-glow transition-transform active:scale-95">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3h6M10 3v5.5L4.8 18a2.4 2.4 0 0 0 2.1 3.5h10.2a2.4 2.4 0 0 0 2.1-3.5L14 8.5V3" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.5 14h9" strokeLinecap="round" /></svg>
          </span>
          Find Dupe
        </Link>
        {item('/member/arjun_sniffs', 'Wardrobe', 'M4 7h16M4 7v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', pathname.startsWith('/member'))}
        {item(user ? '/account' : '/login', user ? 'Account' : 'Profile', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0', pathname.startsWith('/account') || (!user && pathname.startsWith('/login')))}
      </div>
    </nav>
  );
}

/* ---------- Footer ---------- */
export function Footer({ stats }: { stats: { perfumes: number; houses: number; reviews: number; members: number } }) {
  const cols: Array<{ h: string; links: Array<[string, string]> }> = [
    { h: 'Discover', links: [['Find a dupe', '/find-alternative'], ['All houses', '/houses'], ['Compare', '/compare'], ['Notes encyclopedia', '/notes'], ['Notes library', '/search/notes'], ['Accord finder', '/search/accords'], ['AI Scent Quiz', '/quiz'], ['Complete Collection', '/collection'], ['Hidden Gems', '/hidden-gems'], ['Recommendations', '/finder']] },
    { h: 'Community', links: [['Forum', '/forum'], ['Awards 2026', '/awards/2026'], ['Giveaways', '/giveaways'], ['News', '/news'], ['Member spotlight', '/member/arjun_sniffs']] },
    { h: 'Trust', links: [['Our methodology', '/methodology'], ['Climate protocol', '/climate-protocol'], ['Trust charter', '/trust-charter'], ['Verified sellers', '/sellers'], ['Spot fakes', '/fake-guide'], ['About', '/about']] },
    { h: 'Company', links: [['Contact', '/contact'], ['Terms', '/terms'], ['Privacy', '/privacy'], ['Log in', '/login']] },
  ];
  return (
    <footer className="mt-20 border-t border-stone-200/70 bg-white/60 dark:border-ink-700/50 dark:bg-ink-900/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
              <p className="font-display text-2xl font-bold text-stone-900 dark:text-white">{Number(v).toLocaleString('en-IN')}</p>
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
