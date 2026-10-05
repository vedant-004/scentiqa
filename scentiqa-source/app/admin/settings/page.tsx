import { getSupabaseServer } from '@/lib/supabase';
import { updateSiteSetting } from '../actions';
import { SectionTitle, Field, inputCls, AdminButton } from '../components';
import { PotdPicker } from './potd-picker';

export const metadata = { title: 'Site settings · Admin' };

async function setting(key: string): Promise<Record<string, unknown>> {
  const c = getSupabaseServer(true);
  if (!c) return {};
  const { data } = await c.from('site_settings').select('value').eq('key', key).maybeSingle();
  const v = (data as { value?: unknown } | null)?.value;
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

export default async function AdminSettings() {
  const potd = await setting('potd_override');
  const hero = await setting('hero');
  const banner = await setting('banner');

  const savePotd = updateSiteSetting.bind(null, 'potd_override');
  const clearPotd = updateSiteSetting.bind(null, 'potd_override', {});
  const saveHero = updateSiteSetting.bind(null, 'hero');
  const saveBanner = updateSiteSetting.bind(null, 'banner');

  const currentSlug = typeof potd.perfume_slug === 'string' ? potd.perfume_slug : '';

  return (
    <div className="grid gap-8">
      {/* ============ Perfume of the Day ============ */}
      <section>
        <SectionTitle>Perfume of the Day override</SectionTitle>
        <div className="rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-4 text-sm text-stone-500">
            Pick a specific perfume to feature, or clear the override to resume the automatic daily rotation.
            {currentSlug && (
              <> Currently overriding with <strong className="text-gold-700 dark:text-gold-300">{currentSlug}</strong>.</>
            )}
          </p>
          <PotdPicker currentSlug={currentSlug} saveAction={savePotd} />
          {currentSlug && (
            <form action={clearPotd} className="mt-4">
              <AdminButton>Clear override — resume auto-rotation</AdminButton>
            </form>
          )}
        </div>
      </section>

      {/* ============ Hero ============ */}
      <section>
        <SectionTitle>Homepage hero</SectionTitle>
        <form action={async (fd: FormData) => { 'use server'; await saveHero({ headline: fd.get('headline'), subheadline: fd.get('subheadline') }); }}
          className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <Field label="Headline" hint="Leave empty to use the default headline">
            <input name="headline" defaultValue={typeof hero.headline === 'string' ? hero.headline : ''} className={inputCls} placeholder="Find a cheaper alternative to any perfume." />
          </Field>
          <Field label="Subheadline" hint="Leave empty to use the default subheadline">
            <textarea name="subheadline" rows={3} defaultValue={typeof hero.subheadline === 'string' ? hero.subheadline : ''} className={inputCls} placeholder="Lab-tested dupe similarity scores, INR prices from verified Indian sellers…" />
          </Field>
          <div><AdminButton>Save hero</AdminButton></div>
        </form>
      </section>

      {/* ============ Banner ============ */}
      <section>
        <SectionTitle>Announcement banner</SectionTitle>
        <form action={async (fd: FormData) => { 'use server'; await saveBanner({ text: fd.get('text'), link: fd.get('link'), enabled: fd.get('enabled') === 'on' }); }}
          className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <Field label="Banner text">
            <input name="text" defaultValue={typeof banner.text === 'string' ? banner.text : ''} className={inputCls} placeholder="Awards 2026 voting is open!" />
          </Field>
          <Field label="Link (optional)" hint="Relative path like /awards/2026 or full URL">
            <input name="link" defaultValue={typeof banner.link === 'string' ? banner.link : ''} className={inputCls} placeholder="/awards/2026" />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="enabled" defaultChecked={banner.enabled === true} className="h-4 w-4 accent-gold-700" />
            Show banner site-wide
          </label>
          <div><AdminButton>Save banner</AdminButton></div>
        </form>
      </section>
    </div>
  );
}
