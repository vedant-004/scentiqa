// Shown when ADMIN_EMAILS is not set. No secrets displayed.
export default function AdminSetup() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-300">Scentiqa control room</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Admin access not configured yet</h1>
      <div className="mt-6 space-y-4 rounded-2xl border border-stone-200/70 bg-white/70 p-6 text-sm leading-relaxed text-stone-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300">
        <p>Two one-time settings in your Vercel dashboard (Scentiqa project → Settings → Environment Variables), then redeploy:</p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong className="text-stone-900 dark:text-stone-100">ADMIN_EMAILS</strong> — your Google login email, e.g.{' '}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 dark:bg-white/10">you@gmail.com</code>. Only this email can open /admin.
          </li>
          <li>
            <strong className="text-stone-900 dark:text-stone-100">SUPABASE_SERVICE_ROLE_KEY</strong> — from your Supabase dashboard (Project Settings → API → service_role key). The admin panel uses it only in server-side code, never in the browser.
          </li>
        </ol>
        <p className="text-xs text-stone-400">
          Optional: in Supabase → Storage, create a public bucket named <code>product-images</code> to enable photo uploads from the admin panel.
        </p>
      </div>
    </div>
  );
}
