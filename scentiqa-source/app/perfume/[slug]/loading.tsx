// Perfume page loading skeleton — shown during client-side navigation
// so a tap never leaves the user staring at a frozen page.
export default function PerfumeLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 pt-6 sm:px-6" aria-label="Loading perfume">
      <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200/70 bg-white p-6 dark:border-ink-700/50 dark:bg-ink-900 sm:p-10">
        <div className="mx-auto h-4 w-24 rounded-full bg-stone-200 dark:bg-ink-700" />
        <div className="mx-auto mt-4 h-10 w-3/4 rounded-lg bg-stone-200 dark:bg-ink-700" />
        <div className="mx-auto mt-3 h-4 w-40 rounded-full bg-stone-200 dark:bg-ink-700" />
        <div className="mx-auto mt-8 flex h-64 w-52 items-center justify-center rounded-2xl bg-stone-200 dark:bg-ink-700">
          <span className="font-display text-5xl text-stone-300 dark:text-ink-600">S</span>
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full rounded bg-stone-200 dark:bg-ink-700" />
          <div className="h-4 w-5/6 rounded bg-stone-200 dark:bg-ink-700" />
          <div className="h-4 w-4/6 rounded bg-stone-200 dark:bg-ink-700" />
        </div>
      </div>
    </div>
  );
}
