import Link from 'next/link';
import { getArticles } from '@/lib/data';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export const metadata = { title: 'News & Editorial', description: 'Perfume news, guides and features from the Scentiqa editors.' };

const readMins = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 200));

export default async function NewsPage() {
  const arts = await getArticles();
  const [feat, ...rest] = arts;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'News' }]} />
      <SectionHeading kicker="Editorial" title="News & stories" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">Guides, house profiles and market explainers — written for Indian perfume lovers.</p>
      {feat && (
        <Link href={`/news/${feat.slug}`}>
          <Card hover className="group relative mb-6 overflow-hidden p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-transparent" aria-hidden="true" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600 dark:text-gold-400">{feat.category}</p>
            <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight group-hover:text-gold-800 sm:text-4xl dark:group-hover:text-gold-200">{feat.title}</h2>
            <p className="mt-3 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">{feat.excerpt}</p>
            <p className="mt-4 text-sm text-stone-400">By {feat.author} · {readMins(feat.body)} min read · {feat.date}</p>
          </Card>
        </Link>
      )}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((a) => (
          <Link key={a.slug} href={`/news/${a.slug}`}>
            <Card hover className="flex h-full flex-col p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600 dark:text-gold-400">{a.category}</p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm text-stone-500 dark:text-stone-400">{a.excerpt}</p>
              <p className="mt-3 text-xs text-stone-400">By {a.author} · {readMins(a.body)} min read</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
