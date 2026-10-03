import Link from 'next/link';
import { Card } from '@/components/ui';
import { Breadcrumbs } from '@/components';

function DocPage({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600 dark:text-gold-400">{kicker}</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{title}</h1>
      <div className="prose-scentiqa mt-8">{children}</div>
    </div>
  );
}

export function MethodologyPage() {
  return (
    <DocPage title="How we test similarity" kicker="Dupe lab methodology">
      <p>Scentiqa measures how close an inspired fragrance smells to the original — independently, and in the open. Here&rsquo;s exactly how.</p>
      <h2>1. Blind triangle testing</h2>
      <p>A panel of 12–20 trained testers smells the original and two samples — one being the candidate dupe — blind. Each tester rates similarity on a 0–100 scale across opening, drydown, projection and overall impression.</p>
      <h2>2. Scored, not guessed</h2>
      <p>Scores are averaged with outliers trimmed. The published score is the panel mean; the badge you see on a dupe card is that number, rounded. Community suggestions without a panel test stay clearly marked <strong>untested</strong>.</p>
      <h2>3. House claims vs lab results</h2>
      <p>Brands sometimes advertise their own “95% similar” numbers. Those are the brand&rsquo;s marketing claims — we show them alongside our lab measurement so you can see both, and we never present a brand claim as our finding.</p>
      <h2>4. Climate testing</h2>
      <p>Every lab-tested fragrance also gets a climate panel: wear at 35°C+ and high humidity, with longevity and sillage recorded by the same testers. See the <Link href="/climate-protocol">climate protocol</Link> for the full setup.</p>
      <h2>5. What we don&rsquo;t do</h2>
      <p>We don&rsquo;t take payment from houses for scores, rankings or inclusion. Lab purchases are made anonymously at retail. If a result can&rsquo;t be reproduced, we re-test or retract it.</p>
      <h2>A note on demo data</h2>
      <p>This website is currently running in demo mode: the similarity scores, tester counts and prices shown are illustrative samples so you can explore the product. They are not genuine Scentiqa lab findings — yet. Connect a live data source and every “sample” label disappears, replaced by real, dated test records.</p>
    </DocPage>
  );
}

export function ClimatePage() {
  return (
    <DocPage title="Climate testing protocol" kicker="Scentiqa climate lab">
      <p>Perfume behaves differently in Indian weather. A fragrance that lasts 8 hours in Paris may vanish in 3 in Chennai. So we test here, in the heat.</p>
      <h2>Test conditions</h2>
      <p>Panels run at 35°C and 70% relative humidity, matching a typical North Indian summer day. Each tester applies a fixed number of sprays to forearm and reports at set intervals.</p>
      <h2>What we measure</h2>
      <p><strong>Heat longevity</strong> — hours until the scent is only detectable skin-close. <strong>Humidity sillage</strong> — projection at arm&rsquo;s length in humid air. Plus seasonal ratings for summer, monsoon and winter wear.</p>
      <h2>Why it matters</h2>
      <p>Heavy orientals can turn cloying in humidity; light citruses can disappear by noon. Our climate scores help you pick fragrances that actually perform where you live.</p>
    </DocPage>
  );
}

export function TrustPage() {
  return (
    <DocPage title="Trust charter" kicker="Our promises">
      <p>Scentiqa exists because perfume buying in India has a trust problem: fakes, inflated claims, and marketing dressed up as science. Our charter is the line we won&rsquo;t cross.</p>
      <h2>Independence</h2>
      <p>Scores are never for sale. Houses can&rsquo;t pay for testing, ranking, or placement. Affiliate links are labeled; editorial is never written for a commission.</p>
      <h2>Honesty about data</h2>
      <p>Sample or estimated data is always labeled as such. Brand claims are shown as brand claims. Community suggestions are shown as community suggestions. Lab findings are shown only when the lab actually ran.</p>
      <h2>Sellers</h2>
      <p>We list only sellers we&rsquo;ve verified — real GST-registered businesses with return policies. Prices are checked regularly; stale prices are removed.</p>
      <h2>Corrections</h2>
      <p>We publish corrections openly. If we got a score, price or fact wrong, the fix carries a timestamp and a note explaining what changed.</p>
    </DocPage>
  );
}

export function FakeGuidePage() {
  return (
    <DocPage title="How to spot fakes" kicker="Buyer protection">
      <p>Counterfeit perfume is rampant in Indian marketplaces. A few checks before you pay:</p>
      <h2>Price sanity</h2>
      <p>If a ₹25,000 niche bottle is listed at ₹3,000, it&rsquo;s not a deal — it&rsquo;s a fake. Compare against our verified seller prices before buying.</p>
      <h2>Seller checks</h2>
      <p>Buy from the brand&rsquo;s own site or a verified retailer. Check GST invoices, return policies, and reviews that mention authenticity — not just delivery speed.</p>
      <h2>The bottle tells</h2>
      <p>Blurry printing, misaligned caps, weak magnets, and chemical-smelling first sprays are classic tells. Batch codes should match the box and be verifiable on check sites.</p>
      <h2>When in doubt</h2>
      <p>Stick to sellers on Scentiqa&rsquo;s verified list, and report suspicious listings — we investigate and delist.</p>
    </DocPage>
  );
}

export function AboutPage() {
  return (
    <DocPage title="About Scentiqa" kicker="Our story">
      <p>Scentiqa is India&rsquo;s independent perfume encyclopedia and dupe lab. We started with a simple frustration: the world&rsquo;s best fragrance databases ignore Indian weather, Indian sellers, and the incredible Indian houses making world-class alternatives at honest prices.</p>
      <p>So we built the database we wanted — every perfume rated for Indian heat, every dupe blind-tested by our panel, every price in rupees from sellers we&rsquo;ve actually verified.</p>
      <h2>What we do</h2>
      <p>Lab-tested similarity scores. Climate performance panels. Verified INR pricing. Honest house profiles from Kannauj attar makers to modern clone houses. And a community of Indian fragrance lovers keeping everyone honest.</p>
    </DocPage>
  );
}

export function ContactPage() {
  return (
    <DocPage title="Contact us" kicker="Say hello">
      <p>Corrections, lab partnerships, seller verification, press — we read everything.</p>
      <Card className="mt-6 p-6">
        <p className="text-sm"><strong>Email:</strong> hello@scentiqa.in</p>
        <p className="mt-2 text-sm"><strong>Corrections:</strong> corrections@scentiqa.in</p>
        <p className="mt-2 text-sm"><strong>Seller verification:</strong> sellers@scentiqa.in</p>
        <p className="mt-2 text-xs text-stone-400">Response time: usually within 2 working days.</p>
      </Card>
    </DocPage>
  );
}

export function TermsPage() {
  return (
    <DocPage title="Terms of use" kicker="Legal">
      <p>By using Scentiqa you agree to the following.</p>
      <h2>Content</h2>
      <p>Reviews and forum posts are the opinions of their authors. Similarity scores reflect our panel&rsquo;s findings, not guarantees. Prices are indicative and change; confirm with the seller before purchase.</p>
      <h2>Accounts</h2>
      <p>You&rsquo;re responsible for activity under your account. Don&rsquo;t post spam, abuse, or fake reviews — we may remove content or suspend accounts that harm the community.</p>
      <h2>Liability</h2>
      <p>Scentiqa is an informational service. We&rsquo;re not a party to your purchases; disputes with sellers are between you and them.</p>
    </DocPage>
  );
}

export function PrivacyPage() {
  return (
    <DocPage title="Privacy policy" kicker="Legal">
      <p>We collect the minimum needed to run Scentiqa.</p>
      <h2>What we store</h2>
      <p>Your account email, your reviews/votes/wardrobe, and anonymous usage analytics. We never sell your data.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies for sign-in and theme preference, and optional analytics cookies you can decline.</p>
      <h2>Your rights</h2>
      <p>Export or delete your data anytime from account settings, or email privacy@scentiqa.in.</p>
    </DocPage>
  );
}
