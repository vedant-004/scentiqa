import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminUser, isAdminConfigured } from '@/lib/admin';

// Admin pages read the auth session + service-role key at request time.
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '◈' },
  { href: '/admin/perfumes', label: 'Perfumes', icon: '⚗' },
  { href: '/admin/houses', label: 'Houses', icon: '⌂' },
  { href: '/admin/sellers', label: 'Sellers & Prices', icon: '₹' },
  { href: '/admin/dupes', label: 'Dupe mappings', icon: '⇄' },
  { href: '/admin/reviews', label: 'Reviews', icon: '✎' },
  { href: '/admin/reports', label: 'Reports', icon: '⚑' },
  { href: '/admin/users', label: 'Users', icon: '◉' },
  { href: '/admin/health', label: 'Data health', icon: '♥' },
  { href: '/admin/articles', label: 'Articles', icon: '📰' },
  { href: '/admin/battles', label: 'Battles', icon: '⚔' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
  { href: '/admin/export', label: 'Export', icon: '⤓' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) redirect('/admin/setup');
  const admin = await getAdminUser();
  if (!admin) redirect('/login?next=/admin');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-300">Scentiqa control room</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Admin</h1>
        </div>
        <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          {admin.email}
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-52 lg:shrink-0">
          <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-4 lg:flex-col">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-stone-200/70 bg-white/60 px-3 py-2 text-sm font-semibold text-stone-600 transition hover:border-gold-400 hover:text-stone-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-300 dark:hover:text-stone-100"
              >
                <span aria-hidden>{n.icon}</span> {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
