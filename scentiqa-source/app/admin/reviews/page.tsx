import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { deleteReview } from '../actions';
import { SectionTitle, EmptyState } from '../components';

export const metadata = { title: 'Reviews · Admin' };

export default async function AdminReviews() {
  const c = getSupabaseServer(true)!;
  const { data: reviews, count } = await c.from('reviews')
    .select('id,rating,title,body,created_at,verified_purchase,users(username),perfumes(name,slug)', { count: 'exact' })
    .order('created_at', { ascending: false }).limit(50);

  return (
    <div>
      <SectionTitle>Reviews <span className="text-sm font-normal text-stone-400">({count} total, latest 50)</span></SectionTitle>
      {!reviews?.length ? <EmptyState>No reviews.</EmptyState> : (
        <div className="space-y-3">
          {reviews.map((r: { id: string; rating: number; title: string; body: string; created_at: string; verified_purchase: boolean; users: { username: string } | { username: string }[] | null; perfumes: { name: string; slug: string } | { name: string; slug: string }[] | null }) => (
            <div key={r.id} className="rounded-2xl border border-stone-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs text-stone-400">
                  <span className="font-bold text-stone-600 dark:text-stone-300">{(Array.isArray(r.users) ? r.users[0]?.username : r.users?.username) ?? 'member'}</span>
                  {' · '}<Link href={`/perfume/${Array.isArray(r.perfumes) ? r.perfumes[0]?.slug : r.perfumes?.slug}`} className="text-gold-600 hover:underline dark:text-gold-300">{Array.isArray(r.perfumes) ? r.perfumes[0]?.name : r.perfumes?.name}</Link>
                  {' · '}<span className="font-bold text-gold-700 dark:text-gold-300">{'★'.repeat(r.rating)}</span>
                  {r.verified_purchase && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">verified</span>}
                </div>
                <form action={deleteReview.bind(null, r.id)}><button className="shrink-0 text-xs font-bold text-red-600 hover:underline">delete</button></form>
              </div>
              <p className="mt-1 font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
