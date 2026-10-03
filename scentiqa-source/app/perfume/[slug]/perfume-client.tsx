// Client-side interactive blocks for the perfume page.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn, inr } from '@/lib/utils';
import { Button, Chip, Dialog, DialogTitle, Input, Textarea, useToast } from '@/components/ui';
import { StarInput } from '@/components';
import { castVote, createPriceAlert, postReview, reportPriceError, setWardrobe, suggestDupe } from '@/lib/actions';
import type { Perfume } from '@/lib/types';

function demoToast(toast: (t: string, tone?: 'ok' | 'err' | 'info') => void) {
  toast('Connect Supabase to enable accounts — this is demo mode', 'info');
}

/* ---------- Love / Like / Dislike ---------- */
export function SentimentVote({ perfumeId }: { perfumeId: string }) {
  const { toast } = useToast();
  const [val, setVal] = useState<'love' | 'like' | 'dislike' | null>(null);
  const [counts] = useState({ love: 1240, like: 860, dislike: 95 });
  const vote = async (v: 'love' | 'like' | 'dislike') => {
    setVal(v);
    const r = await castVote(perfumeId, 'love_like_dislike', v);
    if (r.demo) demoToast(toast); else if (r.ok) toast('Vote recorded');
  };
  const opts = [['love', '❤️ Love', counts.love], ['like', '👍 Like', counts.like], ['dislike', '👎 Dislike', counts.dislike]] as const;
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(([v, label, c]) => (
        <Chip key={v} active={val === v} onClick={() => vote(v)} aria-pressed={val === v}>
          {label} <span className="text-xs opacity-70">{(c + (val === v ? 1 : 0)).toLocaleString('en-IN')}</span>
        </Chip>
      ))}
    </div>
  );
}

/* ---------- Wardrobe shelf buttons ---------- */
export function WardrobeButtons({ perfumeId, name }: { perfumeId: string; name: string }) {
  const { toast } = useToast();
  const [shelf, setShelf] = useState<string | null>(null);
  const add = async (s: string) => {
    setShelf(s);
    const r = await setWardrobe(perfumeId, s);
    if (r.demo) { demoToast(toast); setShelf(null); } else if (r.ok) toast(`“${name}” added to “${s}” shelf`);
  };
  const shelves = [['have', 'Have it'], ['want', 'Want it'], ['had', 'Had it'], ['test', 'Want to test']] as const;
  return (
    <div className="flex flex-wrap gap-2">
      {shelves.map(([s, label]) => (
        <Chip key={s} active={shelf === s} onClick={() => add(s)}>{shelf === s ? '✓ ' : '+ '}{label}</Chip>
      ))}
    </div>
  );
}

/* ---------- Review modal ---------- */
export function ReviewModal({ perfume, triggerLabel = 'Write a review' }: { perfume: Perfume; triggerLabel?: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const valid = rating > 0 && body.trim().length >= 50;
  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    const r = await postReview(perfume.id, rating, title.trim() || `${rating}-star review`, body.trim());
    setBusy(false);
    if (r.demo) { demoToast(toast); return; }
    if (r.ok) { toast('Review posted — thank you!'); setOpen(false); setRating(0); setTitle(''); setBody(''); }
    else toast(r.error ?? 'Could not post review', 'err');
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="review-title">
        <DialogTitle id="review-title">Review {perfume.name}</DialogTitle>
        <div className="space-y-4">
          <div><p className="mb-2 text-sm font-semibold">Your rating</p><StarInput value={rating} onChange={setRating} /></div>
          <div><p className="mb-2 text-sm font-semibold">Headline <span className="font-normal text-stone-400">(optional)</span></p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a line" maxLength={80} /></div>
          <div><p className="mb-2 text-sm font-semibold">Your review <span className="font-normal text-stone-400">(min 50 characters)</span></p>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="How does it perform in Indian weather? How long does it last on you?" maxLength={2000} />
            <p className={cn('mt-1 text-right text-xs', body.trim().length >= 50 ? 'text-emerald-600' : 'text-stone-400')}>{body.trim().length}/50 min</p></div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4 accent-amber-600" />
            I bought this in India <span className="text-stone-400">(verified purchase badge)</span>
          </label>
          <Button onClick={submit} disabled={!valid || busy} className="w-full">{busy ? 'Posting…' : 'Post review'}</Button>
        </div>
      </Dialog>
    </>
  );
}

/* ---------- Price alert ---------- */
export function PriceAlertButton({ perfumeId, currentPrice }: { perfumeId: string; currentPrice: number | null }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const v = Number(target);
    if (!v || v <= 0) return;
    setBusy(true);
    const r = await createPriceAlert(perfumeId, v);
    setBusy(false);
    if (r.demo) { demoToast(toast); return; }
    if (r.ok) { toast(`Alert set — we\u2019ll email you under ${inr(v)}`); setOpen(false); setTarget(''); }
    else toast(r.error ?? 'Could not set alert', 'err');
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>🔔 Price alert</Button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="alert-title">
        <DialogTitle id="alert-title">Price alert</DialogTitle>
        <p className="mb-3 text-sm text-stone-500">Current best: <strong>{inr(currentPrice)}</strong>. We&rsquo;ll notify you when it drops below your target.</p>
        <div className="flex gap-2">
          <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target price in ₹" min={1} />
          <Button onClick={save} disabled={busy || !Number(target)}>Set</Button>
        </div>
      </Dialog>
    </>
  );
}

/* ---------- Suggest dupe ---------- */
export function SuggestDupe({ perfumeId, perfumeName }: { perfumeId: string; perfumeName: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [note, setNote] = useState('');
  const submit = async () => {
    if (!name.trim() || !house.trim()) return;
    const r = await suggestDupe(perfumeId, name.trim(), house.trim(), note.trim());
    if (r.demo) { demoToast(toast); return; }
    if (r.ok) { toast('Suggestion sent to moderators — thank you!'); setOpen(false); setName(''); setHouse(''); setNote(''); }
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>+ Suggest an alternative</Button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="suggest-title">
        <DialogTitle id="suggest-title">Suggest an alternative to {perfumeName}</DialogTitle>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dupe perfume name" />
          <Input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="House / brand" />
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why is it similar? (optional)" />
          <p className="text-xs text-stone-400">Community suggestions are reviewed by moderators and marked “community suggested” until lab-tested.</p>
          <Button onClick={submit} disabled={!name.trim() || !house.trim()} className="w-full">Submit suggestion</Button>
        </div>
      </Dialog>
    </>
  );
}

/* ---------- Report price error ---------- */
export function ReportPriceButton({ perfumeId }: { perfumeId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!detail.trim()) return;
    setBusy(true);
    const r = await reportPriceError(perfumeId, detail.trim());
    setBusy(false);
    if (r.demo) { demoToast(toast); return; }
    if (r.ok) { toast('Report sent — our moderators will verify the price'); setOpen(false); setDetail(''); }
    else toast(r.error ?? 'Could not send report', 'err');
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="mt-3 text-xs font-medium text-stone-400 hover:text-stone-600 hover:underline">Report a price error or a suspicious seller →</button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="report-title">
        <DialogTitle id="report-title">Report a price error</DialogTitle>
        <div className="space-y-3">
          <Textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What is wrong? e.g. “₹2,450 listed but the seller shows ₹2,899” or “seller link looks like a counterfeit store”" />
          <p className="text-xs text-stone-400">Reports go to the Scentiqa moderation queue. Verified prices are re-checked within 48 hours.</p>
          <Button onClick={submit} disabled={busy || !detail.trim()} className="w-full">{busy ? 'Sending…' : 'Send report'}</Button>
        </div>
      </Dialog>
    </>
  );
}

/* ---------- Community meter voting (demo: local optimistic) ---------- */
export function MeterVote({ label, perfumeId, voteType }: { label: string; perfumeId: string; voteType: string }) {
  const { toast } = useToast();
  const [mine, setMine] = useState<number | null>(null);
  const [dist] = useState(() => [8, 14, 26, 32, 20]);
  const vote = async (v: number) => {
    setMine(v);
    const r = await castVote(perfumeId, voteType, String(v));
    if (r.demo) demoToast(toast); else if (r.ok) toast('Vote recorded');
  };
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label} <span className="font-normal text-stone-400">— tap to vote</span></p>
      <div className="flex items-end gap-1.5">
        {dist.map((d, i) => (
          <button key={i} onClick={() => vote(i + 1)} aria-label={`${label} ${i + 1} out of 5`}
            className={cn('group flex flex-1 flex-col items-center gap-1 rounded-lg py-1 transition-colors', mine === i + 1 ? 'bg-gold-600/15' : 'hover:bg-stone-900/5 dark:hover:bg-white/5')}>
            <span className="text-[11px] font-bold text-stone-500">{d}%</span>
            <span className={cn('w-full rounded-t-md transition-all', mine === i + 1 ? 'bg-gold-500' : 'bg-stone-300 group-hover:bg-gold-400 dark:bg-ink-700')}
              style={{ height: `${Math.max(8, d * 1.6)}px` }} />
            <span className="text-[10px] font-semibold text-stone-400">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Sticky mobile CTA ---------- */
export function StickyCTA({ perfume, bestDupePrice }: { perfume: Perfume; bestDupePrice: number | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const on = () => setVisible(window.scrollY > 560);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className={cn('fixed inset-x-0 bottom-16 z-50 px-4 transition-all duration-300 md:hidden', visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}>
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/95 p-3 shadow-lift backdrop-blur-xl dark:border-ink-700 dark:bg-ink-900/95">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{perfume.name}</p>
          <p className="text-xs text-stone-500">Dupe from <strong className="text-gold-700 dark:text-gold-300">{bestDupePrice ? inr(bestDupePrice) : '—'}</strong></p>
        </div>
        <Link href="#alternatives"><Button size="sm">Find dupe</Button></Link>
      </div>
    </div>
  );
}
