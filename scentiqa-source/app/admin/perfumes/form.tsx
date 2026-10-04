// Shared perfume form (used by new + edit pages).
import { getSupabaseServer } from '@/lib/supabase';
import { Field, inputCls, AdminButton } from '../components';

const CONCS = ['edp', 'edt', 'extrait', 'parfum', 'oil', 'attar', 'edc'];
const GENDERS = ['men', 'women', 'unisex'];

export async function HouseSelect({ value }: { value?: string | null }) {
  const c = getSupabaseServer(true)!;
  const { data } = await c.from('houses').select('id,name').order('name').limit(500);
  return (
    <select name="house_id" defaultValue={value ?? ''} className={inputCls}>
      <option value="">— no house —</option>
      {(data ?? []).map((h: { id: string; name: string }) => <option key={h.id} value={h.id}>{h.name}</option>)}
    </select>
  );
}

export function PerfumeForm({ initial, action, submitLabel }: {
  initial?: Record<string, unknown>;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const g = (k: string, d = '') => (initial?.[k] as string) ?? d;
  const arr = (k: string) => ((initial?.[k] as string[]) ?? []).join(', ');
  const accords = initial?.accords
    ? (initial.accords as { name: string; strength: number }[]).map((a) => `${a.name}: ${a.strength}`).join('\n')
    : '';
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <Field label="Name">
        <input name="name" required defaultValue={g('name')} className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="House"><HouseSelect value={initial?.house_id as string} /></Field>
        <Field label="Gender">
          <select name="gender" defaultValue={g('gender')} className={inputCls}>
            <option value="">—</option>{GENDERS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Concentration">
          <select name="concentration" defaultValue={g('concentration')} className={inputCls}>
            <option value="">—</option>{CONCS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Launch year"><input name="launch_year" inputMode="numeric" defaultValue={g('launch_year')} className={inputCls} /></Field>
        <Field label="Photo URL" hint="Full URL or /images/products/… path">
          <input name="bottle_image_url" defaultValue={g('bottle_image_url')} className={inputCls} />
        </Field>
      </div>
      <Field label="Description"><textarea name="description" rows={4} defaultValue={g('description')} className={inputCls} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Top notes" hint="comma separated"><input name="top_notes" defaultValue={arr('top_notes')} className={inputCls} /></Field>
        <Field label="Heart notes" hint="comma separated"><input name="heart_notes" defaultValue={arr('heart_notes')} className={inputCls} /></Field>
        <Field label="Base notes" hint="comma separated"><input name="base_notes" defaultValue={arr('base_notes')} className={inputCls} /></Field>
      </div>
      <Field label="Accords" hint='One per line as "name: strength" (0–100), or JSON'>
        <textarea name="accords" rows={4} defaultValue={accords} className={inputCls} placeholder={'woody: 80\nmusky: 65'} />
      </Field>
      <Field label="Scent story"><textarea name="scent_story" rows={6} defaultValue={g('scent_story')} className={inputCls} /></Field>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="beginner_friendly" defaultChecked={initial?.beginner_friendly === true} className="h-4 w-4 accent-gold-700" /> Beginner-friendly
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="is_discontinued" defaultChecked={initial?.is_discontinued === true} className="h-4 w-4 accent-gold-700" /> Discontinued
        </label>
      </div>
      <div><AdminButton>{submitLabel}</AdminButton></div>
    </form>
  );
}
