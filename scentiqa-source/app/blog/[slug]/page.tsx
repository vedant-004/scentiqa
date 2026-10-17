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
  'best-winter-perfumes-india-2026': [
    { href: '/blog/best-long-lasting-perfumes-indian-summer-2026', label: 'Best long-lasting perfumes for Indian summers' },
    { href: '/blog/lattafa-khamrah-vs-angel-share', label: 'Lattafa Khamrah vs Kilian Angels Share' },
    { href: '/blog/complete-guide-perfume-dupes-india', label: 'The complete guide to perfume dupes in India' },
    { href: '/perfume/khamrah', label: 'Lattafa Khamrah: price and details' },
    { href: '/weather', label: 'Match perfume to Indian weather' },
  ],
  'lattafa-khamrah-vs-angel-share': [
    { href: '/perfume/khamrah', label: 'Lattafa Khamrah: price and details' },
    { href: '/perfume/angelsshare-kilian', label: 'Kilian Angels Share: details' },
    { href: '/blog/best-winter-perfumes-india-2026', label: '12 best winter perfumes for India' },
    { href: '/blog/complete-guide-perfume-dupes-india', label: 'The complete guide to perfume dupes in India' },
    { href: '/house/lattafa', label: 'Lattafa house: all perfumes' },
  ],
  'best-aventus-dupes-india': [
    { href: '/perfume/aventus', label: 'Creed Aventus: the original' },
    { href: '/perfume/club-de-nuit-intense-man', label: 'Armaf Club de Nuit Intense Man' },
    { href: '/blog/dior-sauvage-vs-indian-dupes', label: 'Dior Sauvage vs Indian dupes' },
    { href: '/blog/complete-guide-perfume-dupes-india', label: 'The complete guide to perfume dupes in India' },
    { href: '/blog/how-to-spot-fake-perfumes-india', label: 'How to spot fake perfumes in India' },
  ],
  'baccarat-rouge-540-dupes-india': [
    { href: '/perfume/baccarat-rouge-540', label: 'Baccarat Rouge 540: the original' },
    { href: '/blog/complete-guide-perfume-dupes-india', label: 'The complete guide to perfume dupes in India' },
    { href: '/blog/best-winter-perfumes-india-2026', label: '12 best winter perfumes for India' },
    { href: '/blog/how-to-spot-fake-perfumes-india', label: 'How to spot fake perfumes in India' },
    { href: '/house/armaf', label: 'Armaf house: all perfumes' },
  ],
  'complete-guide-perfume-dupes-india': [
    { href: '/blog/dior-sauvage-vs-indian-dupes', label: 'Dior Sauvage vs Indian dupes' },
    { href: '/blog/best-aventus-dupes-india', label: '10 best Aventus dupes in India' },
    { href: '/blog/baccarat-rouge-540-dupes-india', label: '8 Baccarat Rouge 540 dupes in India' },
    { href: '/blog/lattafa-khamrah-vs-angel-share', label: 'Lattafa Khamrah vs Kilian Angels Share' },
    { href: '/blog/how-to-spot-fake-perfumes-india', label: 'How to spot fake perfumes in India' },
  ],
  'best-perfumes-men-india-under-1500': [
    { href: '/blog/best-office-perfumes-men-india-under-3000', label: 'Best office perfumes under \u20B93,000' },
    { href: '/blog/best-long-lasting-perfumes-indian-summer-2026', label: 'Best long-lasting perfumes for Indian summers' },
    { href: '/blog/attar-vs-perfume-vs-deo-india', label: 'Attar vs perfume vs deodorant' },
    { href: '/occasions', label: 'Perfumes for every occasion' },
    { href: '/quiz', label: 'Take the scent quiz' },
  ],
  'attar-vs-perfume-vs-deo-india': [
    { href: '/blog/what-is-oud-beginners-guide-india', label: 'What is oud? A beginner\u2019s guide' },
    { href: '/blog/best-perfumes-men-india-under-1500', label: 'Best perfumes under \u20B91,500' },
    { href: '/blog/best-long-lasting-perfumes-indian-summer-2026', label: 'Best long-lasting perfumes for Indian summers' },
    { href: '/blog/complete-guide-perfume-dupes-india', label: 'The complete guide to perfume dupes in India' },
    { href: '/weather', label: 'Match perfume to Indian weather' },
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
  'best-winter-perfumes-india-2026': [
    { q: 'What perfumes work best for Indian winters?', a: 'Warm spices like cinnamon and cardamom, amber, vanilla, oud, and boozy notes perform best. Indian winters are mild by global standards, so the goal is warmth with wearability, not the heaviest winter beasts.' },
    { q: 'Should I spray more or less perfume in winter?', a: 'Less than you think. Cold air slows evaporation so fragrance lasts longer and projects further. Start with your usual spray count and adjust down. Overspraying is the most common winter mistake.' },
    { q: 'Is Lattafa Khamrah good for winter in India?', a: 'Yes, it is one of the best winter picks for India. Cinnamon, dates, and praline over warm vanilla, with famously strong performance, and it is widely available across India at a mass-market price.' },
    { q: 'Where should I spray perfume in winter?', a: 'Target the chest and neck, since winter clothing covers your wrists. One spray on a scarf works too, but test the fabric first as some fragrance oils can stain.' },
    { q: 'How do I make perfume last longer in Indian winter?', a: 'Moisturise first with an unscented lotion, since winter dries out skin and dry skin kills longevity. Spray on clothes as well as skin, fabric holds scent far longer.' },
    { q: 'Can I wear my summer fragrances in Indian winter?', a: 'In mild-winter cities like Mumbai and Bangalore, versatile fresh scents still work. But in North Indian cold, from Delhi fog to Himalayan towns, richer warm and spicy fragrances come into their own.' },
  ],
  'lattafa-khamrah-vs-angel-share': [
    { q: 'Is Lattafa Khamrah a clone of Kilian Angels Share?', a: 'Not officially. Lattafa has never claimed it is a clone. The comparison comes entirely from the fragrance community, who noticed the resemblance. Think of Khamrah as a song in the same genre, not a photocopy.' },
    { q: 'How similar do Khamrah and Angels Share smell?', a: 'They share roughly 75 to 80 percent of their DNA. The resemblance is strongest in the heart, where both settle into warm praline and vanilla. Khamrah opens spicier with cinnamon and dates, while Angels Share is boozier with cognac and oak, and its drydown is more refined.' },
    { q: 'Which lasts longer, Khamrah or Angels Share?', a: 'Khamrah wins on raw performance: 8 to 10 hours on skin with strong projection, and days on clothes. Angels Share lasts around 8 hours but wears closer to the skin in the later hours.' },
    { q: 'Is Lattafa Khamrah worth buying?', a: 'For winter and festive wear in India, it is one of the easiest recommendations in fragrance. It delivers the warm boozy-spicy gourmand experience at a mass-market price, with performance that embarrasses many designer scents.' },
    { q: 'What are Khamrah Qahwa and Khamrah Dukhan?', a: 'Flankers of the original. Khamrah Qahwa adds a coffee note, pushing it further into gourmand territory and smoothing the spice. Khamrah Dukhan (smoke in Arabic) is the smokier, more intense take, harder to find in India.' },
    { q: 'How many sprays of Khamrah should I use?', a: 'Two sprays maximum for most situations, three if outdoors in December. It is a winter and evening fragrance, not a summer office scent. Give the cinnamon opening 15 minutes to settle before judging it.' },
  ],
  'best-aventus-dupes-india': [
    { q: 'What is the best Aventus dupe available in India?', a: 'Armaf Club de Nuit Intense Man is the default community answer worldwide and in India. Its smoky birch drydown gets remarkably close to Aventus, performance is excellent, and it is widely available through Armaf distributors.' },
    { q: 'Do Aventus dupes smell exactly like the original?', a: 'No dupe is identical, and Aventus itself varies by batch, which the fragrance community tracks obsessively. The best dupes nail the smoky birch drydown; most differ in the pineapple opening, which is harsher or more synthetic.' },
    { q: 'Why do Aventus clone batches vary so much?', a: 'Middle Eastern clone houses reformulate quietly and manufacturing varies. Buy recent stock from high-turnover sellers, check batch codes, and let the bottle macerate (rest) for three to four weeks, which smooths out harsh openings.' },
    { q: 'Which Aventus dupe is the most consistent?', a: 'Montblanc Explorer and Mancera Cedrat Boise. Neither plays batch roulette: every bottle smells the same, which is more than Aventus itself can claim. Explorer is smoother and office-friendly; Cedrat Boise is its own confident fruity-woody scent.' },
    { q: 'Which Aventus dupe works best in Indian weather?', a: 'Afnan Supremacy Collector Edition. Its brighter, sweeter, more tropical pineapple profile handles heat better than the smoky clones, and recent batches are regarded as very stable.' },
    { q: 'How do I buy Aventus dupes safely in India?', a: 'Stick to authorised distributors, established online sellers with years of reviews, and well-reviewed shops. The clone market has fakes of fakes, so buy the seller before the perfume.' },
  ],
  'baccarat-rouge-540-dupes-india': [
    { q: 'What is the closest Baccarat Rouge 540 dupe?', a: 'Armaf Club de Nuit Urban Man Elixir is the community top pick. It nails the saffron amberwood core with impressive fidelity, and its 8 to 10 hour performance is strong. Al Haramain Amber Oud Rouge is a close second.' },
    { q: 'Do BR540 dupes copy the EDP or the Extrait?', a: 'Most dupes, including Urban Man Elixir and Amber Oud Rouge, target the airy luminous Eau de Parfum. Armaf Club de Nuit Untold and heavier interpretations like Mancera Red Tobacco lean toward the richer, denser Extrait profile.' },
    { q: 'Can I wear Baccarat Rouge 540 dupes in Indian summer?', a: 'No. These are warm, sweet, projecting fragrances that turn overwhelming in 40 degree heat. They are October to February scents in India, for evenings, air-conditioned spaces, and festive occasions.' },
    { q: 'How many sprays of a BR540 dupe should I use?', a: 'Two sprays maximum to start. These project like four sprays of a normal fragrance. Wait 30 minutes before deciding if you need more; you almost never do.' },
    { q: 'Is Lattafa Ana Abiyedh Rouge a good BR540 dupe?', a: 'It is a community favourite for the price, described as remarkably close to the original with a touch more saffron sharpness in the opening. Let the bottle sit for a few weeks after purchase, maceration genuinely improves it.' },
    { q: 'Should I sample BR540 dupes before buying?', a: 'Yes, always. The saffron amber profile is distinctive and not everyone loves it. Sample first, especially the stronger interpretations like Untold and Red Tobacco, through discovery sets rather than blind-buying full bottles.' },
  ],
  'complete-guide-perfume-dupes-india': [
    { q: 'What is a perfume dupe?', a: 'A fragrance made to smell similar to a well-known designer or niche perfume, sold under its own brand name at a much lower price. A dupe says inspired by on the box. A fake copies the original branding to deceive you. One is a legitimate business model, the other is counterfeiting.' },
    { q: 'Are perfume dupes legal in India?', a: 'Yes. Scents cannot be copyrighted the way songs or books can, so the dupe industry operates openly worldwide. Buying a dupe from a legitimate registered brand in India is lawful; it is the manufacturer who must stay clear of trademark issues with bottle designs and names.' },
    { q: 'What is the difference between a dupe and a fake perfume?', a: 'A dupe is sold under its own brand name by a registered company through legitimate retailers. A fake copies the original branding, bottle, and packaging to trick you. If the seller hides the brand name or the price is impossibly low for the claimed original, it is a fake, not a dupe.' },
    { q: 'Which dupe houses are best for Indian buyers?', a: 'Armaf for high-impact long-lasting scents, Lattafa for sheer volume and value hits like Khamrah, Rasasi for Arabian character over direct copying, Al Haramain for heritage and consistency, Fragrance World for budget experimentation, and Ajmal as the safe heritage pair of hands.' },
    { q: 'Do dupes last as long as the original perfumes?', a: 'Sometimes longer, sometimes shorter. Many Middle Eastern dupes are formulated heavier than the designer originals, so a dupe can last 8 hours where the original lasts 5. But longevity is not the same as quality of wear; judge the full evolution, not just the hours.' },
    { q: 'Where can I buy dupes safely in India?', a: 'Brand-authorised sellers, established online fragrance retailers with years of reviews, and the houses listed distributors. Avoid Telegram groups and WhatsApp-only sellers. Festival sales like Diwali and Big Billion Days are genuinely the best time to stock up on real stock.' },
  ],
  'best-perfumes-men-india-under-1500': [
    { q: 'Can you get a good perfume under Rs 1,500 in India?', a: 'Yes, for daily fresh wear. Expect 3 to 5 hour longevity and simple linear scents rather than complex evolving compositions. For smelling clean and put-together every day, which is what most buyers need, it is plenty.' },
    { q: 'Which budget perfume is best for daily use in India?', a: 'Wild Stone Hydra Energy is the default for its ubiquity, Denver Hamilton for the try-before-you-buy advantage of offline stores, and Skinn Verge by Titan for the most polished scent in this range.' },
    { q: 'How can I make cheap perfumes last longer?', a: 'Spray generously since the low price makes it guilt-free, spray your clothes since fabric holds scent far longer than skin in Indian heat, moisturise first, and layer with the matching deodorant from the same scent line.' },
    { q: 'Are there fakes in the under Rs 1,500 segment?', a: 'Rarely. Counterfeiters target Rs 8,000 designer bottles, not Rs 800 mass-market ones, the economics do not work for them. Buy offline where you can smell first, or from official brand stores online.' },
    { q: 'What should I avoid when buying budget perfumes?', a: 'Unknown influencer-marketed luxury brands with heavy Instagram ads, anything claiming to be a 1:1 dupe of a specific designer scent at this price, and blind-buying 100ml bottles when smaller options exist.' },
  ],
  'attar-vs-perfume-vs-deo-india': [
    { q: 'What is the difference between attar, perfume, and deodorant?', a: 'Attar is concentrated fragrance oil, traditionally alcohol-free, applied with a dipstick. Perfume is fragrance oils diluted in alcohol in a spray bottle. Deodorant is primarily a hygiene product for odour control with fragrance as a secondary feature.' },
    { q: 'Which lasts longest: attar, perfume, or deodorant?', a: 'Attar lasts 8 to 12 plus hours on skin and days on clothes, but stays close to the skin. A good EDP lasts 5 to 8 hours with real projection. Deodorant gives 2 to 4 hours of freshness; its job is odour control, not all-day fragrance.' },
    { q: 'Is attar better than perfume?', a: 'They are different tools. Attars win for skin sensitivity (no alcohol), value per wear, religious and cultural occasions, and layering. Perfumes win for projection, variety, convenience, and summer wear in Indian heat.' },
    { q: 'Can deodorant replace perfume?', a: 'No. Deodorant is hygiene with a pleasant smell; perfume is presence. Your deo handles odour through the commute, your perfume handles how you smell to others. The correct routine is deo after shower plus perfume before leaving.' },
    { q: 'Are attars good for Indian summers?', a: 'Heavy attar oils can sit uncomfortably on sweating skin. A well-chosen fresh perfume usually outperforms attar in peak summer heat. Save rich attar oils for winter, when they bloom beautifully in cool air.' },
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
