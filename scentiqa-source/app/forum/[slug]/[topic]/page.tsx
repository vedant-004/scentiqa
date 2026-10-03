import Link from 'next/link';
import { getForumTopic } from '@/lib/data';
import { Card, EmptyState } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export default async function TopicPage({ params }: { params: Promise<{ slug: string; topic: string }> }) {
  const { slug, topic } = await params;
  const t = await getForumTopic(topic);
  if (!t) return <div className="mx-auto max-w-4xl px-4 pt-6"><EmptyState icon="💬" title="Topic not found" body="This discussion doesn't exist." /></div>;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Forum', href: '/forum' }, { label: t.category.name, href: `/forum/${slug}` }, { label: t.topic.title }]} />
      <h1 className="font-display text-3xl font-bold tracking-tight">{t.topic.title}</h1>
      <p className="mt-1 text-sm text-stone-500">Started by @{t.topic.author}</p>
      <div className="mt-6 space-y-4">
        {t.topic.posts.map((p, i) => (
          <Card key={p.id} className={i === 0 ? 'border-gold-600/40 p-6' : 'p-6'}>
            <div className="mb-3 flex items-center justify-between">
              <Link href={`/member/${p.username}`} className="font-bold text-gold-700 hover:underline dark:text-gold-300">@{p.username}</Link>
              {i === 0 && <span className="rounded-full bg-gold-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-gold-700 dark:text-gold-300">Original post</span>}
            </div>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{p.body}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-6 text-center">
        <p className="text-sm text-stone-500">Join the conversation — <Link href="/login" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">sign in</Link> to reply.</p>
      </Card>
    </div>
  );
}
