import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPerfumeSlugs, getPerfume } from '@/lib/data';
import { CONC_LABEL, HOUSE_TYPE_LABEL, inr } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo';
import {
  AccordStack, BottleVisual, Breadcrumbs, DupeCard, MeterBar, NotePyramid, ProductImage,
  PerfumeCard, PriceTable, ScoreBadge, ShareButtons, StarRating,
} from '@/components';
import {
  MeterVote, PriceAlertButton, ReportPriceButton, ReviewModal, SentimentVote,
  StickyCTA, SuggestDupe, WardrobeButtons, ClimateSection, BlindBuyBadge,
} from './perfume-client';
import { AIPredictions } from './ai-predictions';

export async function generateStaticParams() {
  const slugs = await getAllPerfumeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) return { title: 'Not found' };
  const topDupe = p.dupes[0];
  return {
    title: `${p.name} Dupe, Price in India & Review`,
    description: topDupe
      ? `${p.name} by ${p.houseInfo.name}: best Indian dupe ${topDupe.dupe.name} (${topDupe.similarityScore}% lab match) at ${inr(topDupe.lowestPrice?.priceInr)}, verified INR prices, and climate-tested review.`
      : `${p.name} by ${p.houseInfo.name}: honest review, INR prices from verified Indian sellers, and climate performance.`,
  };
}

const GENDER_LABEL = { men: 'For Men', women: 'For Women', unisex: 'Unisex' } as const;

export default async function PerfumePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) notFound();

  const bestDupePrice = p.dupes.length
    ? Math.min(...p.dupes.map((d) => d.lowestPrice?.priceInr ?? Infinity).filter(Number.isFinite))
    : null;
  const labDupes = p.dupes.filter((d) => d.testedBy === 'lab');
  const communityDupes = p.dupes.filter((d) => d.testedBy !== 'lab');

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${p.name} by ${p.houseInfo.name}`,
    description: p.description,
    brand: { '@type': 'Brand', name: p.houseInfo.name },
    ...(p.ratingCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.ratingAvg, reviewCount: p.ratingCount } } : {}),
    ...(p.prices.length ? {
      offers: p.prices.slice(0, 5).map((pr) => ({
        '@type': 'Offer',
        price: pr.priceInr,
        priceCurrency: 'INR',
        availability: pr.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: pr.seller },
      })),
    } : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <JsonLd data={productJsonLd} />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Houses', href: `/house/${p.houseInfo.slug}` }, { label: p.houseInfo.name, href: `/house/${p.houseInfo.slug}` }, { label: p.name }]} />

      {/* ===== 1. HEADER — Fragrantica-style product hero ===== */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/70 bg-white dark:border-ink-700/50 dark:bg-ink-900">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-300/20 via-transparent to-transparent dark:from-gold-600/10" aria-hidden="true" />
        <div className="relative p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {p.isDupe && p.inspiredBy && <Badge className="bg-gold-600/15 text-gold-700 dark:text-gold-300">Inspired by {p.inspiredBy}</Badge>}
            {p.real
              ? <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" title={p.priceProvenance && p.priceProvenance !== 'demo' ? `Price provenance: ${p.priceProvenance}` : undefined}>Real catalog data · researched {p.observedAt ? new Date(p.observedAt + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Sep 2026'}</Badge>
              : <Badge className="bg-stone-900/5 text-stone-500 dark:bg-white/5 dark:text-stone-400" title="Synthetic sample record for demo purposes">Sample data</Badge>}
            <Badge className="bg-stone-900/5 text-stone-600 dark:bg-white/10 dark:text-stone-300">{HOUSE_TYPE_LABEL[p.houseInfo.type]}</Badge>
          </div>
          <div className="mt-3 text-center">
            <Link href={`/house/${p.houseInfo.slug}`} className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600 hover:underline dark:text-gold-400">{p.houseInfo.name}</Link>
            <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-5xl">
              {p.name}{' '}
              <span className="whitespace-nowrap font-sans text-[0.5em] font-semibold text-gold-600 dark:text-gold-400">{GENDER_LABEL[p.gender].toLowerCase()}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
              {p.launchYear ? <><span>{p.launchYear}</span><span aria-hidden="true">·</span></> : null}<span>{CONC_LABEL[p.concentration] ?? p.concentration}</span>
            </div>
            <div className="mt-3 flex justify-center"><StarRating value={p.ratingAvg} count={p.ratingCount} size={18} /></div>
          </div>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[300px_1fr]">
            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-cream-100 to-gold-300/25 py-8 dark:from-ink-800 dark:to-gold-700/10">
              <div className="animate-float"><ProductImage name={p.name} house={p.houseInfo.name} image={p.bottleImage} size="lg" /></div>
            </div>
            <div className="min-w-0">
              <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-stone-400 sm:text-left">Main accords</h2>
              <AccordStack accords={p.accords} />
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 border-t border-stone-200/70 pt-6 dark:border-ink-700/50">
            <SentimentVote perfumeId={p.id} />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <WardrobeButtons perfumeId={p.id} name={p.name} />
              <ShareButtons title={`${p.name} by ${p.houseInfo.name} — Scentiqa`} path={`/perfume/${p.slug}`} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-12">
          {/* ===== 2. ACCORDS + NOTES ===== */}
          <section>
            <SectionHeading kicker="Composition" title="What it smells like" />
            <Card className="p-6"><h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-stone-400">Notes</h3><NotePyramid top={p.topNotes} heart={p.heartNotes} base={p.baseNotes} /></Card>
            <p className="mt-4 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{p.description}</p>
            {p.scentStory && (
              <Card className="relative mt-6 overflow-hidden p-6 sm:p-8">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold-400 to-gold-600" aria-hidden="true" />
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-300">Scent story</h3>
                <blockquote className="whitespace-pre-line font-display text-[17px] italic leading-relaxed text-stone-700 dark:text-stone-200">
                  {p.scentStory}
                </blockquote>
                {p.beginnerFriendly !== null && (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-900/5 px-3 py-1.5 text-xs font-bold text-stone-600 dark:bg-white/10 dark:text-stone-300">
                    {p.beginnerFriendly ? '✓ Beginner-friendly' : '⚠ Not for beginners'}
                  </p>
                )}
              </Card>
            )}
          </section>

          {/* ===== 2b. AI PREDICTIONS ===== */}
          <AIPredictions perfumeId={p.id} concentration={p.concentration} />

          {/* ===== 3. CLIMATE PANEL ===== */}
          {p.climate && (
            <section>
              <SectionHeading kicker="Scentiqa climate lab" title="Performance in Indian weather"
                action={<Link href="/climate-protocol" className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">How we test →</Link>} />
              <Card className="p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <MeterBar label="Longevity in heat" value={p.climate.heatLongevity} hint="How long it lasts at 35°C+" />
                  <MeterBar label="Sillage in humidity" value={p.climate.humiditySillage} hint="Projection when humidity is high" />
                  <MeterBar label="Summer rating" value={p.climate.summerRating} />
                  <MeterBar label="Monsoon rating" value={p.climate.monsoonRating} />
                  <MeterBar label="Winter rating" value={p.climate.winterRating} />
                </div>
                <p className="mt-5 border-t border-stone-200/70 pt-4 text-xs leading-relaxed text-stone-400 dark:border-ink-700/50">
                  Tested at {p.climate.testTempC}°C / {p.climate.testHumidityPct}% humidity · {p.climate.sprays} sprays · {p.climate.testerCount} testers. {p.climate.notes}
                  {!isSupabaseConfigured() && <span className="font-semibold"> Sample data shown in this demo build.</span>}
                </p>
              </Card>
            </section>
          )}

          {/* ===== 4. INDIAN ALTERNATIVES ===== */}
          <section id="alternatives" className="scroll-mt-24">
            <SectionHeading kicker="Dupe lab" title={`Indian alternatives (${p.dupes.length})`}
              action={<SuggestDupe perfumeId={p.id} perfumeName={p.name} />} />
            {p.dupes.length === 0 ? (
              <EmptyState icon="🔬" title="No alternatives mapped yet"
                body="Our lab hasn't tested a dupe for this one. Know a good Indian alternative? Suggest it and our moderators will review it."
                action={<SuggestDupe perfumeId={p.id} perfumeName={p.name} />} />
            ) : (
              <div className="space-y-4">
                {labDupes.map((d) => <DupeCard key={d.id} entry={d} originalName={p.name} />)}
                {communityDupes.length > 0 && (
                  <div className="pt-2">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-400">Community suggested — not lab tested</h3>
                    <div className="space-y-4">{communityDupes.map((d) => <DupeCard key={d.id} entry={d} originalName={p.name} />)}</div>
                  </div>
                )}
              </div>
            )}
            <p className="mt-4 rounded-xl bg-cream-100/70 p-4 text-xs leading-relaxed text-stone-500 dark:bg-white/[0.03] dark:text-stone-400">
              <strong className="text-stone-700 dark:text-stone-200">Independence note:</strong> “House claims X%” is the brand&rsquo;s own marketing. “Scentiqa lab” is our blind-panel measurement. Dupes are listed under their own names; “inspired by” lines are editorial, not affiliation. <Link href="/methodology" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Methodology →</Link>
            </p>
          </section>

          {/* ===== 5. WHERE TO BUY ===== */}
          <section>
            <SectionHeading kicker="Verified sellers" title="Where to buy in India"
              action={<PriceAlertButton perfumeId={p.id} currentPrice={p.lowestPriceInr} />} />
            <div className="mb-4"><BlindBuyBadge slug={slug} /></div>
            <PriceTable prices={p.prices} />
            <ReportPriceButton perfumeId={p.id} />
          </section>

          {/* ===== 5b. CLIMATE PERFORMANCE LAB ===== */}
          <section>
            <SectionHeading kicker="Climate Performance Lab" title="India Heat Performance" />
            <Card className="p-5">
              <ClimateSection slug={slug} perfumeId={p.id} perfumeName={p.name} />
            </Card>
          </section>

          {/* ===== 6. COMMUNITY VOTES ===== */}
          <section>
            <SectionHeading kicker="Community" title="How members rate it" />
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="p-5"><MeterVote label="Longevity" perfumeId={p.id} voteType="longevity" /></Card>
              <Card className="p-5"><MeterVote label="Sillage" perfumeId={p.id} voteType="sillage" /></Card>
              <Card className="p-5"><MeterVote label="Value for money" perfumeId={p.id} voteType="value" /></Card>
              <Card className="p-5"><MeterVote label="Summer wearability" perfumeId={p.id} voteType="season" /></Card>
            </div>
          </section>

          {/* ===== 7. REVIEWS ===== */}
          <section>
            <SectionHeading kicker="Reviews" title={`Member reviews (${p.reviews.length})`}
              action={<ReviewModal perfume={p} />} />
            {p.reviews.length === 0 ? (
              <EmptyState icon="✍️" title="No reviews yet" body="Be the first to review this fragrance for the Indian community." action={<ReviewModal perfume={p} triggerLabel="Write the first review" />} />
            ) : (
              <div className="space-y-4">
                {p.reviews.map((r) => (
                  <Card key={r.id} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <StarRating value={r.rating} size={14} />
                      {r.verifiedPurchase && <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">✓ Verified purchase</span>}
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold">{r.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{r.body}</p>
                    <div className="mt-3 flex items-center justify-between text-[13px]">
                      <Link href={`/member/${r.username}`} className="font-semibold text-gold-700 hover:underline dark:text-gold-300">@{r.username}</Link>
                      <span className="text-stone-400">Helpful ({r.helpfulVotes})</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ===== 8. SIMILAR ===== */}
          {p.similar.length > 0 && (
            <section>
              <SectionHeading kicker="Keep exploring" title="Similar fragrances" />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {p.similar.slice(0, 4).map((s) => <PerfumeCard key={s.slug} perfume={s} />)}
              </div>
            </section>
          )}
        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h3 className="mb-3 font-display text-lg font-semibold">At a glance</h3>
            <dl className="space-y-2.5 text-sm">
              {[['House', p.houseInfo.name], ['Launched', p.launchYear ? String(p.launchYear) : '—'], ['Concentration', CONC_LABEL[p.concentration] ?? p.concentration], ['Best price', inr(p.lowestPriceInr)], ['Lab-tested dupes', String(labDupes.length)]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-stone-400">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
              ))}
            </dl>
            {bestDupePrice !== null && p.lowestPriceInr && (
              <div className="mt-4 rounded-xl bg-emerald-500/10 p-3.5 text-sm">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">💰 Dupe route saves {inr(p.lowestPriceInr - bestDupePrice)}</p>
                <p className="mt-0.5 text-xs text-stone-500">Best lab-tested alternative from {inr(bestDupePrice)}</p>
              </div>
            )}
          </Card>
          {p.originalOf.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-2 font-display text-lg font-semibold">This is a dupe of</h3>
              {p.originalOf.map((rel) => (
                <Link key={rel.id} href={`/perfume/${rel.originalSlug}`} className="group flex items-center gap-3">
                  <ScoreBadge score={rel.similarityScore} size="sm" />
                  <span className="font-semibold group-hover:text-gold-700 dark:group-hover:text-gold-300">{rel.originalSlug.replace(/-/g, ' ')}</span>
                </Link>
              ))}
            </Card>
          )}
          <Card className="p-6">
            <h3 className="mb-2 font-display text-lg font-semibold">About the house</h3>
            <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">{p.houseInfo.description}</p>
            <Link href={`/house/${p.houseInfo.slug}`} className="mt-3 inline-block text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">View house →</Link>
          </Card>
        </aside>
      </div>

      <StickyCTA perfume={p} bestDupePrice={bestDupePrice} />
    </div>
  );
}
