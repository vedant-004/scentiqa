import { getSupabaseServer } from '@/lib/supabase';
import { Breadcrumbs } from '@/components';
import { Button, Card, SectionHeading } from '@/components';

export const metadata = {
  title: 'Verified Sellers',
  description: 'Authentic perfume sellers in India, verified by the Scentiqa team.',
};

export const revalidate = 3600;

const TYPE_LABEL: Record<string, string> = {
  official: 'Official store',
  marketplace: 'Marketplace',
  reseller: 'Reseller',
  decanter: 'Decanter',
};

interface SellerRow {
  id: string; slug: string; name: string; website_url: string | null;
  seller_type: string | null; verified: boolean; trust_notes: string | null;
  listingCount: number;
}

export default async function SellersPage() {
  const sb = getSupabaseServer();
  let sellers: SellerRow[] = [];

  if (sb) {
    const { data } = await sb.from('sellers')
      .select('id, slug, name, website_url, seller_type, verified, trust_notes')
      .order('verified', { ascending: false })
      .order('name', { ascending: true });
    const rows = (data ?? []) as Array<Omit<SellerRow, 'listingCount'>>;
    // Count live price listings per seller in one query.
    const ids = rows.map((r) => r.id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: prices } = await sb.from('prices').select('seller_id').in('seller_id', ids);
      for (const p of (prices ?? []) as Array<{ seller_id: string }>) {
        counts.set(p.seller_id, (counts.get(p.seller_id) ?? 0) + 1);
      }
    }
    sellers = rows.map((r) => ({ ...r, listingCount: counts.get(r.id) ?? 0 }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Verified Sellers' }]} />
      <SectionHeading kicker="Buy with confidence" title="Verified sellers" />
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
        Sellers marked <strong>verified</strong> have been checked by the Scentiqa team.
        Always re-verify prices on the seller&rsquo;s site before buying.
      </p>

      {sellers.length === 0 ? (
        <p className="text-sm text-stone-500">Seller directory is being built — check back soon.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sellers.map((s) => (
            <Card key={s.slug} className="relative overflow-hidden p-0">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-300/20 via-transparent to-transparent dark:from-gold-600/10" aria-hidden="true" />
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  {s.verified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <span aria-hidden="true">✓</span> Verified by Scentiqa
                    </span>
                  ) : (
                    <span className="rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-500 dark:bg-white/10 dark:text-stone-300">
                      Unverified
                    </span>
                  )}
                  {s.seller_type && (
                    <span className="rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-500 dark:bg-white/10 dark:text-stone-300">
                      {TYPE_LABEL[s.seller_type] ?? s.seller_type}
                    </span>
                  )}
                  {s.listingCount > 0 && (
                    <span className="rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-500 dark:bg-white/10 dark:text-stone-300">
                      {s.listingCount} price{s.listingCount === 1 ? '' : 's'} tracked
                    </span>
                  )}
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold">{s.name}</h2>
                {s.trust_notes && (
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{s.trust_notes}</p>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  {s.website_url ? (
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm">Visit store →</Button>
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
