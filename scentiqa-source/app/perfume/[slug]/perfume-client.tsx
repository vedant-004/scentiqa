// Client-side interactive blocks for the perfume page.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn, inr } from '@/lib/utils';
import { Button, Chip, Dialog, DialogTitle, Input, Textarea, useToast } from '@/components/ui';
import { useAuth } from '@/components/auth';
import { StarInput } from '@/components';
import { castVote, createPriceAlert, postReview, reportPriceError, setWardrobe, suggestDupe } from '@/lib/actions';
import type { Perfume } from '@/lib/types';

function demoToast(toast: (t: string, tone?: 'ok' | 'err' | 'info') => void) {
  toast('Connect Supabase to enable accounts — this is demo mode', 'info');
}

/* ---------- Shown instead of vote controls when logged out ---------- */
function SignInToVote({ label }: { label: string }) {
  return (
    <Link href="/login"
      className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 transition-all hover:border-gold-600 hover:text-gold-700 dark:border-ink-700 dark:text-stone-300 dark:hover:border-gold-400 dark:hover:text-gold-300">
      🔒 Sign in to {label}
    </Link>
  );
}

/* ---------- Love / Like / Dislike ---------- */
export function SentimentVote({ perfumeId }: { perfumeId: string }) {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [val, setVal] = useState<'love' | 'like' | 'dislike' | null>(null);
  const [counts] = useState({ love: 1240, like: 860, dislike: 95 });
  const vote = async (v: 'love' | 'like' | 'dislike') => {
    setVal(v);
    const r = await castVote(perfumeId, 'love_like_dislike', v);
    if (r.demo) demoToast(toast); else if (r.ok) toast('Vote recorded');
  };
  const opts = [['love', '❤️ Love', counts.love], ['like', '👍 Like', counts.like], ['dislike', '👎 Dislike', counts.dislike]] as const;
  if (!loading && !user) return <SignInToVote label="vote" />;
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
  const { user, loading } = useAuth();
  const [shelf, setShelf] = useState<string | null>(null);
  const add = async (s: string) => {
    setShelf(s);
    const r = await setWardrobe(perfumeId, s);
    if (r.demo) { demoToast(toast); setShelf(null); } else if (r.ok) toast(`“${name}” added to “${s}” shelf`);
  };
  const shelves = [['have', 'Have it'], ['want', 'Want it'], ['had', 'Had it'], ['test', 'Want to test']] as const;
  if (!loading && !user) return <SignInToVote label="save to your wardrobe" />;
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
  const { user, loading } = useAuth();
  const [mine, setMine] = useState<number | null>(null);
  const [dist] = useState(() => [8, 14, 26, 32, 20]);
  const vote = async (v: number) => {
    setMine(v);
    const r = await castVote(perfumeId, voteType, String(v));
    if (r.demo) demoToast(toast); else if (r.ok) toast('Vote recorded');
  };
  if (!loading && !user) return <SignInToVote label={`rate ${label.toLowerCase()}`} />;
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

/* ---------- India Heat Performance (Climate Lab) ---------- */
interface ClimateData {
  test_count: number; avg_hours: number | null; avg_projection: number | null;
  avg_sweat: number | null; avg_temp_c: number | null; heat_score: number | null;
  ai_predicted: boolean; verdict: string | null;
}

export function ClimateSection({ slug, perfumeId, perfumeName }: { slug: string; perfumeId: string; perfumeName: string }) {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [data, setData] = useState<ClimateData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ temp_c: 35, humidity_pct: 70, hours_lasted: 6, projection: 3, sweat_survival: 3, city: '', notes: '' });

  useEffect(() => {
    fetch(`/api/perfumes/${slug}/climate`).then((r) => r.json()).then(setData).catch(() => {});
  }, [slug]);

  const submit = async () => {
    if (!user) { toast('Sign in to log a wear test', 'info'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/wear-tests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfume_id: perfumeId, ...form }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Failed');
      toast('Wear test logged — thanks for contributing data!', 'ok');
      setShowForm(false);
      const updated = await fetch(`/api/perfumes/${slug}/climate`).then((r) => r.json()).catch(() => null);
      if (updated) setData(updated);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to log test', 'err');
    } finally { setBusy(false); }
  };

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 font-display text-2xl font-bold text-white shadow-card">
          {data.heat_score ?? '—'}
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold">{data.verdict ?? 'No data yet'}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {data.ai_predicted
              ? '🤖 AI predicted from accord profile — log a test to verify'
              : `☀️ ${data.test_count} community test${data.test_count === 1 ? '' : 's'}`}
            {data.avg_temp_c !== null && !data.ai_predicted && ` · avg ${Math.round(data.avg_temp_c)}°C`}
          </p>
          {!data.ai_predicted && data.avg_hours !== null && (
            <p className="mt-1 text-xs text-stone-500">
              Lasts ~{data.avg_hours.toFixed(1)}h · projection {data.avg_projection?.toFixed(1)}/5
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/climate" className="text-xs font-bold text-gold-700 hover:underline dark:text-gold-300">
          Heat leaderboard →
        </Link>
        <span className="text-stone-300">·</span>
        {loading ? null : user ? (
          <button onClick={() => setShowForm((s) => !s)} className="text-xs font-bold text-gold-700 hover:underline dark:text-gold-300">
            {showForm ? 'Cancel' : '🌡️ Log a wear test'}
          </button>
        ) : (
          <Link href="/login" className="text-xs font-bold text-gold-700 hover:underline dark:text-gold-300">
            Sign in to log a test
          </Link>
        )}
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-2xl border border-stone-200/70 bg-stone-50/60 p-4 dark:border-ink-700 dark:bg-white/[0.02]">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold">Temp (°C): {form.temp_c}°
              <input type="range" min={20} max={48} value={form.temp_c}
                onChange={(e) => setForm({ ...form, temp_c: Number(e.target.value) })} className="mt-1 w-full" />
            </label>
            <label className="text-xs font-bold">Humidity: {form.humidity_pct}%
              <input type="range" min={10} max={100} value={form.humidity_pct}
                onChange={(e) => setForm({ ...form, humidity_pct: Number(e.target.value) })} className="mt-1 w-full" />
            </label>
            <label className="text-xs font-bold">Hours lasted: {form.hours_lasted}h
              <input type="range" min={0} max={16} step={0.5} value={form.hours_lasted}
                onChange={(e) => setForm({ ...form, hours_lasted: Number(e.target.value) })} className="mt-1 w-full" />
            </label>
            <label className="text-xs font-bold">Projection: {form.projection}/5
              <input type="range" min={1} max={5} value={form.projection}
                onChange={(e) => setForm({ ...form, projection: Number(e.target.value) })} className="mt-1 w-full" />
            </label>
            <label className="text-xs font-bold">Sweat survival: {form.sweat_survival}/5
              <input type="range" min={1} max={5} value={form.sweat_survival}
                onChange={(e) => setForm({ ...form, sweat_survival: Number(e.target.value) })} className="mt-1 w-full" />
            </label>
            <label className="text-xs font-bold">City
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Chennai" className="mt-1" />
            </label>
          </div>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any notes? (setting, sprays, occasion…)" rows={2} />
          <Button onClick={submit} disabled={busy} size="sm">
            {busy ? 'Logging…' : `Log test for ${perfumeName}`}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Blind-Buy Risk Score badge ---------- */
interface BlindBuyData {
  score: number; verdict: string;
  factors: Array<{ key: string; label: string; points: number; detail: string }>;
}

export function BlindBuyBadge({ slug }: { slug: string }) {
  const [data, setData] = useState<BlindBuyData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/perfumes/${slug}/blindbuy`).then((r) => r.json()).then((j) => {
      if (typeof j.score === 'number') setData(j);
    }).catch(() => {});
  }, [slug]);

  if (!data) return null;
  const tone = data.score >= 80 ? 'bg-emerald-600' : data.score >= 60 ? 'bg-lime-600' : data.score >= 40 ? 'bg-amber-600' : 'bg-red-600';

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)}
        className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-card transition hover:brightness-110', tone)}
        title="Blind-buy safety score — click for the breakdown">
        🎲 {data.score}/100 · {data.verdict}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl border border-stone-200 bg-white p-4 shadow-lift dark:border-ink-700 dark:bg-ink-900">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Why this score</p>
          <div className="mt-2 space-y-2.5">
            {data.factors.map((f) => (
              <div key={f.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">{f.label}</span>
                  <span className="font-bold text-gold-700 dark:text-gold-300">+{f.points}</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">{f.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-stone-100 pt-2 text-[11px] text-stone-400 dark:border-white/10">
            Computed from dupe graph, INR prices, ratings &amp; accord profile. Not financial advice — noses differ.
          </p>
        </div>
      )}
    </div>
  );
}
