import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { StatCard, SectionTitle } from './components';

async function count(table: string, filter = '') {
  const c = getSupabaseServer(true)!;
  let q = c.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = q.or(filter);
  const { count: n } = await q;
  return n ?? 0;
}

export const metadata = { title: 'Admin dashboard', description: 'Scentiqa control room.' };

export default async function AdminDashboard() {
  const c = getSupabaseServer(true);
  if (!c)
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
        <p className="font-bold">SUPABASE_SERVICE_ROLE_KEY is not configured.</p>
        <p className="mt-1 text-stone-600 dark:text-stone-300">Add it in Vercel → Settings → Environment Variables (value: your Supabase service_role key), then redeploy.</p>
      </div>
    );

  const [perfumes, houses, prices, sellers, users, reviews, dupes, pendingReports] = await Promise.all([
    count('perfumes'), count('houses'), count('prices'), count('sellers'),
    count('users'), count('reviews'), count('dupe_relationships'),
    c.from('reports').select('id', { count: 'exact', head: true }).eq('resolved', false).then((r) => r.count ?? 0),
  ]);

  const [noPhoto, noStory, noAccords, noDesc, unverifiedSellers] = await Promise.all([
    count('perfumes', 'bottle_image_url.is.null'),
    count('perfumes', 'scent_story.is.null'),
    count('perfumes', 'accords.eq.[]'),
    count('perfumes', 'description.is.null'),
    c.from('sellers').select('id', { count: 'exact', head: true }).eq('verified', false).then((r) => r.count ?? 0),
  ]);

  const { data: recentPerfumes } = await c.from('perfumes').select('id,name,slug,created_at').order('created_at', { ascending: false }).limit(8);
  const { data: recentReviews } = await c.from('reviews').select('id,title,rating,created_at,perfumes(name)').order('created_at', { ascending: false }).limit(6);
  const { data: recentUsers } = await c.from('users').select('id,username,created_at').order('created_at', { ascending: false }).limit(5);

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Catalog at a glance</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Perfumes" value={perfumes} href="/admin/perfumes" />
          <StatCard label="Houses" value={houses} href="/admin/houses" />
          <StatCard label="Prices" value={prices} href="/admin/sellers" />
          <StatCard label="Sellers" value={sellers} href="/admin/sellers" />
          <StatCard label="Dupe mappings" value={dupes} href="/admin/dupes" />
          <StatCard label="Reviews" value={reviews} href="/admin/reviews" />
          <StatCard label="Users" value={users} href="/admin/users" />
          <StatCard label="Pending reports" value={pendingReports} href="/admin/reports" accent={pendingReports > 0 ? 'text-red-700 dark:text-red-400' : undefined} />
        </div>
      </section>

      <section>
        <SectionTitle action={<Link href="/admin/health" className="text-sm font-bold text-gold-700 hover:underline dark:text-gold-300">Open health center →</Link>}>
          Needs attention
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Missing photo', noPhoto], ['Missing scent story', noStory], ['Missing accords', noAccords],
            ['Missing description', noDesc], ['Unverified sellers', unverifiedSellers],
          ].map(([label, n]) => (
            <Link key={label as string} href={label === 'Unverified sellers' ? '/admin/sellers' : '/admin/health'}
              className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="font-display text-2xl font-bold text-amber-800 dark:text-amber-300">{(n as number).toLocaleString('en-IN')}</p>
              <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle action={<Link href="/admin/perfumes/new" className="text-sm font-bold text-gold-700 hover:underline dark:text-gold-300">+ Add perfume</Link>}>
            Newest perfumes
          </SectionTitle>
          <ul className="space-y-2">
            {(recentPerfumes ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl border border-stone-200/70 bg-white/60 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                <Link href={`/admin/perfumes/${p.id}`} className="font-semibold hover:text-gold-700 dark:hover:text-gold-300">{p.name}</Link>
                <Link href={`/perfume/${p.slug}`} className="text-xs text-stone-400 hover:text-stone-600">view →</Link>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-8">
          <section>
            <SectionTitle>Latest reviews</SectionTitle>
            <ul className="space-y-2">
              {(recentReviews ?? []).map((r: { id: string; title: string; rating: number; perfumes: { name: string } | { name: string }[] | null }) => (
                <li key={r.id} className="rounded-xl border border-stone-200/70 bg-white/60 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="font-bold text-gold-700 dark:text-gold-300">{r.rating}★</span>{' '}
                  <span className="font-semibold">{r.title}</span>{' '}
                  <span className="text-xs text-stone-400">on {Array.isArray(r.perfumes) ? r.perfumes[0]?.name : r.perfumes?.name}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <SectionTitle>Newest members</SectionTitle>
            <ul className="space-y-2">
              {(recentUsers ?? []).map((u: { id: string; username: string }) => (
                <li key={u.id} className="rounded-xl border border-stone-200/70 bg-white/60 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="font-semibold">{u.username}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
