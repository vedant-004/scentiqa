import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllBlogPosts, getBlogPost, markdownToHtml } from '@/lib/blog';
import { SITE_URL } from '@/lib/site-url';
import { Breadcrumbs } from '@/components';
import { JsonLd } from '@/components/seo';

// Related internal links for each blog post (SEO: distributes link equity, improves crawl depth)
const RELATED_LINKS: Record<string, Array<{ href: string; label: string }>> = {
  'best-long-lasting-perfumes-indian-summer-2026': [
    { href: '/weather', label: 'Find perfumes for your weather' },
    { href: '/notes/bergamot', label: 'Bergamot: the ultimate summer note' },
    { href: '/vs/sauvage-dior-vs-stronger-with-you-intensely', label: 'Sauvage vs Stronger With You Intensely' },
    { href: '/blog/what-is-oud-beginners-guide-india', label: 'What is oud? A beginner\u2019s guide' },
    { href: '/finder', label: 'AI Perfume Finder: find your summer scent' },
  ],
  'dior-sauvage-vs-indian-dupes': [
    { href: '/vs/sauvage-dior-vs-9pm', label: 'Sauvage vs Afnan 9PM compared' },
    { href: '/dupes', label: 'Browse all dupe guides' },
    { href: '/blog/how-to-spot-fake-perfumes-india', label: 'How to spot fake perfumes in India' },
    { href: '/notes/ambroxan', label: 'Ambroxan: the Sauvage DNA note' },
    { href: '/finder', label: 'Find your signature scent with AI' },
  ],
  'what-is-oud-beginners-guide-india': [
    { href: '/notes/oud', label: 'Oud note: perfumes that feature it' },
    { href: '/blog/best-long-lasting-perfumes-indian-summer-2026', label: 'Best long-lasting perfumes for Indian summers' },
    { href: '/vs/baccarat-rouge-540-vs-9pm', label: 'Baccarat Rouge 540 vs Afnan 9PM' },
    { href: '/climate', label: 'India Heat Scores: how perfumes perform in heat' },
    { href: '/quiz', label: 'Take the scent quiz' },
  ],
  'how-to-spot-fake-perfumes-india': [
    { href: '/blog/dior-sauvage-vs-indian-dupes', label: 'Dior Sauvage vs Indian dupes' },
    { href: '/dupes', label: 'Browse verified dupe guides' },
    { href: '/blog/best-office-perfumes-men-india-under-3000', label: 'Best office perfumes under \u20B93,000' },
    { href: '/sellers', label: 'Verified sellers in India' },
    { href: '/finder', label: 'AI Perfume Finder' },
  ],
  'best-office-perfumes-men-india-under-3000': [
    { href: '/occasions', label: 'Perfumes for every occasion' },
    { href: '/blog/best-long-lasting-perfumes-indian-summer-2026', label: 'Best summer perfumes for India' },
    { href: '/vs/bleu-de-chanel-parfum-vs-dior-homme', label: 'Bleu de Chanel vs Dior Homme' },
    { href: '/notes/vetiver', label: 'Vetiver: the ultimate office note' },
    { href: '/quiz', label: 'Find your scent profile' },
  ],
};

// FAQs per post (SEO + AI Overviews: FAQPage schema and visible FAQ section).
// Answers summarize the post content; no invented facts.
const POST_FAQS: Record<string, Array<{ q: string; a: string }>> = {
  'best-long-lasting-perfumes-indian-summer-2026': [
    { q: 'Why do perfumes not last long in Indian summers?', a: 'Three things work against fragrance in Indian heat: high temperatures accelerate evaporation of top and heart notes, humidity flattens projection so the scent trail disappears, and sweat can distort sweet or heavy compositions. A perfume that lasts 8 hours in European spring may barely survive 3 hours in an Indian May.' },
    { q: 'Which perfume notes work best in summer heat?', a: 'Citrus notes (bergamot, grapefruit, lemon, yuzu), aquatic and marine notes, green notes like vetiver and green tea, light white musks, and crisp aromatics like rosemary and sage. These feel refreshing rather than heavy when temperatures climb.' },
    { q: 'Does EDP last longer than EDT in summer?', a: 'Not necessarily. Composition matters more than concentration in heat. An eau de toilette with strong citrus-aquatic bones can outlast a weak eau de parfum. Look for vetiver and ambroxan in the base — they are the workhorses of summer longevity.' },
    { q: 'How can I make my perfume last longer in Indian heat?', a: 'Spray on clothes rather than just skin, since fabric holds scent far longer than hot skin. Moisturise first with an unscented lotion, never rub your wrists together, carry a small travel atomiser for a midday refresh, and store bottles away from heat and sunlight.' },
    { q: 'Which notes should I avoid in Indian summers?', a: 'Go easy on thick vanillas, heavy ouds, dense ambers and very sweet gourmands during peak afternoon heat — they struggle most and can turn cloying when mixed with perspiration. A light touch can still work for summer evenings.' },
  ],
  'best-office-perfumes-men-india-under-3000': [
    { q: 'What makes a good office fragrance for men?', a: 'An office fragrance should have moderate projection (noticeable within arm\u2019s length, not across the room), an inoffensive character (clean, fresh, woody or softly spicy), and at least 5–6 hours of longevity so you are not reapplying at your desk.' },
    { q: 'How many sprays of perfume should I use for office?', a: 'For fresh or aquatic scents, 3–4 sprays. For citrus scents, 2–3 sprays since citrus projects more than expected in the first hour. For woody or spicy scents, 2 sprays maximum — they fill a room faster. Spray one less than you think you need for the commute.' },
    { q: 'Where should I spray perfume for work?', a: 'One spray on each side of the neck and one on the chest under your shirt — the shirt diffuses the scent gently through the day. Avoid spraying wrists if you shake hands frequently.' },
    { q: 'Which fragrances should men avoid wearing to the office in India?', a: 'Avoid heavy ouds and attars, very sweet gourmands, and anything so strong you have to ask whether it is too much. Also skip reapplying at your desk in an open office.' },
    { q: 'Can I build an office fragrance rotation under \u20B93,000?', a: 'Yes. A smart two-bottle rotation covers almost everything: one fresh daily driver (like Nautica Voyage or Wild Stone) for regular days, plus one step-up option (like Armaf Club de Nuit Sillage or Skinn Verge) for presentations and client meetings — both well under \u20B93,000 combined.' },
  ],
  'dior-sauvage-vs-indian-dupes': [
    { q: 'What does Dior Sauvage actually smell like?', a: 'Sauvage opens with Calabrian bergamot and pepper, has ambroxan (a synthetic ambergris note) at its heart, and dries down to ambroxan with cedar and labdanum. The overall effect is fresh but not aquatic, spicy but not hot — a balance that works well in Indian weather.' },
    { q: 'Why is Dior Sauvage so heavily duped in India?', a: 'Three reasons: the formula is relatively simple (bergamot, pepper, ambroxan, woods) so there are fewer barriers to imitation; demand is enormous; and ambroxan itself is an inexpensive raw material, so the core of the scent can be reproduced cheaply.' },
    { q: 'What do Indian Sauvage dupes get right and wrong?', a: 'Good dupes nail the ambroxan drydown, the overall fresh-spicy-woody vibe, and of course the price. Where they typically fall short: the bergamot opening (cheaper citrus that fades fast), blending smoothness, and batch-to-batch consistency.' },
    { q: 'Should I buy original Dior Sauvage or an Indian dupe?', a: 'Buy the original if you want the refined bergamot opening, guaranteed consistency, or are gifting. Buy a dupe if you want the Sauvage profile for daily wear at a fraction of the price, or mainly care about the drydown. Many enthusiasts keep both — original for evenings, dupe for office and gym.' },
    { q: 'How should I shop for a Sauvage dupe in India?', a: 'Sample before committing — reputable Indian clone houses sell discovery sets or 10–30ml bottles. Never blind-buy 100ml of a dupe, and remember quality can vary between batches from the same house.' },
  ],
  'how-to-spot-fake-perfumes-india': [
    { q: 'What is the biggest sign of a fake perfume in India?', a: 'An impossibly low price. Every genuine perfume has a floor price set by brand pricing, import duties and retail margins. A 15–30% discount from a known grey-market seller can be genuine, but an 80% discount is not grey market — it is fake.' },
    { q: 'How do I check a perfume batch code?', a: 'Find the batch code on both the box and the bottle — they must match each other. Enter the code on a batch code checker website with the brand name. The decoded manufacturing date should be plausible. A missing code, or codes that differ between box and bottle, is a strong warning sign.' },
    { q: 'Are Instagram and WhatsApp perfume sellers safe in India?', a: 'They are structurally riskier because there is no accountability. Check how long the seller has operated, whether they have a physical store or registered business, and whether reviews mention authenticity over a long period. Safer channels include brand counters, official websites, and authorised retailers.' },
    { q: 'What should I do if I already bought a fake perfume?', a: 'Stop using it immediately since counterfeits are unregulated and can cause skin reactions. Photograph the product, packaging, batch codes and order confirmation. Request a refund through the platform\u2019s buyer protection process, and report the seller to protect other buyers.' },
    { q: 'How can I tell a fake perfume by its smell?', a: 'Fakes often have a harsh alcohol blast at the opening, smell flat and one-dimensional without the evolution of genuine top, heart and base notes, and fade far faster than the authentic fragrance. Comparing against a verified sample side by side is the single best test.' },
  ],
  'what-is-oud-beginners-guide-india': [
    { q: 'What exactly is oud?', a: 'Oud (also spelled oudh) comes from agarwood trees, primarily Aquilaria species. Healthy agarwood is odourless — oud only forms when the tree is infected by a specific mould and produces a dark fragrant resin to fight it. That resin-saturated wood is distilled into oud oil, which is why real oud is rare and expensive.' },
    { q: 'What does real oud smell like?', a: 'On first encounter it often smells medicinal and woody with animalic, leathery facets — strong Hindi varieties can even smell barnyardy at the opening. The drydown is where oud becomes beautiful: deep, smooth, enveloping woodiness that can last on skin for a full day.' },
    { q: 'Do designer oud perfumes contain real oud oil?', a: 'Usually not. Most designer oud fragrances use synthetic oud accords — laboratory-created molecules that suggest oud\u2019s woody warmth at a fraction of the cost. Real oud oil is sold as attar in small bottles or used in tiny percentages in ultra-expensive niche perfumes.' },
    { q: 'How much should real oud oil cost in India?', a: 'Real oud cannot be cheap. Even cultivated Hindi oud oil of decent quality typically starts in the thousands of rupees for just 3ml, and good wild oil costs many times more. Anyone offering pure Assam oud oil for a few hundred rupees is not selling pure oud oil.' },
    { q: 'How can I buy oud in India without getting scammed?', a: 'Buy from established attar houses — Kannauj, Old Delhi\u2019s Dariba Kalan and Hyderabad\u2019s attar markets have generations-old sellers. Start with small 1–3ml quantities, learn the smell through honest blends before spending big, and be sceptical of sellers claiming the finest wild grade at the cheapest price.' },
  ],
};

export async function generateStaticParams() {
  return getAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Not found' };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: `${post.title} | Scentarchy`,
      description: post.description,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'Scentarchy', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Scentarchy',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512 },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  };

  const related = RELATED_LINKS[slug] ?? [];
  const faqs = POST_FAQS[slug] ?? [];

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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JsonLd data={articleJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Journal', href: '/blog' }, { label: post.title }]} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
        {post.date ? new Date(post.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-stone-500 dark:text-stone-400">{post.description}</p>
      {/* Author block: authorship signal for E-E-A-T */}
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F01348] to-[#e3b93c] font-display text-xl font-bold text-white" aria-hidden="true">S</div>
        <div>
          <p className="text-sm font-bold">Scentarchy Editorial Team</p>
          <p className="mt-0.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            India-focused fragrance research: notes, accords, dupes and prices verified against the Scentarchy catalog of 13,000+ perfumes.
          </p>
        </div>
      </div>
      <article
        className="prose-blog mt-8"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
      />
      {faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-stone-200/70 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <summary className="cursor-pointer text-sm font-bold marker:text-gold-600">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="mt-12 rounded-2xl border border-stone-200/70 bg-stone-50 p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="font-display text-xl font-bold">Related reads</h2>
          <ul className="mt-4 space-y-2">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
                  {r.label} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
