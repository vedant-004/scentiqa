import Link from 'next/link';
import { getForumCategories } from '@/lib/data';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export const revalidate = 3600;

export const metadata = { title: 'Community Forum', description: 'Discuss perfumes, dupes, sellers and Indian perfumery with fellow enthusiasts.' };

const ICONS: Record<string, string> = {
  'dupe-discussion': '🧪', 'indian-houses': '🇮🇳', 'buying-advice': '🛒',
  'reviews': '⭐', 'layering-tips': '🎨', 'attars': '🌸',
};

export default async function ForumPage() {
  const cats = await getForumCategories();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Community' }]} />
      <SectionHeading kicker="Community" title="Discussion forum" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">Talk dupes, sellers, layering and Indian perfumery with fellow enthusiasts.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {cats.map((c) => {
          const postCount = c.topics.reduce((n, t) => n + (t.postCount ?? t.posts.length), 0);
          return (
            <Link key={c.slug} href={`/forum/${c.slug}`}>
              <Card hover className="flex h-full items-start gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-600/15 text-2xl">{ICONS[c.slug] ?? '💬'}</span>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold tracking-tight">{c.name}</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{c.description}</p>
                  <p className="mt-2 text-xs font-medium text-stone-400">{c.topics.length} topics · {postCount} posts</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
