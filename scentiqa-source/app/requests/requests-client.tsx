'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { useAuth } from '@/components/auth';

interface Req {
  id: string; perfume_name: string; house_name: string; reason: string;
  vote_count: number; requester_name: string; team_created: boolean; created_at: string;
}

export function RequestsClient({ initial }: { initial: Req[] }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Req[]>(initial);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  // form
  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const nameValid = name.trim().length > 0;
  const reasonWords = reason.trim().split(/\s+/).filter(Boolean).length;
  const reasonValid = reasonWords >= 5;
  const formValid = nameValid && reasonValid;
  const showNameError = touched && !nameValid;
  const showReasonError = touched && reason.trim().length > 0 && !reasonValid;

  const reload = async () => {
    try {
      const j = await fetch('/api/requests').then((r) => r.json());
      setRequests(j.requests ?? []);
    } catch { /* offline */ }
  };

  const vote = async (id: string) => {
    if (!user) { window.location.href = '/login?next=/requests'; return; }
    setBusy(id); setError('');
    try {
      const r = await fetch(`/api/requests/${id}/vote`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Vote failed');
      setVoted((v) => ({ ...v, [id]: j.voted }));
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Vote failed'); }
    finally { setBusy(null); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login?next=/requests'; return; }
    setTouched(true);
    if (!formValid) {
      setError(!nameValid ? 'Please enter a perfume name.' : 'Tell us why in at least 5 words.');
      return;
    }
    setSubmitting(true); setError(''); setOkMsg('');
    try {
      const r = await fetch('/api/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfume_name: name.trim(), house_name: house.trim(), reason: reason.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Submit failed');
      setName(''); setHouse(''); setReason(''); setTouched(false);
      setOkMsg('Request submitted — it now needs upvotes to climb the board.');
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Submit failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">{error}</p>}
      {okMsg && <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">{okMsg}</p>}

      <div className="space-y-3">
        {requests.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-stone-500">No open requests yet — be the first.</p>
          </Card>
        )}
        {requests.map((q, i) => (
          <Card key={q.id} className="flex gap-4 p-4 sm:p-5">
            <div className="flex w-14 shrink-0 flex-col items-center">
              <button
                onClick={() => vote(q.id)}
                disabled={busy === q.id}
                aria-label={voted[q.id] ? 'Remove upvote' : 'Upvote this request'}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all active:scale-90 ${voted[q.id] ? 'bg-gold-600 text-white' : 'bg-stone-900/5 text-stone-500 hover:bg-gold-600/15 hover:text-gold-700 dark:bg-white/10 dark:text-stone-300'}`}>
                ▲
              </button>
              <span className="mt-1 text-sm font-bold text-stone-700 dark:text-stone-100">{q.vote_count}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/80 font-display text-[11px] font-bold text-white dark:bg-white/90 dark:text-stone-900">#{i + 1}</span>
                <h3 className="font-display text-lg font-bold tracking-tight">{q.perfume_name}</h3>
                {q.team_created && (
                  <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">Team created</span>
                )}
              </div>
              {q.house_name && <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">{q.house_name}</p>}
              {q.reason && <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{q.reason}</p>}
              <p className="mt-2 text-xs text-stone-400">Requested by {q.requester_name || 'a member'}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold">Request a perfume</h2>
        {!user ? (
          <p className="mt-2 text-sm text-stone-500">
            <Link href="/login?next=/requests" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Sign in</Link> to submit a request and upvote.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="req-name" className="mb-1.5 block text-sm font-semibold">Perfume name <span className="text-red-600">*</span></label>
                <Input id="req-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)}
                  placeholder="e.g. Aventus" maxLength={120} aria-invalid={showNameError}
                  aria-describedby={showNameError ? 'req-name-error req-name-count' : 'req-name-count'} />
                <div className="mt-1 flex items-center justify-between">
                  {showNameError
                    ? <p id="req-name-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">Please enter a perfume name.</p>
                    : <span />}
                  <p id="req-name-count" className="text-xs text-stone-400">{name.length}/120</p>
                </div>
              </div>
              <div>
                <label htmlFor="req-house" className="mb-1.5 block text-sm font-semibold">House / brand <span className="font-normal text-stone-400">(optional)</span></label>
                <Input id="req-house" value={house} onChange={(e) => setHouse(e.target.value)} placeholder="e.g. Creed" maxLength={120} />
              </div>
            </div>
            <div>
              <label htmlFor="req-reason" className="mb-1.5 block text-sm font-semibold">Why should we add it? <span className="font-normal text-stone-400">(at least 5 words)</span></label>
              <Textarea id="req-reason" value={reason} onChange={(e) => setReason(e.target.value)} onBlur={() => setTouched(true)}
                placeholder="Tell us what makes it worth adding…" rows={3} maxLength={500}
                aria-invalid={showReasonError} aria-describedby="req-reason-count" />
              <div className="mt-1 flex items-center justify-between">
                {showReasonError
                  ? <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">Tell us why in at least 5 words.</p>
                  : <span />}
                <p id="req-reason-count" className="text-xs text-stone-400">{reason.length}/500 · {reasonWords}/5 words min</p>
              </div>
            </div>
            <Button type="submit" disabled={submitting || (touched && !formValid)}>{submitting ? 'Submitting…' : 'Submit request'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
