import Link from 'next/link';
import { getForumTopic } from '@/lib/data';
import { EmptyState } from '@/components/ui';
import { Breadcrumbs } from '@/components';
import { TopicReplies } from '../../forum-client';

export const revalidate = 3600;

export default async function TopicPage({ params }: { params: Promise<{ slug: string; topic: string }> }) {
  const { slug, topic } = await params;
  const t = await getForumTopic(topic);
  if (!t) return <div className="mx-auto max-w-4xl px-4 pt-6"><EmptyState icon="💬" title="Topic not found" body="This discussion doesn't exist." /></div>;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Forum', href: '/forum' }, { label: t.category.name, href: `/forum/${slug}` }, { label: t.topic.title }]} />
      <h1 className="font-display text-3xl font-bold tracking-tight">{t.topic.title}</h1>
      <p className="mt-1 text-sm text-stone-500">Started by @{t.topic.author}</p>
      <TopicReplies topicId={t.topic.id} initialPosts={t.topic.posts} />
    </div>
  );
}
