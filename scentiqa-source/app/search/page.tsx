// /search — full catalog text search results page.
// Reached from the header SearchBar's "view all results" link and on Enter:
//   /search?q=<query>
// Server component: reads q from searchParams, fetches server-side with a
// Suspense boundary so the search box renders instantly while results stream in.
import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { searchPerfumesDetailed } from '@/lib/data';
import { Breadcrumbs, Button, SectionHeading, Skeleton } from '@/components';
import SearchResults from './search-results';

const RESULT_LIMIT = 48;

type SearchParams = { q?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  if (!query) {
    return {
      title: 'Search perfumes',
      description:
        'Search thousands of perfumes by name, house or note — with ratings, verified INR prices and Indian dupe alternatives.',
    };
  }
  return {
    title: `Search: ${query}`,
    description: `Perfume search results for "${query}" — ratings, verified INR prices and Indian dupe alternatives on Scentiqa.`,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />
      <SearchForm query={query} />
      {query ? (
        <Suspense key={query} fallback={<ResultsSkeleton />}>
          <ResultsFor query={query} />
        </Suspense>
      ) : (
        <NoQueryPrompt />
      )}
    </div>
  );
}

/* ---------- search box (plain GET form, no JS needed) ---------- */

function SearchForm({ query }: { query: string }) {
  return (
    <form action="/search" method="get" role="search" className="mb-8 flex items-center gap-2">
      <div className="flex h-12 w-full max-w-xl items-center gap-2 rounded-2xl border border-stone-300/80 bg-white px-4 transition-all focus-within:border-gold-600 dark:border-ink-700 dark:bg-ink-800">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-stone-400" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search perfumes, houses, notes\u2026"
          autoComplete="off"
          aria-label="Search perfumes"
          className="h-full w-full bg-transparent text-[15px] text-stone-900 outline-none placeholder:text-stone-400 dark:text-white dark:placeholder:text-stone-500"
        />
      </div>
      <Button type="submit" className="h-12 shrink-0">
        Search
      </Button>
    </form>
  );
}

/* ---------- results (streams in behind Suspense) ---------- */

async function ResultsFor({ query }: { query: string }) {
  const { results, didYouMean } = await searchPerfumesDetailed(query, RESULT_LIMIT);
  return <SearchResults results={results} query={query} didYouMean={didYouMean} />;
}

function ResultsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-5 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="ml-auto h-10 w-36" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-stone-200/70 dark:border-ink-800"
          >
            <Skeleton className="h-44 rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- empty query: prompt UI ---------- */

const POPULAR_IDEAS = ['Aventus', 'Sauvage', 'Baccarat Rouge 540', 'Khamrah', 'Tobacco Vanille', 'Erba Pura'];

function NoQueryPrompt() {
  return (
    <div className="pb-16">
      <SectionHeading kicker="Search" title="Search Scentiqa" />
      <p className="mb-4 max-w-xl text-[15px] text-stone-500 dark:text-stone-400">
        Type a perfume, house or note in the box above — we search across the 8,000+ perfumes in the
        catalog and show ratings, real INR prices and dupe alternatives.
      </p>
      <p className="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-300">
        Popular right now
      </p>
      <div className="flex flex-wrap gap-2">
        {POPULAR_IDEAS.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(t)}`}
            className="inline-flex h-9 items-center rounded-full border border-stone-300 px-4 text-sm font-medium text-stone-600 transition-all hover:border-gold-600 hover:text-gold-700 dark:border-ink-700 dark:text-stone-300 dark:hover:border-gold-400 dark:hover:text-gold-300"
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  );
}
