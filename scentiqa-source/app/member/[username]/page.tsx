import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMember, getReviewsByMember } from '@/lib/data';
import { Card, EmptyState, SectionHeading } from '@/components/ui';
import { Breadcrumbs, PerfumeCard, StarRating } from '@/components';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username} — Scentiqa member` };
}

export default async function MemberPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const m = await getMember(username);
  if (!m) notFound();
  const reviews = await getReviewsByMember(username);
  const have = m.wardrobePerfumes.have;
  const want = m.wardrobePerfumes.want;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Community' }, { label: `@${m.username}` }]} />
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-6 sm:p-8 dark:border-ink-700/50 dark:bg-ink-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 font-display text-3xl font-bold text-white shadow-lift">
            {m.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold tracking-tight">@{m.username}</h1>
            <p className="text-sm text-stone-500">{m.city} · {m.level}</p>
            {m.bio && <p className="mt-2 max-w-xl text-sm text-stone-600 dark:text-stone-300">{m.bio}</p>}
            {m.favs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.favs.map((f) => <span key={f} className="rounded-full bg-gold-600/15 px-3 py-1 text-xs font-bold text-gold-700 dark:text-gold-300">♥ {f}</span>)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[[have.length, 'collection'], [want.length, 'wishlist'], [reviews.length, 'reviews']].map(([v, l]) => (
              <div key={l as string} className="rounded-2xl bg-stone-900/[0.03] px-4 py-3 dark:bg-white/[0.04]">
                <p className="font-display text-2xl font-bold">{v}</p><p className="text-xs text-stone-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        {m.sig && <p className="mt-5 border-t border-stone-200/70 pt-4 text-sm italic text-stone-400 dark:border-ink-700/50">“{m.sig}”</p>}
      </section>

      {reviews.length > 0 && (
        <section className="mt-10">
          <SectionHeading kicker="Reviews" title="Latest reviews" />
          <div className="space-y-4">
            {reviews.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center justify-between"><StarRating value={r.rating} size={14} />
                  <Link href={`/perfume/${r.perfume.slug}`} className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">{r.perfume.name} →</Link></div>
                <h3 className="mt-2 font-display text-lg font-semibold">{r.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-[15px] text-stone-600 dark:text-stone-300">{r.body}</p>
                {r.verifiedPurchase && <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">✓ Verified purchase</span>}
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <SectionHeading kicker="Shelf" title="In the collection" />
        {have.length === 0 ? <EmptyState icon="🗄️" title="Empty shelf" body="No fragrances added yet." /> : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{have.map((p) => <PerfumeCard key={p.slug} perfume={p} />)}</div>
        )}
      </section>

      {want.length > 0 && (
        <section className="mt-10">
          <SectionHeading kicker="Wishlist" title={`Wants (${want.length})`} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{want.map((p) => <PerfumeCard key={p.slug} perfume={p} />)}</div>
        </section>
      )}
    </div>
  );
}
