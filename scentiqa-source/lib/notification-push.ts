// Unpushed (retracted) notification tracking via site_settings.
// No migration needed: the unpushed IDs live in the `notifications_unpushed`
// key as { ids: [...] }. Server-only (uses the service-role client).
import { getSupabaseServer } from '@/lib/supabase';

const KEY = 'notifications_unpushed';

export async function getUnpushedIds(): Promise<Set<string>> {
  try {
    const c = getSupabaseServer(true);
    if (!c) return new Set();
    const { data } = await c.from('site_settings').select('value').eq('key', KEY).maybeSingle();
    const ids = (data as { value?: { ids?: unknown } } | null)?.value?.ids;
    return new Set(Array.isArray(ids) ? ids.map((x) => String(x)) : []);
  } catch {
    return new Set();
  }
}

export async function setUnpushed(id: string, unpushed: boolean): Promise<void> {
  const c = getSupabaseServer(true);
  if (!c) throw new Error('Database not configured');
  const current = await getUnpushedIds();
  if (unpushed) current.add(id);
  else current.delete(id);
  const { error } = await c
    .from('site_settings')
    .upsert({ key: KEY, value: { ids: [...current] } }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}
