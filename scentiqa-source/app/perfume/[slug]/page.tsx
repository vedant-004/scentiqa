import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTopPerfumeSlugs, getPerfume } from '@/lib/data';
import { CONC_LABEL, HOUSE_TYPE_LABEL, inr } from '@/lib/utils';
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo';
import {
  AccordPyramid, BottleVisual, Breadcrumbs, DupeCard, NotePyramid, ProductImage,
  PerfumeCard, PriceTable, RetailerSearchLinks, ScoreBadge, ShareButtons, StarRating,
} from '@/components';
import {
  MeterVote, PriceAlertButton, ReportPriceButton, ReviewList, ReviewModal, SentimentVote,
  StickyCTA, SuggestDupe, WardrobeButtons, ClimateSection, BlindBuyBadge,
} from './perfume-client';

// Revalidate daily so new catalog data (notes, accords, prices) appears without
// a redeploy, while keeping ISR write volume low.
export const revalidate = 604800; // weekly: perfume data rarely changes (was daily, burned ISR quota)
import { AIPredictions } from './ai-predictions';

// Note images (Wikimedia Commons). Absent file or missing entries fall back
// to elegant monogram placeholders inside NotePyramid — never broken images.
let noteImages: Record<string, string | null> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m = require('@/lib/note-images.json') as Record<string, { image: string | null }>;
  for (const [k, v] of Object.entries(m)) noteImages[k] = v?.image ?? null;
} catch { /* images not gathered yet — placeholders render instead */ }

export async function generateStaticParams() {
  // Pre-render the 5,000 most-rated perfumes at build time; the rest of the
  // catalog renders on demand and is cached (ISR, revalidate = 3600).
  const slugs = await getTopPerfumeSlugs(5000);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) return { title: 'Not found' };
  const topDupe = p.dupes[0];
  const { SITE_URL } = await import('@/lib/site-url');
  return {
    title: `${p.name} Dupe, Price in India & Review`,
    description: topDupe
      ? `${p.name} by ${p.houseInfo.name}: best Indian dupe ${topDupe.dupe.name} (${topDupe.similarityScore}% lab match) at ${inr(topDupe.lowestPrice?.priceInr)}, verified INR prices, and climate-tested review.`
      : `${p.name} by ${p.houseInfo.name}: honest review, INR prices from verified Indian sellers, and climate performance.`,
    alternates: { canonical: `${SITE_URL}/perfume/${slug}` },
    openGraph: {
      title: `${p.name} by ${p.houseInfo.name} | Scentarchy`,
      description: `${p.name} by ${p.houseInfo.name}: honest review, INR prices from verified Indian sellers.`,
      url: `${SITE_URL}/perfume/${slug}`,
      images: p.bottleImage ? [{ url: p.bottleImage, alt: `${p.name} by ${p.houseInfo.name}` }] : [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: `${p.name}` }],
    },
  };
}

const GENDER_LABEL = { men: 'For Men', women: 'For Women', unisex: 'Unisex' } as const;

// Reciprocal blog links (SEO): perfume pages link back to relevant blog posts.
// Matching is data-driven: name/inspiredBy for Sauvage, real notes/accords for
// oud and summer, gender+price for the office post, house type for the fakes guide.
function relatedGuides(p: {
  name: string; gender: string; lowestPriceInr: number | null;
  inspiredBy: string | null; houseInfo: { type: string };
  accords: Array<{ name: string }>; topNotes: string[]; heartNotes: string[]; baseNotes: string[];
}): Array<{ href: string; label: string }> {
  const guides: Array<{ href: string; label: string }> = [];
  const nameLower = p.name.toLowerCase();
  const inspiredLower = (p.inspiredBy ?? '').toLowerCase();
  const allNotes = [...p.topNotes, ...p.heartNotes, ...p.baseNotes].map((n) => n.toLowerCase());
  const accordNames = p.accords.map((a) => a.name.toLowerCase());
  const scentWords = [...allNotes, ...accordNames];

  if (nameLower.includes('sauvage') || inspiredLower.includes('sauvage')) {
    guides.push({ href: '/blog/dior-sauvage-vs-indian-dupes', label: 'Dior Sauvage vs Indian dupes: honest comparison' });
  }
  if (scentWords.some((w) => w.includes('oud'))) {
    guides.push({ href: '/blog/what-is-oud-beginners-guide-india', label: "What is oud? A beginner's guide" });
  }
  if (p.gender === 'men' && p.lowestPriceInr !== null && p.lowestPriceInr < 3000) {
    guides.push({ href: '/blog/best-office-perfumes-men-india-under-3000', label: 'Best office perfumes for men under \u20B93,000' });
  }
  if (scentWords.some((w) => ['citrus', 'bergamot', 'aquatic', 'marine', 'fresh', 'green', 'lemon', 'lime', 'grapefruit', 'neroli'].some((k) => w.includes(k)))) {
    guides.push({ href: '/blog/best-long-lasting-perfumes-indian-summer-2026', label: 'Best long-lasting perfumes for Indian summers' });
  }
  if (p.houseInfo.type === 'designer' || p.houseInfo.type === 'niche') {
    guides.push({ href: '/blog/how-to-spot-fake-perfumes-india', label: 'How to spot fake perfumes in India' });
  }
  return guides.slice(0, 3);
}

export default async function PerfumePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) notFound();

  const dupePrices = p.dupes.map((d) => d.lowestPrice?.priceInr ?? Infinity).filter(Number.isFinite);
  const bestDupePrice = dupePrices.length ? Math.min(...dupePrices) : null;
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

  const { SITE_URL } = await import('@/lib/site-url');
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Houses', item: `${SITE_URL}/houses` },
      { '@type': 'ListItem', position: 3, name: p.houseInfo.name, item: `${SITE_URL}/house/${p.houseInfo.slug}` },
      { '@type': 'ListItem', position: 4, name: p.name, item: `${SITE_URL}/perfume/${slug}` },
    ],
  };

  // FAQ schema for AI Overviews and rich results
  const faqs: Array<{ q: string; a: string }> = [];
  if (p.lowestPriceInr) {
    faqs.push({
      q: `What is the price of ${p.name} in India?`,
      a: `${p.name} by ${p.houseInfo.name} starts at ${inr(p.lowestPriceInr)} in India from verified sellers. Prices vary by bottle size and seller.`,
    });
  }
  if (p.isDupe && p.inspiredBy) {
    faqs.push({
      q: `Is ${p.name} a good dupe for ${p.inspiredBy}?`,
      a: `${p.name} is inspired by ${p.inspiredBy}. Scentarchy tracks community-reported similarity to help you decide if it matches your expectations.`,
    });
  }
  const topAccords = (p.accords ?? []).slice(0, 3).map((a: { name: string }) => a.name).join(', ');
  if (topAccords) {
    faqs.push({
      q: `What does ${p.name} smell like?`,
      a: `${p.name} features ${topAccords} as its dominant accords. ${p.description ? p.description.slice(0, 200) : ''}`,
    });
  }
  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Houses', href: '/houses' }, { label: p.houseInfo.name, href: `/house/${p.houseInfo.slug}` }, { label: p.name }]} />

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
            {p.ratingCount > 0 && (
              <p className="mt-1 text-center text-xs text-stone-500 dark:text-stone-400" title="Aggregated rating imported from global fragrance-community data. Scentarchy member reviews are listed separately below.">
                Global fragrance-community rating
              </p>
            )}
          </div>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[300px_1fr]">
            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-cream-100 to-gold-300/25 py-8 dark:from-ink-800 dark:to-gold-700/10">
              <div className="animate-float"><ProductImage name={p.name} house={p.houseInfo.name} image={p.bottleImage} size="lg" /></div>
            </div>
            <div className="min-w-0">
              <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-stone-400 sm:text-left">Main accords</h2>
              <AccordPyramid accords={p.accords} />
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 border-t border-stone-200/70 pt-6 dark:border-ink-700/50">
            <SentimentVote perfumeId={p.id} />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <WardrobeButtons perfumeId={p.id} name={p.name} />
              <ShareButtons title={`${p.name} by ${p.houseInfo.name} — Scentarchy`} path={`/perfume/${p.slug}`} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-12">
          {/* ===== 2. ACCORDS + NOTES ===== */}
          <section>
            <SectionHeading kicker="Composition" title="What it smells like" />
            <Card className="p-6"><h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-stone-400">Notes</h3><NotePyramid top={p.topNotes} heart={p.heartNotes} base={p.baseNotes} images={noteImages} /></Card>
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

          {/* ===== 3. INDIAN ALTERNATIVES ===== */}
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
              <strong className="text-stone-700 dark:text-stone-200">Independence note:</strong> “House claims X%” is the brand&rsquo;s own marketing. “Scentarchy lab” scores are currently <em>estimates</em> from note overlap and community signals — no blind-panel tests completed yet. Dupes are listed under their own names; “inspired by” lines are editorial, not affiliation. <Link href="/methodology" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Methodology →</Link>
            </p>
          </section>

          {/* ===== 5. WHERE TO BUY ===== */}
          <section>
            <SectionHeading kicker="Verified sellers" title="Where to buy in India"
              action={<PriceAlertButton perfumeId={p.id} currentPrice={p.lowestPriceInr} />} />
            <div className="mb-4"><BlindBuyBadge slug={slug} /></div>
            <PriceTable prices={p.prices} />
            <RetailerSearchLinks perfumeName={p.name} houseName={p.houseInfo.name} />
            <ReportPriceButton perfumeId={p.id} />
          </section>

          {/* ===== 5. CLIMATE PERFORMANCE LAB (single heat model) ===== */}
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
            {(p.memberRatingCount ?? 0) > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <StarRating value={p.memberRatingAvg ?? 0} count={p.memberRatingCount} size={15} />
                <span className="text-xs text-stone-500 dark:text-stone-400" title="Average of written reviews by Scentarchy members on this page.">
                  Scentarchy member rating
                </span>
              </div>
            )}
            {p.reviews.length === 0 ? (
              <EmptyState icon="✍️" title="No reviews yet" body="Be the first to review this fragrance for the Indian community." action={<ReviewModal perfume={p} triggerLabel="Write the first review" />} />
            ) : (
              <ReviewList perfume={p} initialReviews={p.reviews} />
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

          {/* ===== 9. RELATED GUIDES (reciprocal blog links) ===== */}
          {(() => {
            const guides = relatedGuides(p);
            return guides.length > 0 ? (
              <section>
                <SectionHeading kicker="From the journal" title="Related guides" />
                <Card className="p-6">
                  <ul className="space-y-2.5">
                    {guides.map((g) => (
                      <li key={g.href}>
                        <Link href={g.href} className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
                          {g.label} &rarr;
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            ) : null;
          })()}
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
                <p className="mt-0.5 text-xs text-stone-500">Best alternative from {inr(bestDupePrice)}</p>
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
