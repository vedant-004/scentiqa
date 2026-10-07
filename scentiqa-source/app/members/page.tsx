import Link from 'next/link';
import { getTopMembers } from '@/lib/data';
import { Card, EmptyState, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export const revalidate = 3600;

export const metadata = {
  title: 'Top members | Scentiqa',
  description: 'The most active reviewers in the Scentiqa community.',
};

export default async function MembersPage() {
  const members = await getTopMembers(24);
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Community' }]} />
      <SectionHeading kicker="Community" title="Member spotlight" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        The noses behind Scentiqa&apos;s most helpful reviews — ranked by real contributions.
      </p>
      {members.length === 0 ? (
        <EmptyState icon="👥" title="No members yet" body="Be the first — write a review on any perfume page." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m, i) => (
            <Link key={m.username} href={`/member/${m.username}`}>
              <Card hover className="flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 font-display text-xl font-bold text-white">
                  {m.username[0].toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    <span className="mr-2 text-xs font-bold text-stone-400">#{i + 1}</span>@{m.username}
                  </span>
                  <span className="block text-xs text-stone-400">{m.level}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-xl font-bold text-gold-700 dark:text-gold-300">{m.reviewCount}</span>
                  <span className="block text-[11px] text-stone-400">review{m.reviewCount === 1 ? '' : 's'}</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
