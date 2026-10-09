import { getPerfumeRequests } from '@/lib/data';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';
import { RequestsClient } from './requests-client';

export const metadata = {
  title: 'Request a Perfume',
  description: 'Vote for the perfumes you want in the Scentiqa catalog. The most requested get researched and added first.',
};

export const revalidate = 120;

export default async function RequestsPage() {
  const requests = await getPerfumeRequests();
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Request a Perfume' }]} />
      <SectionHeading kicker="Community" title="Request a Perfume" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Missing a perfume from our catalog? Request it here. The most upvoted requests
        get researched and added first — this board directly drives what we build next.
      </p>
      <RequestsClient initial={requests} />
      <Card className="mt-8 p-6">
        <h2 className="font-display text-lg font-bold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-600 dark:text-stone-300">
          <li>Search the catalog first — if the perfume is already here, no need to request it.</li>
          <li>Submit the perfume name, house, and why you want it (at least 5 words).</li>
          <li>Members upvote. Requests with the most votes get researched first.</li>
          <li>Once added, the request is marked as done and linked to the new page.</li>
        </ol>
      </Card>
    </div>
  );
}
