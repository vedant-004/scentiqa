// /admin — demo shell, or a functional moderation console in Supabase mode.
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';
import { AdminConsole } from './admin-client';

export const metadata = { title: 'Admin', description: 'Scentiqa admin console.' };

export default function AdminPage() {
  const configured = isSupabaseConfigured();
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Admin' }]} />
      <SectionHeading kicker="Internal" title="Admin console" />
      {!configured ? (
        <Card className="p-8 text-center">
          <p className="text-4xl">🔒</p>
          <h2 className="mt-3 font-display text-xl font-semibold">Connect Supabase to unlock the admin console</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">
            The admin console — moderation queue, dupe-suggestion review, price verification — runs on Supabase with email-allowlist access.
            Set <code className="rounded bg-stone-900/5 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">NEXT_PUBLIC_ADMIN_EMAILS</code> to your admin emails and connect Supabase. See the README for setup.
          </p>
          <p className="mt-4 text-xs text-stone-400">This is demo mode: no real moderation data exists yet.</p>
        </Card>
      ) : (
        <AdminConsole />
      )}
    </div>
  );
}
