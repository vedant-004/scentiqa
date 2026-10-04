// /notes — the Scentiqa note encyclopedia index.
import Link from 'next/link';
import { getNoteIndex, getNoteMetas } from '@/lib/notes-data';
import { Breadcrumbs } from '@/components';
import { Card, SectionHeading } from '@/components/ui';
import { NotesIndexClient } from './notes-client';

export const metadata = {
  title: 'Fragrance Notes Encyclopedia',
  description: 'Explore 400 fragrance notes — what each smells like, and every Scentiqa perfume that features it.',
};
export const revalidate = 3600;

const CAT_LABEL: Record<string, string> = {
  citrus: 'Citrus', floral: 'Floral', white_floral: 'White floral', woody: 'Woody',
  oriental: 'Oriental', gourmand: 'Gourmand', green: 'Green', chypre: 'Chypre',
  fougere: 'Fougère', aquatic: 'Aquatic', musky: 'Musky', spicy: 'Spicy',
};

export default async function NotesIndex() {
  const [metas, data] = await Promise.all([getNoteMetas(), getNoteIndex()]);
  const notes = metas.map((m) => {
    const e = data.index.get(m.name.toLowerCase().trim());
    const count = e ? e.top.length + e.heart.length + e.base.length : 0;
    return { ...m, count };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Notes' }]} />
      <SectionHeading
        kicker="Encyclopedia"
        title="Fragrance notes, decoded"
      />
      <p className="mb-6 -mt-3 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Every note in the Scentiqa catalog — what it smells like, and which perfumes wear it best. Tap any note for its full story.
      </p>
      {notes.length === 0 ? (
        <Card className="p-8 text-center text-sm text-stone-500">Note data is still loading.</Card>
      ) : (
        <NotesIndexClient notes={notes} catLabel={CAT_LABEL} />
      )}
      <p className="mt-6 text-center text-xs text-stone-400">
        Counts reflect the live Scentiqa catalog. <Link href="/search/notes" className="font-bold text-gold-700 hover:underline dark:text-gold-300">Try the AI note search →</Link>
      </p>
    </div>
  );
}
