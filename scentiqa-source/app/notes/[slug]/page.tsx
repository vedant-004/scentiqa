// /notes/[slug] — a fragrance note's encyclopedia page.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNoteIndex, getNoteMetas, getNoteDescription, type NotePerfumeRef } from '@/lib/notes-data';
import { Breadcrumbs, ProductImage, StarRating } from '@/components';
import { Card, SectionHeading } from '@/components/ui';

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  // Pre-render the 24 most-used notes; the rest render on first visit.
  const data = await getNoteIndex();
  const metas = await getNoteMetas();
  const ranked = metas
    .map((m) => ({ slug: m.slug, n: (() => { const e = data.index.get(m.name.toLowerCase().trim()); return e ? e.top.length + e.heart.length + e.base.length : 0; })() }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 24);
  return ranked.map(({ slug }) => ({ slug }));
}

function PerfumeRow({ p }: { p: NotePerfumeRef }) {
  return (
    <Link href={`/perfume/${p.slug}`} className="flex items-center gap-3 rounded-xl border border-stone-200/70 bg-white/60 p-2.5 transition hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
        <ProductImage name={p.name} house={p.house} image={p.bottleImage} size="sm" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{p.name}</p>
        <p className="truncate text-xs text-stone-400">{p.house}</p>
      </div>
      {p.ratingAvg > 0 && <span className="ml-auto shrink-0"><StarRating value={p.ratingAvg} size={13} /></span>}
    </Link>
  );
}

export default async function NoteDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [metas, data, description] = await Promise.all([getNoteMetas(), getNoteIndex(), getNoteDescription(slug)]);
  const meta = metas.find((m) => m.slug === slug);
  const key = (meta?.name ?? slug.replace(/-/g, ' ')).toLowerCase().trim();
  const entry = data.index.get(key);
  const displayName = meta?.name ?? data.displayNames.get(key) ?? slug.replace(/-/g, ' ');
  if (!entry || (entry.top.length + entry.heart.length + entry.base.length === 0)) notFound();

  const total = entry.top.length + entry.heart.length + entry.base.length;
  const byRating = (arr: NotePerfumeRef[]) => [...arr].sort((a, b) => b.ratingAvg - a.ratingAvg).slice(0, 8);

  // Co-occurring notes: notes sharing the most perfumes with this one.
  const ids = new Set<string>();
  for (const b of [entry.top, entry.heart, entry.base] as const) for (const p of b) ids.add(p.id);
  const co = new Map<string, number>();
  for (const id of ids) {
    const notes = data.perfumeNotes.get(id);
    if (!notes) continue;
    for (const n of notes) if (n !== key) co.set(n, (co.get(n) ?? 0) + 1);
  }
  const coRanked = [...co.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([k, n]) => ({ name: data.displayNames.get(k) ?? k, slug: metas.find((m) => m.name.toLowerCase().trim() === k)?.slug ?? '', count: n }))
    .filter((x) => x.slug);

  const sections = [
    { label: 'Top notes', blurb: 'the first impression', items: entry.top },
    { label: 'Heart notes', blurb: 'the character', items: entry.heart },
    { label: 'Base notes', blurb: 'the lasting trail', items: entry.base },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Notes', href: '/notes' }, { label: displayName }]} />
      <SectionHeading kicker={meta ? `Note · ${meta.category.replace(/_/g, ' ')}` : 'Note'} title={displayName} />

      {description && (
        <Card className="mb-6 border-l-4 border-l-gold-500 p-6">
          <p className="font-display text-lg italic leading-relaxed text-stone-700 dark:text-stone-200">“{description}”</p>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [`${total.toLocaleString('en-IN')}`, 'perfumes feature it'],
          [`${entry.top.length.toLocaleString('en-IN')}`, 'as a top note'],
          [`${entry.heart.length.toLocaleString('en-IN')}`, 'as a heart note'],
          [`${entry.base.length.toLocaleString('en-IN')}`, 'as a base note'],
        ].map(([v, l]) => (
          <Card key={l} className="p-4 text-center">
            <p className="font-display text-2xl font-bold">{v}</p>
            <p className="mt-1 text-xs text-stone-400">{l}</p>
          </Card>
        ))}
      </div>

      {coRanked.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-xl font-bold">Often paired with</h2>
          <div className="flex flex-wrap gap-2">
            {coRanked.map((c) => (
              <Link key={c.slug} href={`/notes/${c.slug}`}
                className="rounded-full border border-stone-200 bg-white/70 px-3.5 py-1.5 text-sm font-semibold transition hover:border-gold-400 hover:text-gold-700 dark:border-white/10 dark:bg-white/[0.04] dark:hover:text-gold-300">
                {c.name} <span className="text-xs font-normal text-stone-400">· {c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {sections.map((s) => (
          <div key={s.label}>
            <h2 className="font-display text-xl font-bold">{s.label} <span className="text-sm font-normal text-stone-400">· {s.blurb}</span></h2>
            <p className="mb-3 text-xs text-stone-400">{s.items.length.toLocaleString('en-IN')} perfumes · top rated shown</p>
            <div className="space-y-2">{byRating(s.items).map((p) => <PerfumeRow key={p.id} p={p} />)}</div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-stone-400">
        <Link href="/search/notes" className="font-bold text-gold-700 hover:underline dark:text-gold-300">Find perfumes by note combinations with AI search →</Link>
      </p>
    </div>
  );
}
