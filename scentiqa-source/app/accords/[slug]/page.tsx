// /accords/[slug] — a fragrance accord's encyclopedia page.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAccordIndex, getAccordDescription, accordSlug, type AccordPerfumeRef } from '@/lib/accords-data';
import { Breadcrumbs, ProductImage, StarRating } from '@/components';
import { Card, SectionHeading } from '@/components/ui';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const data = await getAccordIndex();
  const ranked = [...data.index.entries()]
    .map(([key, refs]) => ({ slug: accordSlug(data.displayNames.get(key) ?? key), n: refs.length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 16);
  return ranked.map(({ slug }) => ({ slug }));
}

function PerfumeRow({ p }: { p: AccordPerfumeRef }) {
  return (
    <Link href={`/perfume/${p.slug}`} className="flex items-center gap-3 rounded-xl border border-stone-200/70 bg-white/60 p-2.5 transition hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
        <ProductImage name={p.name} house={p.house} image={p.bottleImage} size="sm" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{p.name}</p>
        <p className="truncate text-xs text-stone-400">{p.house}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-bold text-gold-700 dark:text-gold-300">{p.strength}</span>
        {p.ratingAvg > 0 && <StarRating value={p.ratingAvg} size={13} />}
      </div>
    </Link>
  );
}

export default async function AccordDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, description] = await Promise.all([getAccordIndex(), getAccordDescription(slug)]);
  const key = [...data.index.keys()].find((k) => accordSlug(data.displayNames.get(k) ?? k) === slug);
  if (!key) notFound();
  const refs = data.index.get(key)!;
  const displayName = data.displayNames.get(key) ?? key;

  // Related accords: share the most perfumes with this one.
  const ids = new Set(refs.map((r) => r.id));
  const co = new Map<string, number>();
  for (const id of ids) {
    const accs = data.perfumeAccords.get(id);
    if (!accs) continue;
    for (const a of accs) if (a !== key) co.set(a, (co.get(a) ?? 0) + 1);
  }
  const related = [...co.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([k, n]) => ({ name: data.displayNames.get(k) ?? k, slug: accordSlug(data.displayNames.get(k) ?? k), count: n }));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Accords', href: '/accords' }, { label: displayName }]} />
      <SectionHeading kicker="Accord" title={displayName} />

      {description && (
        <Card className="mb-6 border-l-4 border-l-gold-500 p-6">
          <p className="font-display text-lg italic leading-relaxed text-stone-700 dark:text-stone-200">“{description}”</p>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          [`${refs.length.toLocaleString('en-IN')}`, 'perfumes carry this accord'],
          [`${data.avgStrength.get(key) ?? 0}/100`, 'average strength'],
          [`${refs.filter((r) => r.strength >= 70).length.toLocaleString('en-IN')}`, 'where it dominates (70+)'],
        ].map(([v, l]) => (
          <Card key={l} className="p-4 text-center">
            <p className="font-display text-2xl font-bold capitalize">{v}</p>
            <p className="mt-1 text-xs text-stone-400">{l}</p>
          </Card>
        ))}
      </div>

      {related.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-xl font-bold">Often appears with</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((c) => (
              <Link key={c.slug} href={`/accords/${c.slug}`}
                className="rounded-full border border-stone-200 bg-white/70 px-3.5 py-1.5 text-sm font-semibold capitalize transition hover:border-gold-400 hover:text-gold-700 dark:border-white/10 dark:bg-white/[0.04] dark:hover:text-gold-300">
                {c.name} <span className="text-xs font-normal normal-case text-stone-400">· {c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-1 font-display text-xl font-bold">Loudest {displayName} perfumes</h2>
      <p className="mb-4 text-xs text-stone-400">Ranked by accord strength in the composition</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {refs.slice(0, 24).map((p) => <PerfumeRow key={p.id} p={p} />)}
      </div>

      <p className="mt-10 text-center text-xs text-stone-400">
        <Link href="/search/accords" className="font-bold text-gold-700 hover:underline dark:text-gold-300">Find your accord with the AI accord finder →</Link>
      </p>
    </div>
  );
}
