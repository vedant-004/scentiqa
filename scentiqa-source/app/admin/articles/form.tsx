// Shared article form (used by new + edit pages).
import { Field, inputCls, AdminButton } from '../components';

const CATS = ['news', 'guide', 'review', 'interview', 'announcement'];

export function ArticleForm({ initial, action, submitLabel }: {
  initial?: Record<string, unknown>;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const g = (k: string, d = '') => (initial?.[k] as string) ?? d;
  const pub = typeof initial?.published_at === 'string' ? initial.published_at.slice(0, 16) : '';
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <Field label="Title">
        <input name="title" required defaultValue={g('title')} className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <select name="category" defaultValue={g('category', 'news')} className={inputCls}>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Author">
          <input name="author_name" defaultValue={g('author_name', 'Scentiqa Editorial')} className={inputCls} />
        </Field>
        <Field label="Published at" hint="Leave empty for now">
          <input name="published_at" type="datetime-local" defaultValue={pub} className={inputCls} />
        </Field>
      </div>
      <Field label="Excerpt" hint="Short summary shown on listing pages">
        <textarea name="excerpt" rows={2} defaultValue={g('excerpt')} className={inputCls} />
      </Field>
      <Field label="Body" hint="Main article content">
        <textarea name="body" rows={14} defaultValue={g('body')} className={inputCls} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="is_published" defaultChecked={initial?.is_published !== false} className="h-4 w-4 accent-gold-700" />
        Published (visible on the site)
      </label>
      <div><AdminButton>{submitLabel}</AdminButton></div>
    </form>
  );
}
