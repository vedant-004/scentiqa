// /vs/[a]-vs-[b] — static head-to-head comparison pages from a curated list.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPerfume, getPerfumesBySlugs } from '@/lib/data-supabase';
import { VS_COMPARISONS, vsParam, parseVsParam } from '@/lib/vs-comparisons';
import { SITE_URL } from '@/lib/site-url';
import { inr, cn } from '@/lib/utils';
import { Breadcrumbs, Card, SectionHeading, Badge } from '@/components';
import { StarRating, MeterBar, ProductImage } from '@/components/domain';
import type { PerfumeFull } from '@/lib/types';

export const revalidate = 86400;

export async function generateStaticParams() {
  return VS_COMPARISONS.map((p) => ({ comparison: vsParam(p) }));
}

export async function generateMetadata({ params }: { params: Promise<{ comparison: string }> }) {
  const { comparison } = await params;
  const pair = parseVsParam(comparison);
  if (!pair) return { title: 'Perfume comparisons — Scentiqa' };
  const [a, b] = await Promise.all([getPerfume(pair.a), getPerfume(pair.b)]);
  if (!a || !b) return { title: 'Perfume comparison — Scentiqa' };
  const url = `${SITE_URL}/vs/${comparison}`;
  return {
    title: `${a.name} vs ${b.name}: Which Should You Buy in India? — Scentiqa`,
    description: `Side-by-side: ${a.name} by ${a.house} vs ${b.name} by ${b.house}. Compare INR prices, community ratings, accords, notes and Indian-heat performance before you buy.`,
    alternates: { canonical: url },
    openGraph: { title: `${a.name} vs ${b.name} — Scentiqa`, url, type: 'article' },
  };
}

function verdictFor(a: PerfumeFull, b: PerfumeFull): string[] {
  const bits: string[] = [];
  const items = [a, b];
  const prices = items.map((p) => p.lowestPriceInr);
  if (prices.every((v) => v !== null)) {
    const [pa, pb] = prices as number[];
    if (pa !== pb) {
      const cheaper = pa < pb ? a : b;
      bits.push(`${cheaper.name} is cheaper by ${inr(Math.abs(pa - pb))} at the best Indian price we track.`);
    }
  }
  const rated = items.filter((p) => p.ratingCount > 0);
  if (rated.length > 0) {
    const top = rated.reduce((x, y) => (y.ratingAvg > x.ratingAvg ? y : x));
    bits.push(`${top.name} is the community favorite (${top.ratingAvg.toFixed(1)}★ from ${top.ratingCount} ratings).`);
  }
  const aAcc = new Set(a.accords.map((x) => x.name.toLowerCase()));
  const shared = b.accords.filter((x) => aAcc.has(x.name.toLowerCase()));
  if (shared.length > 0) {
    bits.push(`They share ${shared.length} accord${shared.length === 1 ? '' : 's'} (${shared.slice(0, 4).map((x) => x.name).join(', ')}) — expect a similar dry-down.`);
  } else {
    bits.push('No shared accords in the top pyramid — these smell distinctly different.');
  }
  const heats = items.map((p) => p.climate?.heatLongevity).filter((v): v is number => typeof v === 'number');
  if (heats.length === 2) {
    bits.push(`${heats[0] >= heats[1] ? a.name : b.name} lasts longer in Indian heat.`);
  }
  const rel = a.dupes.find((d) => d.dupeSlug === b.slug) ?? b.dupes.find((d) => d.dupeSlug === a.slug);
  if (rel?.similarityScore) {
    bits.push(`Scentiqa lab similarity between the two: ${rel.similarityScore}%.`);
  }
  return bits;
}

export default async function VsPage({ params }: { params: Promise<{ comparison: string }> }) {
  const { comparison } = await params;
  const pair = parseVsParam(comparison);
  if (!pair) notFound();
  const [a, b] = await Promise.all([getPerfume(pair.a), getPerfume(pair.b)]);
  if (!a || !b) notFound();
  const verdict = verdictFor(a, b);
  const related = VS_COMPARISONS.filter(
    (p) => vsParam(p) !== comparison && [p.a, p.b].some((s) => s === a.slug || s === b.slug),
  ).slice(0, 6);
  const relatedNames = new Map(
    (await getPerfumesBySlugs([...new Set(related.flatMap((p) => [p.a, p.b]))])).map((p) => [p.slug, p.name] as const),
  );

  const rows: Array<{ label: string; render: (p: PerfumeFull) => React.ReactNode }> = [
    { label: 'Best price (India)', render: (p) => <span className="text-lg font-bold">{inr(p.lowestPriceInr)}</span> },
    { label: 'Community rating', render: (p) => <StarRating value={p.ratingAvg} count={p.ratingCount} size={13} /> },
    { label: 'House', render: (p) => <Link href={`/house/${p.houseInfo.slug}`} className="font-semibold text-gold-700 hover:underline dark:text-gold-300">{p.houseInfo.name}</Link> },
    { label: 'Concentration', render: (p) => <span className="text-sm">{p.concentration.toUpperCase()}</span> },
    { label: 'Scent profile', render: (p) => <span className="text-sm font-semibold">{p.accords.slice(0, 3).map((x) => x.name).join(' · ') || '—'}</span> },
    { label: 'Top notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.topNotes.join(', ') || '—'}</span> },
    { label: 'Heart notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.heartNotes.join(', ') || '—'}</span> },
    { label: 'Base notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.baseNotes.join(', ') || '—'}</span> },
    { label: 'Heat longevity', render: (p) => (p.climate ? <MeterBar label="" value={p.climate.heatLongevity} /> : '—') },
    { label: 'Summer rating', render: (p) => (p.climate ? <MeterBar label="" value={p.climate.summerRating} /> : '—') },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Versus', href: '/vs' },
        { label: `${a.name} vs ${b.name}` },
      ]} />

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">Head to head</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {a.name} <span className="text-stone-400">vs</span> {b.name}
      </h1>
      <p className="mt-3 max-w-3xl text-[15px] text-stone-600 dark:text-stone-300">
        Can&apos;t decide between {a.name} by {a.house} and {b.name} by {b.house}? Here&apos;s every
        difference that matters for buyers in India — price, ratings, scent profile and heat performance.
      </p>

      {/* Head-to-head cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[a, b].map((p) => (
          <Card key={p.slug} className="flex items-center gap-5 p-5">
            <ProductImage name={p.name} house={p.house} image={p.bottleImage} size="md" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">{p.house}</p>
              <Link href={`/perfume/${p.slug}`} className="font-display text-2xl font-bold tracking-tight hover:text-gold-700 dark:hover:text-gold-300">{p.name}</Link>
              <div className="mt-1"><StarRating value={p.ratingAvg} count={p.ratingCount} size={13} /></div>
              <p className="mt-1 text-lg font-bold">{inr(p.lowestPriceInr)}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Verdict */}
      <section aria-label="Verdict" className="mt-8">
        <Card className="border-gold-600/30 p-5">
          <h2 className="font-display text-lg font-bold">The verdict</h2>
          <ul className="mt-3 space-y-2">
            {verdict.map((v, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
                <span className="font-bold text-gold-600">✓</span><span>{v}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Comparison table */}
      <section aria-label="Side-by-side comparison" className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr>
              <th className="w-40 p-3 text-xs font-bold uppercase tracking-wider text-stone-400" />
              {[a, b].map((p) => (
                <th key={p.slug} className="p-3">
                  <Link href={`/perfume/${p.slug}`} className="font-display text-lg font-bold hover:text-gold-700 dark:hover:text-gold-300">{p.name}</Link>
                  <p className="text-xs font-normal text-stone-500">{p.house}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} className={cn('border-t border-stone-200 dark:border-ink-700', i % 2 === 1 && 'bg-stone-50 dark:bg-white/[0.02]')}>
                <td className="p-3 text-xs font-bold uppercase tracking-wider text-stone-500">{r.label}</td>
                {[a, b].map((p) => (<td key={p.slug} className="p-3 align-top">{r.render(p)}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={`/compare?ids=${a.slug},${b.slug}`} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900">
          Open in interactive compare
        </Link>
        <Badge>Data from the live catalog</Badge>
      </div>

      {related.length > 0 && (
        <section aria-label="More comparisons" className="mt-10">
          <SectionHeading kicker="Keep comparing" title="More head-to-heads" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <Link key={vsParam(p)} href={`/vs/${vsParam(p)}`} className="group block">
                <Card hover className="p-4">
                  <p className="font-display font-semibold group-hover:text-gold-700 dark:group-hover:text-gold-300">
                    {relatedNames.get(p.a) ?? p.a} <span className="font-normal text-stone-400">vs</span> {relatedNames.get(p.b) ?? p.b}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
