import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/site-url';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export const metadata: Metadata = {
  title: 'Scentarchy Journal: Perfume Guides & Reviews',
  description: 'In-depth perfume guides, honest comparisons and buying advice for Indian fragrance lovers.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Scentarchy Journal | Scentarchy',
    description: 'Perfume guides and honest reviews for India.',
    url: `${SITE_URL}/blog`,
  },
};

export default function BlogIndex() {
  const posts = getAllBlogPosts();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Journal' }]} />
      <SectionHeading title="Scentarchy Journal" kicker="Guides, comparisons and honest advice for Indian fragrance lovers" />
      <div className="mt-8 space-y-6">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="block">
            <Card hover className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{p.description}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-gold-600 dark:text-gold-400">Read more →</span>
            </Card>
          </Link>
        ))}
        {posts.length === 0 && <p className="text-stone-500">No posts yet. Check back soon.</p>}
      </div>
    </div>
  );
}
