import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs, CountdownTimer } from '@/components';

export const metadata = { title: 'Giveaways', description: 'Win real perfume bottles and discovery sets from Scentiqa.' };

export default function GiveawaysPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Giveaways' }]} />
      <SectionHeading kicker="Community" title="Giveaways" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">Real bottles, real winners — drawn live in our community. Sign in to enter.{!isSupabaseConfigured() && <span className="font-semibold"> The giveaway shown on this demo build is an illustrative sample; no entries are being collected.</span>}</p>
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">Live now</p>
            <h2 className="mt-1 font-display text-2xl font-bold">October Discovery Set</h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">5 × 10ml discovery sets of our top lab-tested dupes. Winners announced in the forum.</p>
            <CountdownTimer endsAt="2026-10-31T23:59:59+05:30" />
            <Link href="/login" className="mt-5 inline-block rounded-xl bg-gold-600 px-6 py-3 text-sm font-bold text-white shadow-lift transition hover:bg-gold-700">Sign in to enter</Link>
          </div>
        </div>
      </Card>
      <Card className="mt-4 p-6 opacity-75">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">Ended</p>
        <h2 className="mt-1 font-display text-xl font-bold">September Blind Test Kit</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Won by @mumbai_nose, @deodorant_slayer and 3 others. Results thread in the forum.</p>
      </Card>
    </div>
  );
}
