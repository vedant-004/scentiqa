import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { SectionTitle, EmptyState } from '../components';

const PER_PAGE = 30;

export const metadata = { title: 'Articles · Admin' };

export default async function AdminArticles({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = '', page = '1' } = await searchParams;
  const c = getSupabaseServer(true)!;
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const from = (pg - 1) * PER_PAGE;

  let query = c.from('articles').select('id,slug,title,category,is_published,published_at', { count: 'exact' }).order('published_at', { ascending: false });
  if (q.trim()) query = query.ilike('title', `%${q.trim()}%`);
  const { data, count } = await query.range(from, from + PER_PAGE - 1);
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <SectionTitle action={<Link href="/admin/articles/new" className="rounded-xl bg-gold-700 px-4 py-2 text-sm font-bold text-white hover:bg-gold-800">+ New article</Link>}>
        Articles <span className="text-sm font-normal text-stone-400">({total.toLocaleString('en-IN')})</span>
      </SectionTitle>
      <form method="get" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search by title…" className="w-full max-w-md rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.05]" />
        <button className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-stone-900">Search</button>
      </form>
      {!data?.length ? <EmptyState>No articles found.</EmptyState> : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/70 dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100/70 text-left text-xs uppercase tracking-wider text-stone-500 dark:bg-white/[0.04]">
                <th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a: { id: string; slug: string; title: string; category: string; is_published: boolean }) => (
                <tr key={a.id} className="border-t border-stone-200/60 hover:bg-stone-50 dark:border-white/5 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5 font-semibold">{a.title}</td>
                  <td className="px-4 py-2.5 text-stone-500">{a.category}</td>
                  <td className="px-4 py-2.5">
                    {a.is_published
                      ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">live</span>
                      : <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-600 dark:bg-white/10 dark:text-stone-300">draft</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/articles/${a.id}`} className="font-bold text-gold-700 hover:underline dark:text-gold-300">Edit</Link>
                    {a.is_published && <>{' · '}<Link href={`/news/${a.slug}`} className="text-stone-400 hover:text-stone-600">view</Link></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          {pg > 1 && <Link href={`/admin/articles?q=${encodeURIComponent(q)}&page=${pg - 1}`} className="font-bold text-gold-700 hover:underline">← Prev</Link>}
          <span className="text-stone-400">Page {pg} of {pages}</span>
          {pg < pages && <Link href={`/admin/articles?q=${encodeURIComponent(q)}&page=${pg + 1}`} className="font-bold text-gold-700 hover:underline">Next →</Link>}
        </div>
      )}
    </div>
  );
}
