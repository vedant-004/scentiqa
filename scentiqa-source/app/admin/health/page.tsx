import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { SectionTitle, EmptyState } from '../components';

export const metadata = { title: 'Data health · Admin' };

const CHECKS = [
  { key: 'no-photo', label: 'Missing photo', filter: 'bottle_image_url.is.null', desc: 'Perfumes with no product image — the site falls back to a CSS bottle.' },
  { key: 'no-story', label: 'Missing scent story', filter: 'scent_story.is.null', desc: 'No "what it smells like" story yet.' },
  { key: 'no-accords', label: 'Missing accords', filter: 'accords.eq.[]', desc: 'Accord bars won\'t render on the perfume page.' },
  { key: 'no-desc', label: 'Missing description', filter: 'description.is.null', desc: 'No editorial description text.' },
  { key: 'no-notes', label: 'Missing all notes', filter: 'top_notes.eq.[],heart_notes.eq.[],base_notes.eq.[]', desc: 'Empty note pyramid.' },
] as const;

export default async function AdminHealth({ searchParams }: { searchParams: Promise<{ check?: string }> }) {
  const { check = 'no-photo' } = await searchParams;
  const c = getSupabaseServer(true)!;
  const active = CHECKS.find((x) => x.key === check) ?? CHECKS[0];

  const counts = await Promise.all(CHECKS.map(async (x) => {
    const { count } = await c.from('perfumes').select('id', { count: 'exact', head: true }).or(x.filter);
    return [x.key, count ?? 0] as const;
  }));
  const countMap = Object.fromEntries(counts);

  const { data: rows } = await c.from('perfumes').select('id,name,slug,houses(name)').or(active.filter).order('name').limit(50);

  return (
    <div className="space-y-6">
      <SectionTitle>Data health center</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {CHECKS.map((x) => (
          <Link key={x.key} href={`/admin/health?check=${x.key}`}
            className={`rounded-2xl border p-4 ${x.key === active.key ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/30' : 'border-stone-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]'}`}>
            <p className="font-display text-2xl font-bold">{(countMap[x.key] ?? 0).toLocaleString('en-IN')}</p>
            <p className="mt-1 text-xs font-semibold text-stone-500">{x.label}</p>
          </Link>
        ))}
      </div>
      <div>
        <h3 className="mb-1 font-display text-lg font-bold">{active.label} <span className="text-sm font-normal text-stone-400">(first 50)</span></h3>
        <p className="mb-3 text-sm text-stone-500">{active.desc}</p>
        {!rows?.length ? <EmptyState>All clear — nothing missing here. 🎉</EmptyState> : (
          <div className="space-y-2">
            {rows.map((p: { id: string; name: string; slug: string; houses: { name: string } | { name: string }[] | null }) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-stone-200/70 bg-white/60 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                <span><span className="font-semibold">{p.name}</span> <span className="text-xs text-stone-400">· {Array.isArray(p.houses) ? p.houses[0]?.name : p.houses?.name}</span></span>
                <Link href={`/admin/perfumes/${p.id}`} className="font-bold text-gold-700 hover:underline dark:text-gold-300">Fix →</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
