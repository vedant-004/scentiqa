import Link from 'next/link';
import {
  getArticles, getDupeOfWeek, getLatestLaunches, getLatestReviews,
  getPriceDrops, getStats, getTrending,
} from '@/lib/data';
import { inr } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button, Card, SectionHeading } from '@/components/ui';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/components/seo';
import { BottleVisual, PerfumeCard, ScoreBadge, SearchBar, StarRating } from '@/components';
import type { Perfume } from '@/lib/types';

export const metadata = { title: 'Scentiqa — India\u2019s Perfume Encyclopedia & Dupe Finder' };

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6" style={{ scrollbarWidth: 'none' }}>
      <div className="flex w-max gap-4">{children}</div>
    </div>
  );
}

export default async function Home() {
  const demo = !isSupabaseConfigured();
  const [trending, latest, drops, dupeWeek, articles, reviews, stats] = await Promise.all([
    getTrending(), getLatestLaunches(), getPriceDrops(), getDupeOfWeek(),
    getArticles(3), getLatestReviews(3), getStats(),
  ]);

  const savePct = dupeWeek && dupeWeek.original.lowestPriceInr && dupeWeek.dupe.lowestPrice?.priceInr
    ? Math.round((1 - dupeWeek.dupe.lowestPrice.priceInr / dupeWeek.original.lowestPriceInr) * 100) : null;

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-gold-300/50 via-gold-500/25 to-transparent blur-3xl animate-glow-pulse dark:from-gold-500/25 dark:via-gold-700/15" />
          <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl dark:bg-gold-700/10" />
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl dark:bg-gold-600/10" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-600/25 bg-gold-600/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-glow-pulse" />
              India&rsquo;s independent fragrance lab
            </p>
            <h1 className="font-display text-[42px] font-bold leading-[1.05] tracking-tight text-stone-900 dark:text-white sm:text-6xl">
              Find a cheaper alternative<br className="hidden sm:block" /> to <span className="bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">any perfume.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-stone-600 dark:text-stone-300">
              Lab-tested dupe similarity scores, INR prices from verified Indian sellers,
              and performance ratings for Indian heat — not marketing claims.
            </p>
            <div className="mx-auto mt-8 max-w-xl"><SearchBar big autoFocus={false} /></div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-stone-400">Try:</span>
              {['Aventus', 'Sauvage', 'Baccarat Rouge 540', 'Khamrah'].map((t) => (
                <Link key={t} href={`/perfume/${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="rounded-full border border-stone-300/70 px-3.5 py-1.5 font-medium text-stone-600 transition-all hover:-translate-y-0.5 hover:border-gold-600 hover:text-gold-700 dark:border-ink-700 dark:text-stone-300 dark:hover:border-gold-400 dark:hover:text-gold-300">
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6">
        {/* ============ TRENDING ============ */}
        <section>
          <SectionHeading kicker="Live in India" title="Trending this week"
            action={<Link href="/find-alternative"><Button variant="ghost" size="sm">Find your dupe →</Button></Link>} />
          <Rail>
            {trending.map((p: Perfume, i: number) => (
              <div key={p.slug} className="w-52 shrink-0 sm:w-60"><PerfumeCard perfume={p} rank={i + 1} /></div>
            ))}
          </Rail>
        </section>

        {/* ============ DUPE OF THE WEEK ============ */}
        {dupeWeek && (
          <section>
            <SectionHeading kicker="Lab spotlight" title="Dupe of the week" />
            <Card className="relative overflow-hidden p-0">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-300/25 via-transparent to-transparent dark:from-gold-600/15" aria-hidden="true" />
              <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                <Link href={`/perfume/${dupeWeek.original.slug}`} className="group flex flex-col items-center text-center">
                  <BottleVisual name={dupeWeek.original.name} house={dupeWeek.original.house} size="md" />
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">The original</p>
                  <h3 className="font-display text-2xl font-semibold tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300">{dupeWeek.original.name}</h3>
                  <p className="mt-1 text-lg font-bold">{inr(dupeWeek.original.lowestPriceInr)}</p>
                </Link>
                <div className="flex flex-col items-center gap-2">
                  <ScoreBadge score={dupeWeek.dupe.similarityScore} size="lg" label={demo ? "Lab match · sample" : "Lab match"} />
                  {savePct !== null && (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">Save {savePct}%</span>
                  )}
                  <span className="font-display text-3xl text-stone-300 dark:text-stone-600">vs</span>
                </div>
                <Link href={`/perfume/${dupeWeek.dupe.dupe.slug}`} className="group flex flex-col items-center text-center">
                  <BottleVisual name={dupeWeek.dupe.dupe.name} house={dupeWeek.dupe.dupeHouse.name} size="md" />
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">The Indian alternative</p>
                  <h3 className="font-display text-2xl font-semibold tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300">{dupeWeek.dupe.dupe.name}</h3>
                  <p className="mt-1 text-lg font-bold">{dupeWeek.dupe.lowestPrice ? inr(dupeWeek.dupe.lowestPrice.priceInr) : '—'}</p>
                </Link>
              </div>
              <div className="relative border-t border-stone-200/70 px-6 py-4 sm:px-10 dark:border-ink-700/50">
                <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  <span className="font-bold text-stone-900 dark:text-white">Lab verdict: </span>{dupeWeek.dupe.verdict}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href={`/compare?ids=${dupeWeek.original.slug},${dupeWeek.dupe.dupe.slug}`}><Button size="sm">Compare side-by-side</Button></Link>
                  <Link href={`/perfume/${dupeWeek.original.slug}`}><Button size="sm" variant="outline">All {dupeWeek.original.name} alternatives</Button></Link>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* ============ NEW FROM INDIAN HOUSES ============ */}
        <section>
          <SectionHeading kicker="Desi perfumery" title="New from Indian houses"
            action={<Link href="/house/house-of-em5"><Button variant="ghost" size="sm">All houses →</Button></Link>} />
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            {latest.slice(0, 4).map((p: Perfume) => <PerfumeCard key={p.slug} perfume={p} />)}
          </div>
        </section>

        {/* ============ PRICE DROPS ============ */}
        {drops.length > 0 && (
          <section>
            <SectionHeading kicker="Verified sellers" title="Price drops" />
            <div className="grid gap-4 sm:grid-cols-3">
              {drops.map((d) => (
                <Link key={d.perfumeSlug} href={`/perfume/${d.perfumeSlug}`}>
                  <Card hover className="flex items-center gap-4 p-5">
                    <BottleVisual name={d.perfume.name} house={d.perfume.house} size="sm" />
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-semibold">{d.perfume.name}</h3>
                      <p className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{inr(d.newInr)}</span>
                        <span className="text-sm text-stone-400 line-through">{inr(d.oldInr)}</span>
                      </p>
                      <p className="text-xs text-stone-400">at {d.seller?.name}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ============ EDITORIAL ============ */}
        <section>
          <SectionHeading kicker="From the lab" title="Stories & guides"
            action={<Link href="/news"><Button variant="ghost" size="sm">All stories →</Button></Link>} />
          <div className="grid gap-4 md:grid-cols-3">
            {articles.map((a, i) => (
              <Link key={a.slug} href={`/news/${a.slug}`} className={i === 0 ? 'md:col-span-2' : ''}>
                <Card hover className="flex h-full flex-col justify-between overflow-hidden p-0">
                  <div className={`flex h-36 items-end bg-gradient-to-br p-5 ${i === 0 ? 'from-gold-600 via-gold-500 to-amber-400' : i === 1 ? 'from-stone-800 via-stone-700 to-stone-900' : 'from-amber-700 via-gold-700 to-stone-900'}`}>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">{a.category}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold leading-snug tracking-tight">{a.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{a.excerpt}</p>
                    <p className="mt-3 text-xs font-medium text-stone-400">{a.author} · {a.date}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ============ COMMUNITY REVIEWS ============ */}
        <section>
          <SectionHeading kicker="Community" title="Latest reviews" />
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <Card key={r.id} className="flex flex-col p-5">
                <div className="mb-2 flex items-center justify-between">
                  <StarRating value={r.rating} size={14} />
                  {r.verifiedPurchase && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Verified</span>}
                </div>
                <h3 className="font-display text-[17px] font-semibold leading-snug">&ldquo;{r.title}&rdquo;</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{r.body}</p>
                <div className="mt-4 flex items-center justify-between border-t border-stone-200/60 pt-3 text-[13px] dark:border-ink-700/50">
                  <Link href={`/member/${r.username}`} className="font-semibold text-gold-700 hover:underline dark:text-gold-300">@{r.username}</Link>
                  <Link href={`/perfume/${r.perfume.slug}`} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">on {r.perfume.name} →</Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ============ TRUST BAND ============ */}
        <section>
          <Card className="grid gap-6 p-6 sm:p-10 md:grid-cols-3">
            {[
              ['🧪', 'Independently lab-tested', 'Similarity scores come from blind panel tests — never from brand marketing claims.'],
              ['🌡️', 'Tested for Indian climate', 'Every score is measured in real Indian heat and humidity, not a European lab.'],
              ['🛡️', 'Verified sellers only', 'Prices come from vetted Indian sellers. No grey-market listings, ever.'],
            ].map(([icon, t, b]) => (
              <div key={t} className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-600/10 text-2xl">{icon}</span>
                <div><h3 className="font-display text-lg font-semibold">{t}</h3><p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{b}</p></div>
              </div>
            ))}
            <div className="md:col-span-3 flex flex-wrap gap-3">
              <Link href="/methodology"><Button variant="outline" size="sm">Our methodology</Button></Link>
              <Link href="/trust-charter"><Button variant="outline" size="sm">Trust charter</Button></Link>
              <Link href="/fake-guide"><Button variant="outline" size="sm">Spot fakes guide</Button></Link>
              {demo && <span className="inline-flex items-center text-xs text-stone-400">Scores shown on this demo build are illustrative samples, not completed lab tests.</span>}
            </div>
          </Card>
        </section>

        <p className="pb-4 text-center text-sm text-stone-400">
          {stats.perfumes} perfumes · {stats.houses} houses · {stats.reviews.toLocaleString('en-IN')}+ reviews · {stats.members.toLocaleString('en-IN')}+ members
        </p>
      </div>
    </div>
  );
}
