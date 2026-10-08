export const metadata = {
  title: 'Temporarily offline — Scentiqa',
  description: 'Scentiqa is taking a short break and will be back soon.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0a08] px-6 py-16 text-center">
      <div className="max-w-md">
        <p className="font-display text-5xl font-bold tracking-tight text-gold-300">S</p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-gold-600">Scentiqa</p>
        <h1 className="mt-8 font-display text-3xl font-bold text-stone-100">Taking a short break</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">
          The site is temporarily offline for maintenance. Your collection, diary and
          community are safe — we will be back shortly.
        </p>
        <div className="mx-auto mt-8 h-px w-24 bg-gold-700/50" />
        <p className="mt-6 text-xs text-stone-500">Thank you for your patience.</p>
      </div>
    </main>
  );
}
