// AI Scent Quiz — "Find your signature scent in 5 questions"
// Scored server-side against live accord + note data (full catalog).
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { cn, inr } from '@/lib/utils';
import { Button, Card, SectionHeading, Skeleton } from '@/components';
import { PerfumeCard, ReviewPrompt } from '@/components/domain';

interface Hit {
  id: string; slug: string; name: string; house: string; match: number; reason: string;
  ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null;
}

const QUESTIONS = [
  {
    id: 'occasion',
    q: 'When will you wear it most?',
    options: [
      { v: 'daily', label: '☀️ Daily wear', desc: 'Easy, versatile, all-day' },
      { v: 'evening', label: '🌙 Evenings & nights', desc: 'Deeper, more seductive' },
      { v: 'office', label: '💼 Office & formal', desc: 'Polished, not overpowering' },
      { v: 'special', label: '✨ Special occasions', desc: 'Memorable, statement-making' },
    ],
  },
  {
    id: 'vibe',
    q: 'What vibe are you going for?',
    options: [
      { v: 'fresh', label: '🍋 Fresh & Clean', desc: 'Citrus, aquatic, uplifting' },
      { v: 'cozy', label: '🔥 Warm & Cozy', desc: 'Amber, vanilla, comforting' },
      { v: 'bold', label: '💪 Bold & Seductive', desc: 'Woody, leathery, intense' },
      { v: 'floral', label: '🌸 Soft & Floral', desc: 'Romantic, elegant blooms' },
    ],
  },
  {
    id: 'projection',
    q: 'How strong should it project?',
    options: [
      { v: 'intimate', label: '🤫 Intimate', desc: 'Only those close smell it' },
      { v: 'moderate', label: '👍 Moderate', desc: 'Noticeable but polite' },
      { v: 'strong', label: '📢 Strong', desc: 'Turn heads in a room' },
    ],
  },
  {
    id: 'notes',
    q: 'Which notes do you love most?',
    options: [
      { v: 'citrus', label: '🍊 Citrus', desc: 'Bergamot, lemon, neroli' },
      { v: 'woody', label: '🪵 Woody', desc: 'Sandalwood, cedar, oud' },
      { v: 'sweet', label: '🍯 Sweet & Gourmand', desc: 'Vanilla, tonka, amber' },
      { v: 'floral', label: '🌹 Floral', desc: 'Rose, jasmine, lavender' },
      { v: 'spicy', label: '🌶️ Spicy', desc: 'Cardamom, pepper, cinnamon' },
      { v: 'aquatic', label: '🌊 Aquatic', desc: 'Sea notes, fresh, ozonic' },
    ],
  },
  {
    id: 'budget',
    q: "What's your budget?",
    options: [
      { v: '1000', label: 'Under ₹1,000', desc: 'Affordable gems' },
      { v: '2000', label: '₹1,000 – ₹2,000', desc: 'Mid-range quality' },
      { v: '5000', label: '₹2,000 – ₹5,000', desc: 'Premium picks' },
      { v: 'any', label: '💎 No limit', desc: 'Show me the best' },
    ],
  },
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const answer = async (qid: string, v: string) => {
    const next = { ...answers, [qid]: v };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
      setLoading(true);
      setError('');
      try {
        const r = await fetch('/api/quiz/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? 'Failed');
        setResults(j.results ?? []);
      } catch {
        setError('Could not generate recommendations. Check your connection and try again.');
      }
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
    setResults([]);
    setError('');
  };

  const toCard = (h: Hit) => ({
    slug: h.slug, name: h.name, house: h.house,
    ratingAvg: h.ratingAvg, lowestPriceInr: h.lowestPriceInr,
    isDupe: h.isDupe, bottleImage: h.bottleImage,
  });

  if (showResults) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <SectionHeading kicker="AI Scent Quiz" title="Your matches" />
        <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
          Based on your answers, we analyzed the full catalog against your scent profile.
          Here are your top matches.
        </p>
        <Button variant="ghost" size="sm" onClick={reset} className="mb-6">← Retake quiz</Button>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64" />)}</div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-stone-500">{error}</p>
            <Button size="sm" className="mt-4" onClick={reset}>Retake quiz</Button>
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-stone-500">No matches for these answers — try a wider budget or a different vibe.</p>
            <Button size="sm" className="mt-4" onClick={reset}>Retake quiz</Button>
          </Card>
        ) : (
          <>
            {/* Top pick spotlight */}
            {results[0] && (
              <Card className="mb-8 overflow-hidden">
                <div className="bg-gradient-to-br from-violet-600/10 to-gold-500/10 p-6 sm:p-8">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                    🏆 Your signature scent
                  </p>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <Link href={`/perfume/${results[0].slug}`} className="hover:underline">
                        <h2 className="font-display text-3xl font-bold">{results[0].name}</h2>
                      </Link>
                      <p className="mt-1 text-stone-500">{results[0].house}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">
                          {results[0].match}% match
                        </span>
                        {results[0].lowestPriceInr && (
                          <span className="text-lg font-bold">{inr(results[0].lowestPriceInr)}</span>
                        )}
                      </div>
                      <p className="mt-3 max-w-lg text-sm text-stone-600 dark:text-stone-300">
                        {results[0].reason}
                      </p>
                      <Link href={`/perfume/${results[0].slug}`}>
                        <Button className="mt-4">View perfume →</Button>
                      </Link>
                    </div>
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-gold-600 text-4xl font-bold text-white">
                      {results[0].match}%
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <h3 className="mb-4 font-display text-xl font-semibold">More matches for you</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {results.slice(1).map((h) => (
                <div key={h.slug} className="relative">
                  <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-stone-900/85 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur dark:bg-white/90 dark:text-stone-900">
                    {h.match}%
                  </span>
                  <PerfumeCard perfume={toCard(h)} />
                </div>
              ))}
            </div>

            {results[0] && (
              <ReviewPrompt context="quiz" perfumeName={results[0].name} perfumeSlug={results[0].slug} />
            )}
          </>
        )}
      </div>
    );
  }

  const q = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="AI Scent Quiz" title="Find your signature scent" />
      <p className="mb-8 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Answer 5 quick questions. We&rsquo;ll match you against every perfume in the catalog.
      </p>

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">Question {step + 1} of {QUESTIONS.length}</span>
          <span className="text-stone-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-ink-700">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-gold-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">{q.q}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((opt) => (
          <button
            key={opt.v}
            onClick={() => answer(q.id, opt.v)}
            className={cn(
              'rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-95',
              'border-stone-200 bg-white hover:border-violet-400 hover:shadow-lg',
              'dark:border-ink-700 dark:bg-ink-900 dark:hover:border-violet-500'
            )}
          >
            <p className="text-lg font-bold">{opt.label}</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{opt.desc}</p>
          </button>
        ))}
      </div>

      {step > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="mt-6">
          ← Back
        </Button>
      )}
    </div>
  );
}
