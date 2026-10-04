import { notFound } from 'next/navigation';
import { getAllHouseSlugs, getHouse } from '@/lib/data';
import { HOUSE_TYPE_LABEL } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Badge, SectionHeading } from '@/components/ui';
import { Breadcrumbs, HouseCard, PerfumeCard, ScoreBadge } from '@/components';

export async function generateStaticParams() {
  const slugs = await getAllHouseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = await getHouse(slug);
  if (!h) return { title: 'Not found' };
  return {
    title: `${h.name} Perfumes & Dupes in India`,
    description: `${h.name} — ${h.perfumeCount} fragrances. ${h.avgSimilarity ? `Average lab similarity ${h.avgSimilarity}%.` : ''} Prices in INR from verified sellers.`,
  };
}

const TYPE_STYLES: Record<string, string> = {
  indian_clone: 'bg-gold-600/15 text-gold-700 dark:text-gold-300',
  attar_maker: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  niche: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  designer: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  middle_eastern: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  artisan: 'bg-stone-500/15 text-stone-600 dark:text-stone-300',
  mass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300',
};

export default async function HousePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = !isSupabaseConfigured();
  const h = await getHouse(slug);
  if (!h) notFound();

  const dupes = h.perfumes.filter((p) => p.isDupe);
  const originals = h.perfumes.filter((p) => !p.isDupe);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Houses', href: '/houses' }, { label: h.name }]} />

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/70 bg-white p-6 sm:p-10 dark:border-ink-700/50 dark:bg-ink-900">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-300/20 via-transparent to-transparent dark:from-gold-600/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-gold-500 to-gold-700 font-display text-3xl font-bold text-white shadow-lift">
            {h.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={TYPE_STYLES[h.type]}>{HOUSE_TYPE_LABEL[h.type]}</Badge>
              <span className="text-sm text-stone-400">{h.country}{h.region ? ` · ${h.region}` : ''}</span>
              {h.needsVerification && <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">Details to verify</Badge>}
              {h.perfumes.some((p) => p.real) && (
                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                  Real catalog data · {h.perfumes.filter((p) => p.real).length} products researched {(() => { const ds = [...new Set(h.perfumes.filter((p) => p.real && p.observedAt).map((p) => p.observedAt as string))].sort(); return ds.map((d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })).join(' & ') || '30 Sep 2026'; })()}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{h.name}</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{h.description}</p>
            {h.website && (
              <a href={h.website} target="_blank" rel="noopener" className="mt-3 inline-block text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">Official website →</a>
            )}
          </div>
          {h.avgSimilarity !== null && (
            <div className="shrink-0"><ScoreBadge score={h.avgSimilarity} size="lg" label={demo ? "Avg lab match · sample" : "Avg lab match"} /></div>
          )}
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [h.perfumeCount, 'fragrances'],
            [`${h.earliestYear}–${h.latestYear}`, 'active years'],
            [`${h.trustRating}/5`, 'trust rating'],
            [h.foundedYear, 'founded'],
          ].map(([v, l]) => (
            <div key={l as string} className="rounded-2xl bg-stone-900/[0.03] p-4 text-center dark:bg-white/[0.04]">
              <p className="font-display text-2xl font-bold">{v}</p>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog */}
      {dupes.length > 0 && (
        <section className="mt-12">
          <SectionHeading kicker="Dupe lab" title={`Inspired fragrances (${dupes.length})`} />
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            {dupes.map((p) => <PerfumeCard key={p.slug} perfume={p} />)}
          </div>
        </section>
      )}
      {originals.length > 0 && (
        <section className="mt-12">
          <SectionHeading kicker="Catalog" title={dupes.length ? `Original creations (${originals.length})` : `Fragrances (${originals.length})`} />
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            {originals.map((p) => <PerfumeCard key={p.slug} perfume={p} />)}
          </div>
        </section>
      )}

      <section className="mt-12">
        <SectionHeading kicker="Explore" title="More houses" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(['my-perfume-secrets', 'dupify', 'boond-fragrances'] as const).filter((s) => s !== h.slug).slice(0, 3).map((s) => (
            <HouseLink key={s} slug={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

async function HouseLink({ slug }: { slug: string }) {
  const { getHouse: gh } = await import('@/lib/data');
  const h = await gh(slug);
  if (!h) return null;
  return <HouseCard house={h} />;
}
