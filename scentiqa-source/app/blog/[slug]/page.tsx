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
    author: { '@type': 'Organization', name: 'Scentarchy', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Scentarchy', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  };

  const related = RELATED_LINKS[slug] ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JsonLd data={articleJsonLd} />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Journal', href: '/blog' }, { label: post.title }]} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
        {post.date ? new Date(post.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-stone-500 dark:text-stone-400">{post.description}</p>
      <article
        className="prose-blog mt-8"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
      />
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
