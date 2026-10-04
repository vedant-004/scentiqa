import { SectionTitle } from '../components';

const TABLES = ['perfumes', 'houses', 'prices', 'sellers', 'dupe_relationships', 'reviews', 'users'] as const;

export const metadata = { title: 'Export · Admin' };

export default function AdminExport() {
  return (
    <div>
      <SectionTitle>Export data</SectionTitle>
      <p className="mb-4 text-sm text-stone-500">One-click backups. JSON is lossless; CSV flattens arrays into text. Exports are capped at 20,000 rows per table.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TABLES.map((t) => (
          <div key={t} className="flex items-center justify-between rounded-2xl border border-stone-200/70 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <span className="font-mono text-sm font-bold">{t}</span>
            <span className="flex gap-2">
              <a href={`/api/admin/export?table=${t}&format=json`} className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-stone-900">JSON</a>
              <a href={`/api/admin/export?table=${t}&format=csv`} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-bold dark:border-white/15">CSV</a>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-stone-400">Tip: export <span className="font-mono">perfumes</span> + <span className="font-mono">prices</span> monthly as your off-site backup.</p>
    </div>
  );
}
