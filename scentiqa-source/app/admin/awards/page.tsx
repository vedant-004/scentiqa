import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin';
import { getAwards, getAwardYears } from '@/lib/data';
import { SectionTitle, EmptyState } from '../components';
import { EditionTools, CategoryManager } from './awards-client';

export const metadata = { title: 'Awards · Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminAwards({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const years = await getAwardYears();
  const year = Number(sp.year) || years[0] || new Date().getFullYear();
  const categories = await getAwards(year);
  const indian = categories.filter((c) => c.section === 'indian');
  const global = categories.filter((c) => c.section === 'global');

  return (
    <div>
      <SectionTitle
        action={
          <Link href="/awards" target="_blank" className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
            View public page →
          </Link>
        }
      >
        Scentiqa Awards
      </SectionTitle>

      <div className="mb-6 flex flex-wrap gap-2">
        {years.map((y) => (
          <Link key={y} href={`/admin/awards?year=${y}`}
            className={y === year
              ? 'rounded-full bg-stone-900 px-4 py-1.5 text-sm font-bold text-white dark:bg-white dark:text-stone-900'
              : 'rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium hover:border-stone-500 dark:border-white/10'}>
            {y}
          </Link>
        ))}
      </div>

      <EditionTools years={years.length > 0 ? years : [year]} currentYear={year} />

      {categories.length === 0 && <EmptyState>No categories for {year} yet — add one above or clone an edition.</EmptyState>}

      {indian.length > 0 && (
        <>
          <h2 className="mb-3 mt-2 font-display text-lg font-bold">🇮🇳 Scentiqa India Awards</h2>
          <div className="mb-8 space-y-4">
            {indian.map((c) => <CategoryManager key={c.id} category={c} />)}
          </div>
        </>
      )}
      {global.length > 0 && (
        <>
          <h2 className="mb-3 mt-2 font-display text-lg font-bold">🌍 Global Awards</h2>
          <div className="space-y-4">
            {global.map((c) => <CategoryManager key={c.id} category={c} />)}
          </div>
        </>
      )}
    </div>
  );
}
