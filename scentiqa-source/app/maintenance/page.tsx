export const metadata = {
  title: 'Temporarily offline',
  description: 'Scentarchy is taking a short break and will be back soon.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0a08] px-6 py-16 text-center">
      <div className="max-w-md">
        <div className="mb-4 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#F01348]" />
          <span className="text-[10px] tracking-[0.5em] text-[#e3b93c]">◆◆◆</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#F01348]" />
        </div>
        <p className="wordmark-deco text-4xl font-bold tracking-[0.14em]">SCENTARCHY</p>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.42em] text-stone-500">
          The Indian Fragrance Archive
        </p>
        <h1 className="mt-8 font-display text-3xl font-bold text-stone-100">Taking a short break</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">
          The site is temporarily offline for maintenance. Your collection, diary and
          community are safe — we will be back shortly.
        </p>
        <div className="mx-auto mt-8 h-px w-24 bg-[#F01348]/40" />
        <p className="mt-6 text-xs text-stone-500">Thank you for your patience.</p>
      </div>
    </main>
  );
}
