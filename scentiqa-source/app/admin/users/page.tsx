import { getSupabaseServer } from '@/lib/supabase';
import { SectionTitle, EmptyState } from '../components';

export const metadata = { title: 'Users · Admin' };

export default async function AdminUsers() {
  const c = getSupabaseServer(true)!;
  const { data: users, count } = await c.from('users')
    .select('id,username,level,location_city,created_at').order('created_at', { ascending: false }).limit(100);

  return (
    <div>
      <SectionTitle>Users <span className="text-sm font-normal text-stone-400">({count} total, latest 100)</span></SectionTitle>
      {!users?.length ? <EmptyState>No users yet.</EmptyState> : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/70 dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100/70 text-left text-xs uppercase tracking-wider text-stone-500 dark:bg-white/[0.04]">
                <th className="px-4 py-3">Username</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: { id: string; username: string; level: string; location_city: string; created_at: string }) => (
                <tr key={u.id} className="border-t border-stone-200/60 dark:border-white/5">
                  <td className="px-4 py-2.5 font-semibold">{u.username}</td>
                  <td className="px-4 py-2.5 text-stone-500">{u.level ?? '—'}</td>
                  <td className="px-4 py-2.5 text-stone-500">{u.location_city ?? '—'}</td>
                  <td className="px-4 py-2.5 text-stone-500">{u.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
