import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllBlogPosts, getBlogPost, markdownToHtml } from '@/lib/blog';
import { SITE_URL } from '@/lib/site-url';
import { Breadcrumbs } from '@/components';
import { JsonLd } from '@/components/seo';

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
    </div>
  );
}
