'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth';
import { Button } from '@/components/ui';

export function EnterButton({ slug }: { slug: string }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<'idle' | 'busy' | 'entered' | 'error'>('idle');
  const [error, setError] = useState('');

  if (loading) return <Button size="sm" disabled>Loading…</Button>;
  if (!user) {
    return (
      <Link href={`/login?next=/giveaways`}
        className="inline-block rounded-xl bg-gold-600 px-6 py-3 text-sm font-bold text-white shadow-lift transition hover:bg-gold-500">
        Sign in to enter
      </Link>
    );
  }

  const enter = async () => {
    setState('busy');
    setError('');
    try {
      const r = await fetch(`/api/giveaways/${slug}/enter`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Entry failed');
      setState('entered');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Entry failed');
    }
  };

  if (state === 'entered') {
    return (
      <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-6 py-3 text-sm font-bold text-emerald-300">
        ✓ You&rsquo;re in — good luck!
      </p>
    );
  }

  return (
    <div>
      <Button size="sm" onClick={enter} disabled={state === 'busy'}>
        {state === 'busy' ? 'Entering…' : 'Enter giveaway'}
      </Button>
      {state === 'error' && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
