import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { Card, SectionHeading } from '@/components';
import { computeBlindBuyScore } from '@/lib/blindbuy';

export const metadata = {
  title: 'Safest Blind Buys Under ₹2,000 | Scentiqa',
  description: 'Ranked blind-buy safety scores for affordable Indian fragrances — buy without smelling, with confidence.',
};

export const dynamic = 'force-dynamic';

interface Candidate {
  id: string; slug: string; name: string; rating_count: number | null;
  houses: { name: string } | { name: string }[] | null;
}

function houseName(h: { name: string } | { name: string }[] | null): string {
  if (!h) return '';
  return Array.isArray(h) ? (h[0]?.name ?? '') : h.name;
}

export default async function BlindBuyPage() {
  const c = getSupabaseServer();
  let ranked: Array<{ candidate: Candidate; score: number; verdict: string; price: number }> = [];

  if (c) {
    // Candidates: priced under ₹2000, sorted by rating count (community signal first)
    const { data } = await c.from('perfumes')
      .select('id, slug, name, rating_count, lowest_price_inr, houses(name)')
      .lt('lowest_price_inr', 2000)
      .gt('lowest_price_inr', 0)
      .order('rating_count', { ascending: false, nullsFirst: false })
      .limit(60);
    const scored: Array<{ candidate: Candidate; score: number; verdict: string; price: number }> = [];
    for (const row of (data ?? []) as Array<Candidate & { lowest_price_inr: number | null }>) {
      const res = await computeBlindBuyScore(row.id);
      if (res) scored.push({ candidate: row, score: res.score, verdict: res.verdict, price: row.lowest_price_inr ?? 0 });
    }
    ranked = scored.sort((a, b) => b.score - a.score).slice(0, 24);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SectionHeading kicker="Blind-Buy Risk Score" title="Safest blind buys under ₹2,000" />
      <p className="mt-3 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        India is a blind-buy market — few niche stores outside metros. These scores combine dupe availability,
        price risk, community consensus and scent familiarity into one 0–100 safety number.
      </p>

      {ranked.length === 0 ? (
        <Card className="mt-8 p-8 text-center">
          <p className="text-sm text-stone-500">No priced perfumes under ₹2,000 yet.</p>
        </Card>
      ) : (
        <div className="mt-8 space-y-3">
          {ranked.map(({ candidate: p, score, verdict, price }, i) => {
            const tone = score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-lime-600 dark:text-lime-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
            return (
              <Link key={p.id} href={`/perfume/${p.slug}`}>
                <Card className="flex items-center gap-4 p-4 transition hover:shadow-card">
                  <span className="w-8 shrink-0 font-display text-2xl font-bold text-stone-300 dark:text-stone-600">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="truncate text-xs text-stone-400">
                      {houseName(p.houses)} · ₹{price.toLocaleString('en-IN')}
                      {p.rating_count ? ` · ${p.rating_count} ratings` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-display text-2xl font-bold ${tone}`}>{score}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">{verdict}</p>
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
