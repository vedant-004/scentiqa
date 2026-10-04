// /login — Supabase auth. Demo mode explains the read-only state.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/components/auth';
import { Button, Card, Input, SectionHeading } from '@/components';
import { Breadcrumbs } from '@/components';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.replace('/account');
  }, [user, loading, router]);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const configured = isSupabaseConfigured();

  if (!loading && user) {
    return (
      <div className="mx-auto max-w-md px-4 pt-16 text-center sm:px-6">
        <p className="text-stone-500 dark:text-stone-400">You&rsquo;re signed in — taking you to your dashboard…</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!configured) { setError('Supabase is not connected in this demo. See the README to enable sign-in.'); return; }
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) { setError('Sign-in failed.'); return; }
      const { error: err } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (err) setError(err.message);
      else setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    if (!configured) { setError('Supabase is not connected in this demo. See the README to enable sign-in.'); return; }
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) { setError('Sign-in failed.'); return; }
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email profile',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (err) setError(err.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
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
          <div className="space-y-4">
            <Button type="button" onClick={signInWithGoogle} variant="outline" size="lg" className="w-full">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Continue with Google
            </Button>
            <p className="px-1 text-center text-xs leading-relaxed text-stone-400">
              Google will ask you to confirm that Scentiqa can see your email address and basic profile.
            </p>
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="h-px flex-1 bg-stone-200 dark:bg-ink-700" />
              or
              <span className="h-px flex-1 bg-stone-200 dark:bg-ink-700" />
            </div>
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
          </div>
        )}
      </Card>
      <p className="mt-6 text-center text-sm text-stone-400">
        By signing in you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
    </div>
  );
}
