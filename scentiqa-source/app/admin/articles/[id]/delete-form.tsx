'use client';
import { AdminButton } from '../../components';

export function DeleteConfirm({ title, action }: { title: string; action: (fd: FormData) => Promise<void> }) {
  return (
    <form
      action={action}
      className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/40 dark:bg-red-950/20"
      onSubmit={(e) => { if (!confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault(); }}
    >
      <p className="text-sm font-bold text-red-800 dark:text-red-300">Danger zone</p>
      <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">Deletes this article permanently. Cannot be undone.</p>
      <div className="mt-3"><AdminButton danger>Delete article</AdminButton></div>
    </form>
  );
}
