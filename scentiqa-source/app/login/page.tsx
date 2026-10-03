// /login — Supabase auth. Demo mode explains the read-only state.
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button, Card, Input, SectionHeading } from '@/components';
import { Breadcrumbs } from '@/components';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const configured = isSupabaseConfigured();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!configured) { setError('Supabase is not connected in this demo. See the README to enable sign-in.'); return; }
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { error: err } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (err) setError(err.message);
      else setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Sign in' }]} />
      <SectionHeading kicker="Members" title="Sign in" />
      <Card className="p-6 sm:p-8">
        {sent ? (
          <div className="text-center">
            <p className="text-4xl">📧</p>
            <h2 className="mt-3 font-display text-xl font-semibold">Check your inbox</h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">Password-free sign-in — we&rsquo;ll email you a magic link.</p>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" className="w-full" size="lg">Send magic link</Button>
            {!configured && (
              <p className="rounded-xl bg-gold-600/10 p-3 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                🔒 Demo mode is read-only. Connect Supabase (see README) to enable sign-in, reviews, wardrobes and price alerts.
              </p>
            )}
          </form>
        )}
      </Card>
      <p className="mt-6 text-center text-sm text-stone-400">
        By signing in you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
    </div>
  );
}
