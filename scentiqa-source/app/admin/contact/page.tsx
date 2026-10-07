import { getSupabaseServer } from '@/lib/supabase';
import { updateSiteSetting, setContactMessageRead, deleteContactMessage } from '../actions';
import { SectionTitle, Field, inputCls, AdminButton, EmptyState } from '../components';

export const metadata = { title: 'Contact · Admin' };

type Msg = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

async function setting(key: string): Promise<Record<string, unknown>> {
  const c = getSupabaseServer(true);
  if (!c) return {};
  const { data } = await c.from('site_settings').select('value').eq('key', key).maybeSingle();
  const v = (data as { value?: unknown } | null)?.value;
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

export default async function AdminContact() {
  const c = getSupabaseServer(true);
  const contact = await setting('contact');
  const { data: messages } = c
    ? await c.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
    : { data: null };
  const msgs = (messages ?? []) as Msg[];
  const unread = msgs.filter((m) => !m.is_read).length;

  const saveContact = updateSiteSetting.bind(null, 'contact');

  const str = (v: unknown, fb: string) => (typeof v === 'string' ? v : fb);

  return (
    <div className="grid gap-8">
      {/* ============ Page content ============ */}
      <section>
        <SectionTitle>Contact page content</SectionTitle>
        <form
          action={async (fd: FormData) => {
            'use server';
            await saveContact({
              intro: fd.get('intro'),
              email: fd.get('email'),
              phoneDisplay: fd.get('phoneDisplay'),
              phoneDigits: String(fd.get('phoneDigits') || '').replace(/\D/g, ''),
              whatsapp: fd.get('whatsapp') === 'on',
              responseNote: fd.get('responseNote'),
            });
          }}
          className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <Field label="Intro line" hint="Shown under the 'Contact us' heading">
            <textarea name="intro" rows={2} defaultValue={str(contact.intro, 'Corrections, lab partnerships, seller verification, press — we read everything.')} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact email">
              <input name="email" type="email" defaultValue={str(contact.email, 'vedanttyagi.official@gmail.com')} className={inputCls} />
            </Field>
            <Field label="Response note" hint="e.g. Response time: usually within 2 working days">
              <input name="responseNote" defaultValue={str(contact.responseNote, 'Response time: usually within 2 working days.')} className={inputCls} />
            </Field>
            <Field label="Phone (display)" hint="Shown as-is, e.g. +91 70179 21949. Leave empty to hide the phone line">
              <input name="phoneDisplay" defaultValue={str(contact.phoneDisplay, '+91 70179 21949')} className={inputCls} />
            </Field>
            <Field label="Phone (digits for tel:/WhatsApp links)" hint="Digits only, e.g. 917017921949">
              <input name="phoneDigits" defaultValue={str(contact.phoneDigits, '917017921949')} className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="whatsapp" defaultChecked={contact.whatsapp !== false} className="h-4 w-4 accent-gold-700" />
            Show WhatsApp link next to the phone number
          </label>
          <div><AdminButton>Save contact page</AdminButton></div>
        </form>
      </section>

      {/* ============ Inbox ============ */}
      <section>
        <SectionTitle>
          Message inbox <span className="text-sm font-normal text-stone-400">({unread} unread)</span>
        </SectionTitle>
        {!msgs.length ? (
          <EmptyState>No messages yet. New submissions from the /contact form land here.</EmptyState>
        ) : (
          <div className="space-y-3">
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl border p-4 ${m.is_read
                  ? 'border-stone-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]'
                  : 'border-gold-500/40 bg-gold-500/[0.06] dark:border-gold-400/30'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {!m.is_read && (
                        <span className="rounded-full bg-gold-600 px-2.5 py-0.5 font-bold text-white">NEW</span>
                      )}
                      <span className="rounded-full bg-gold-600/10 px-2.5 py-0.5 font-bold text-gold-700 dark:text-gold-300">{m.topic}</span>
                      <span className="font-semibold text-stone-700 dark:text-stone-200">{m.name}</span>
                      <a href={`mailto:${m.email}`} className="text-stone-400 underline">{m.email}</a>
                      <span className="text-stone-400">{m.created_at?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-200">{m.message}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={setContactMessageRead.bind(null, m.id, !m.is_read)}>
                      <AdminButton>{m.is_read ? 'Mark unread' : 'Mark read'}</AdminButton>
                    </form>
                    <form action={deleteContactMessage.bind(null, m.id)}>
                      <AdminButton danger>Delete</AdminButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
