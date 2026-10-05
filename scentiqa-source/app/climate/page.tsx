import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { Card, SectionHeading } from '@/components';
import { heatVerdict } from '@/lib/climate';

export const metadata = {
  title: 'India Heat Performance Lab | Scentiqa',
  description: 'Which perfumes survive Indian summer? Community-tested heat, humidity and sweat performance, ranked.',
};

export const dynamic = 'force-dynamic';

interface Row {
  perfume_id: string; test_count: number; avg_hours: number | null;
  avg_projection: number | null; heat_score: number | null;
  perfumes: { slug: string; name: string; bottle_image_url: string | null; houses: { name: string } | { name: string }[] | null } | null;
}

function houseName(h: { name: string } | { name: string }[] | null): string {
  if (!h) return '';
  return Array.isArray(h) ? (h[0]?.name ?? '') : h.name;
}

export default async function ClimatePage() {
  const c = getSupabaseServer();
  let rows: Row[] = [];
  if (c) {
    const { data } = await c.from('perfume_climate_stats')
      .select('perfume_id, test_count, avg_hours, avg_projection, heat_score, perfumes(slug, name, bottle_image_url, houses(name))')
      .order('heat_score', { ascending: false })
      .limit(50);
    rows = (data ?? []) as unknown as Row[];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SectionHeading kicker="Climate Performance Lab" title="Will it survive Indian summer?" />
      <p className="mt-3 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Real wear tests from Indian users — temperature, humidity, hours lasted, sweat survival.
        No Western site can collect this data. Log your own tests from any perfume page.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-8 p-8 text-center">
          <p className="font-display text-xl font-bold">No community tests yet</p>
          <p className="mt-2 text-sm text-stone-500">
            Be the first — open any perfume page and tap “Log a wear test”.
          </p>
        </Card>
      ) : (
        <div className="mt-8 space-y-3">
          {rows.map((r, i) => {
            const p = r.perfumes;
            if (!p) return null;
            return (
              <Link key={r.perfume_id} href={`/perfume/${p.slug}`}>
                <Card className="flex items-center gap-4 p-4 transition hover:shadow-card">
                  <span className="w-8 shrink-0 font-display text-2xl font-bold text-stone-300 dark:text-stone-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="truncate text-xs text-stone-400">{houseName(p.houses)}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {r.test_count} test{r.test_count === 1 ? '' : 's'}
                      {r.avg_hours !== null && <> · {r.avg_hours.toFixed(1)}h avg</>}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-2xl font-bold text-gold-700 dark:text-gold-300">
                      {r.heat_score ?? '—'}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                      {r.heat_score !== null ? heatVerdict(r.heat_score) : ''}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
