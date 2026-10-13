// /wardrobe — the signed-in user's own wardrobe.
import Link from 'next/link';
import { getAuthedServerClient } from '@/lib/supabase-server';
import { Breadcrumbs, PerfumeCard } from '@/components';
import { Button, Card, EmptyState, SectionHeading } from '@/components/ui';
import { RemoveWardrobeButton, VisibilityControl } from './wardrobe-client';

export const metadata = {
  title: 'My wardrobe',
  description: 'Your personal perfume collection on Scentiqa.',
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

interface JoinedPerfume {
  id: string; slug: string; name: string; bottle_image_url: string | null;
  rating_avg: number | null; lowest_price_inr: number | null;
  houses: { name: string } | Array<{ name: string }> | null;
}

const SHELVES = [['have', 'Have it'], ['want', 'Want it'], ['had', 'Had it'], ['test', 'Want to test']] as const;

export default async function WardrobePage() {
  const sb = await getAuthedServerClient();
  const { data: { user } } = sb ? await sb.auth.getUser() : { data: { user: null } };

  if (!sb || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Wardrobe' }]} />
        <SectionHeading kicker="Collection" title="Your wardrobe" />
        <Card className="mt-6 p-10 text-center">
          <p className="text-4xl">🧴</p>
          <h2 className="mt-3 font-display text-xl font-semibold">Sign in to view your wardrobe</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
            Save perfumes you own, want, or want to test — your wardrobe lives here once you&apos;re signed in.
          </p>
          <Link href="/login?next=/wardrobe" className="mt-5 inline-block">
            <Button size="lg">Sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const uid = user.id;
  const [wardrobeR, visR] = await Promise.all([
    sb.from('wardrobe_items')
      .select('shelf, created_at, perfumes(id, slug, name, bottle_image_url, rating_avg, lowest_price_inr, houses(name))')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(500),
    sb.from('users').select('wardrobe_visibility').eq('id', uid).maybeSingle(),
  ]);

  const wardrobe = ((wardrobeR.data ?? []) as unknown as Array<{ shelf: string; perfumes: JoinedPerfume | JoinedPerfume[] | null }>)
    .map((w) => ({ shelf: w.shelf, perfumes: one(w.perfumes) }))
    .filter((w) => w.perfumes);
  // Column may not exist until the migration runs; default to private.
  const visibility = (visR.data as { wardrobe_visibility?: string } | null)?.wardrobe_visibility === 'public' ? 'public' : 'private';

  const cardPerfume = (p: JoinedPerfume) => ({
    slug: p.slug, name: p.name, house: one(p.houses)?.name ?? '',
    ratingAvg: p.rating_avg ?? 0, lowestPriceInr: p.lowest_price_inr ?? null,
    isDupe: false, bottleImage: p.bottle_image_url,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Wardrobe' }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading kicker="Collection" title={`Your wardrobe (${wardrobe.length})`} />
        <VisibilityControl initial={visibility} />
      </div>

      {wardrobe.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <p className="text-4xl">🧴</p>
          <h2 className="mt-3 font-display text-xl font-semibold">Your wardrobe is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
            Tap <strong>+ Have it</strong> on any perfume to build your collection.
          </p>
          <Link href="/find-alternative" className="mt-5 inline-block">
            <Button>Browse perfumes</Button>
          </Link>
        </Card>
      ) : (
        <div className="mt-6 space-y-8">
          {SHELVES.map(([shelf, label]) => {
            const items = wardrobe.filter((w) => w.shelf === shelf);
            if (!items.length) return null;
            return (
              <section key={shelf}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                  {label} <span className="text-stone-400">({items.length})</span>
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {items.map((w) => (
                    <div key={`${w.perfumes!.id}-${shelf}`} className="relative">
                      <PerfumeCard perfume={cardPerfume(w.perfumes!)} />
                      <RemoveWardrobeButton perfumeId={w.perfumes!.id} shelf={shelf} label={label} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
