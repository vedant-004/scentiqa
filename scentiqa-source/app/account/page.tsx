import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedServerClient } from '@/lib/supabase-server';
import { Breadcrumbs } from '@/components';
import { Button, Card, SectionHeading } from '@/components';
import { PerfumeCard, StarRating } from '@/components';
import { inr } from '@/lib/utils';
import { SignOutButton, RemoveWardrobeButton, RemoveAlertButton } from './account-client';

export const metadata = { title: 'My account' };

const SHELVES: Array<[string, string]> = [
  ['have', 'Have it'],
  ['want', 'Want it'],
  ['had', 'Had it'],
  ['test', 'Want to test'],
];

interface JoinedPerfume {
  id: string; slug: string; name: string;
  bottle_image_url: string | null; rating_avg: number; lowest_price_inr: number | null;
  accords?: Array<{ name: string; strength: number | null }>;
  houses: { name: string } | Array<{ name: string }> | null;
}

/** Supabase types to-one FK joins as arrays; the runtime returns a single object. Normalize both. */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-4 text-center dark:border-ink-700/50 dark:bg-ink-900">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{label}</p>
    </div>
  );
}

export default async function AccountPage() {
  const sb = await getAuthedServerClient();
  if (!sb) redirect('/login?next=/account');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login?next=/account');

  // Self-heal: ensure a public.users row exists for this auth user (FK target for votes/wardrobe).
  await sb.rpc('ensure_public_user');
  const uid = user.id;

  const [wardrobeR, votesR, reviewsR, alertsR, diaryR] = await Promise.all([
    sb.from('wardrobe_items')
      .select('shelf, created_at, perfumes(id, slug, name, bottle_image_url, rating_avg, lowest_price_inr, accords, houses(name))')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
    sb.from('community_votes')
      .select('vote_type, vote_value, created_at, perfumes(id, slug, name, bottle_image_url, accords, houses(name))')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(300),
    sb.from('reviews')
      .select('id, rating, title, body, created_at, helpful_votes, perfumes(slug, name)')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
    sb.from('price_alerts')
      .select('id, target_price_inr, created_at, perfumes(slug, name, bottle_image_url, lowest_price_inr)')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
    sb.from('wear_logs')
      .select('worn_on')
      .eq('user_id', uid).order('worn_on', { ascending: false }).limit(400),
  ]);

  const wardrobe = ((wardrobeR.data ?? []) as unknown as Array<{ shelf: string; perfumes: JoinedPerfume | JoinedPerfume[] | null }>)
    .map((w) => ({ shelf: w.shelf, perfumes: one(w.perfumes) }));
  const votes = ((votesR.data ?? []) as unknown as Array<{ vote_type: string; vote_value: string; perfumes: JoinedPerfume | JoinedPerfume[] | null }>)
    .map((v) => ({ vote_type: v.vote_type, vote_value: v.vote_value, perfumes: one(v.perfumes) }));
  const reviews = ((reviewsR.data ?? []) as unknown as Array<{ id: string; rating: number; title: string; body: string; created_at: string; helpful_votes: number; perfumes: { slug: string; name: string } | Array<{ slug: string; name: string }> | null }>)
    .map((r) => ({ ...r, perfumes: one(r.perfumes) }));
  const alerts = ((alertsR.data ?? []) as unknown as Array<{ id: number; target_price_inr: number; perfumes: JoinedPerfume | JoinedPerfume[] | null }>)
    .map((a) => ({ id: a.id, target_price_inr: a.target_price_inr, perfumes: one(a.perfumes) }));

  const loves = votes.filter((v) => v.vote_type === 'love_like_dislike' && v.vote_value === 'love');
  const likes = votes.filter((v) => v.vote_type === 'love_like_dislike' && v.vote_value === 'like');
  const dislikes = votes.filter((v) => v.vote_type === 'love_like_dislike' && v.vote_value === 'dislike');
  const meterVotes = votes.filter((v) => v.vote_type !== 'love_like_dislike');

  // Scent profile: top accords across loved perfumes.
  const accordCounts = new Map<string, number>();
  loves.forEach((v) => {
    (v.perfumes?.accords ?? []).forEach((a) => {
      accordCounts.set(a.name, (accordCounts.get(a.name) ?? 0) + (a.strength || 1));
    });
  });
  const topAccords = [...accordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Wear streak: consecutive days with a diary log
  const wearDays = new Set(((diaryR.data ?? []) as Array<{ worn_on: string }>).map((r) => r.worn_on));
  let streak = 0;
  {
    const today = new Date();
    for (let offset = 0; offset < 400; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      const key = d.toISOString().slice(0, 10);
      if (wearDays.has(key)) { streak++; continue; }
      if (offset === 0) continue;
      break;
    }
  }

  const provider = (user.app_metadata?.provider as string) || 'email';
  const initial = (user.email ?? 'S')[0].toUpperCase();
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const cardPerfume = (p: JoinedPerfume) => ({
    slug: p.slug, name: p.name, house: one(p.houses)?.name ?? '',
    ratingAvg: p.rating_avg ?? 0, lowestPriceInr: p.lowest_price_inr ?? null,
    isDupe: false, bottleImage: p.bottle_image_url,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My account' }]} />

      {/* Profile header */}
      <Card className="mt-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-600 font-display text-3xl font-bold text-white shadow-card">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight">{user.email}</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Signed in with {provider === 'google' ? 'Google' : provider}
              {memberSince && <> · Member since {memberSince}</>}
            </p>
          </div>
          <SignOutButton />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat value={wardrobe.length} label="In wardrobe" />
          <Stat value={votes.length} label="Votes cast" />
          <Stat value={reviews.length} label="Reviews" />
          <Stat value={alerts.length} label="Price alerts" />
          <Link href="/diary" className="rounded-2xl border border-gold-500/40 bg-gold-600/10 p-4 text-center transition hover:bg-gold-600/20">
            <p className="font-display text-2xl font-bold text-gold-700 dark:text-gold-300">{streak} 🔥</p>
            <p className="mt-1 text-xs font-semibold text-stone-500 dark:text-stone-400">Day streak · Diary →</p>
          </Link>
        </div>
      </Card>

      {/* Scent profile */}
      {topAccords.length > 0 && (
        <section className="mt-10">
          <SectionHeading kicker="Your taste" title="Your scent profile" />
          <Card className="p-6">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Based on the perfumes you loved — your nose leans toward:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topAccords.map(([name]) => (
                <span key={name} className="rounded-full bg-gold-600/15 px-4 py-1.5 text-sm font-semibold text-gold-700 dark:text-gold-300">
                  {name}
                </span>
              ))}
            </div>
            <Link href="/quiz" className="mt-4 inline-block text-sm font-semibold text-gold-700 underline dark:text-gold-300">
              Get AI recommendations from your profile →
            </Link>
          </Card>
        </section>
      )}

      {/* Wardrobe */}
      <section className="mt-10">
        <SectionHeading kicker="Collection" title="My wardrobe" />
        {wardrobe.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-stone-500 dark:text-stone-400">Your shelves are empty. Tap <strong>Have it</strong>, <strong>Want it</strong> or <strong>Want to test</strong> on any perfume to start your collection.</p>
            <Link href="/find-alternative" className="mt-4 inline-block"><Button>Discover perfumes</Button></Link>
          </Card>
        ) : (
          <div className="space-y-8">
            {SHELVES.map(([shelf, label]) => {
              const items = wardrobe.filter((w) => w.shelf === shelf && w.perfumes);
              if (!items.length) return null;
              return (
                <div key={shelf}>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    {label} <span className="text-stone-400">({items.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {items.map((w) => (
                      <div key={`${w.perfumes!.id}-${shelf}`} className="relative">
                        <PerfumeCard perfume={cardPerfume(w.perfumes!)} />
                        <RemoveWardrobeButton perfumeId={w.perfumes!.id} shelf={shelf} label={label} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Votes */}
      {(loves.length > 0 || likes.length > 0 || dislikes.length > 0) && (
        <section className="mt-10">
          <SectionHeading kicker="Taste" title="My votes" />
          <div className="grid gap-6 md:grid-cols-3">
            {([['love', '❤️ Loved', loves], ['like', '👍 Liked', likes], ['dislike', '👎 Disliked', dislikes]] as const).map(([key, label, list]) => (
              <Card key={key} className="p-5">
                <h3 className="font-display text-lg font-semibold">{label} <span className="text-sm font-normal text-stone-400">({list.length})</span></h3>
                <ul className="mt-3 space-y-2">
                  {list.slice(0, 8).map((v) => v.perfumes && (
                    <li key={v.perfumes.id}>
                      <Link href={`/perfume/${v.perfumes.slug}`} className="text-sm font-medium hover:text-gold-700 dark:hover:text-gold-300">
                        {v.perfumes.name}
                      </Link>
                      <span className="text-xs text-stone-400"> · {one(v.perfumes!.houses)?.name}</span>
                    </li>
                  ))}
                </ul>
                {list.length > 8 && <p className="mt-2 text-xs text-stone-400">+ {list.length - 8} more</p>}
              </Card>
            ))}
          </div>
          {meterVotes.length > 0 && (
            <p className="mt-3 text-sm text-stone-400">+ {meterVotes.length} performance votes (longevity, sillage, value) across perfumes.</p>
          )}
        </section>
      )}

      {/* Reviews */}
      <section className="mt-10">
        <SectionHeading kicker="Community" title="My reviews" />
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-stone-500 dark:text-stone-400">No reviews yet. Your honest take helps other members — write one from any perfume page.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/perfume/${r.perfumes?.slug}`} className="font-semibold hover:text-gold-700 dark:hover:text-gold-300">
                    {r.perfumes?.name ?? 'Perfume'}
                  </Link>
                  <StarRating value={r.rating} size={14} />
                </div>
                {r.title && <p className="mt-2 font-display font-semibold">{r.title}</p>}
                <p className="mt-1 line-clamp-3 text-sm text-stone-500 dark:text-stone-400">{r.body}</p>
                <p className="mt-3 text-xs text-stone-400">{r.helpful_votes} found this helpful</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Price alerts */}
      <section className="mt-10">
        <SectionHeading kicker="Deals" title="My price alerts" />
        {alerts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-stone-500 dark:text-stone-400">No price alerts. Set a target price on any perfume and we&rsquo;ll watch it for you.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.map((a) => {
              const p = a.perfumes;
              const hit = p?.lowest_price_inr != null && p.lowest_price_inr <= a.target_price_inr;
              return (
                <Card key={a.id} className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/perfume/${p?.slug}`} className="font-semibold hover:text-gold-700 dark:hover:text-gold-300">
                      {p?.name ?? 'Perfume'}
                    </Link>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      Target <strong>{inr(a.target_price_inr)}</strong>
                      {p?.lowest_price_inr != null && <> · Now <strong className={hit ? 'text-emerald-600' : ''}>{inr(p.lowest_price_inr)}</strong></>}
                    </p>
                    {hit && <p className="mt-1 text-xs font-bold text-emerald-600">🎯 Target hit — buy it now</p>}
                  </div>
                  <RemoveAlertButton alertId={a.id} />
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
