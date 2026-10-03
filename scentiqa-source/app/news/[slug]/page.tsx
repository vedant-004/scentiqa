import Link from 'next/link';
import { getArticles, getArticle } from '@/lib/data';
import { Card, EmptyState } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return <div className="mx-auto max-w-3xl px-4 pt-6"><EmptyState icon="📰" title="Article not found" body="This article doesn't exist." /></div>;
  const related = (await getArticles()).filter((x) => x.slug !== a.slug).slice(0, 2);
  const readMinutes = Math.max(1, Math.round(a.body.split(/\s+/).length / 200));
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'News', href: '/news' }, { label: a.title }]} />
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600 dark:text-gold-400">{a.category}</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{a.title}</h1>
      <p className="mt-3 text-sm text-stone-500">By {a.author} · {readMinutes} min read · {a.date}</p>
      <div className="prose-scentiqa mt-8">
        {a.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
      </div>
      {related.length > 0 && (
        <div className="mt-12 border-t border-stone-200/70 pt-8 dark:border-ink-700/50">
          <h2 className="mb-4 font-display text-2xl font-semibold">Keep reading</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/news/${r.slug}`}>
                <Card hover className="h-full p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">{r.category}</p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold">{r.title}</h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
