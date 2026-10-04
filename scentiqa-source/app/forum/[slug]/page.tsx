import Link from 'next/link';
import { getForumCategory } from '@/lib/data';
import { Card, EmptyState, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export const revalidate = 3600;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getForumCategory(slug);
  if (!cat) return <div className="mx-auto max-w-4xl px-4 pt-6"><EmptyState icon="💬" title="Category not found" body="This forum category doesn't exist." /></div>;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Forum', href: '/forum' }, { label: cat.name }]} />
      <SectionHeading kicker={`${cat.topics.length} topics`} title={cat.name} />
      <p className="mb-6 text-[15px] text-stone-500 dark:text-stone-400">{cat.description}</p>
      <div className="space-y-3">
        {cat.topics.map((t) => (
          <Link key={t.id} href={`/forum/${slug}/${t.id}`}>
            <Card hover className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-semibold tracking-tight">{t.title}</h2>
                <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">by @{t.author} · {t.posts.length} posts</p>
              </div>
              <span className="shrink-0 text-stone-300 dark:text-stone-600">→</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
