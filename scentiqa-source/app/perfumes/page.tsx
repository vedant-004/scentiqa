import Link from 'next/link';
import { getPerfumesPage } from '@/lib/data';
import { Breadcrumbs, PerfumeCard } from '@/components';

export const metadata = {
  title: 'Browse all perfumes',
  description: 'Browse the complete Scentiqa perfume catalog — every fragrance indexed with INR prices, ratings and dupe information.',
};

export const revalidate = 86400;

const PER_PAGE = 48;

export default async function PerfumesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const { perfumes, total } = await getPerfumesPage(page, PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Perfumes' }]} />

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600 dark:text-gold-400">
          Catalog
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Browse all perfumes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
          {total.toLocaleString('en-IN')} fragrances indexed. Showing {((page - 1) * PER_PAGE + 1).toLocaleString('en-IN')}–
          {Math.min(page * PER_PAGE, total).toLocaleString('en-IN')}.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {perfumes.map((p) => (
          <PerfumeCard key={p.slug} perfume={p} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={`/perfumes?page=${page - 1}`}
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100 dark:border-ink-700 dark:hover:bg-white/5"
            >
              ← Previous
            </Link>
          )}
          <span className="px-4 text-sm text-stone-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/perfumes?page=${page + 1}`}
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100 dark:border-ink-700 dark:hover:bg-white/5"
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
