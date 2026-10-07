import { getGiveaways } from '@/lib/data';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs, CountdownTimer } from '@/components';
import { EnterButton } from './enter-button';

export const metadata = { title: 'Giveaways', description: 'Win real perfume bottles and discovery sets from Scentiqa.' };

export const revalidate = 300;

export default async function GiveawaysPage() {
  const giveaways = await getGiveaways();
  const now = Date.now();
  const live = giveaways.filter((g) => g.active && new Date(g.ends).getTime() > now);
  const ended = giveaways.filter((g) => !g.active || new Date(g.ends).getTime() <= now);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Giveaways' }]} />
      <SectionHeading kicker="Community" title="Giveaways" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Real bottles, real winners — drawn live in our community. Sign in to enter.
      </p>

      {live.length === 0 && ended.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-stone-500">No giveaways right now — check back soon.</p>
        </Card>
      )}

      {live.map((g) => (
        <Card key={g.slug} className="overflow-hidden">
          <div className="relative">
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900" />
            <div className="relative flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">Live now</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">{g.title}</h2>
                {g.desc && <p className="mt-2 text-sm text-stone-200">{g.desc}</p>}
                {g.prize && <p className="mt-1 text-sm font-semibold text-gold-300">Prize: {g.prize}</p>}
                <div className="dark mt-4">
                  <CountdownTimer endsAt={g.ends} />
                </div>
                <p className="mt-3 text-xs text-stone-400">{g.entries.toLocaleString('en-IN')} entries so far</p>
                <div className="mt-5">
                  <EnterButton slug={g.slug} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {ended.map((g) => (
        <Card key={g.slug} className="mt-4 p-6 opacity-75">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">Ended</p>
          <h2 className="mt-1 font-display text-xl font-bold">{g.title}</h2>
          {g.prize && <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Prize: {g.prize}</p>}
          <p className="mt-1 text-xs text-stone-400">{g.entries.toLocaleString('en-IN')} entries · Winners announced in the forum.</p>
        </Card>
      ))}
    </div>
  );
}
