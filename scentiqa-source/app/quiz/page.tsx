// AI Scent Quiz — "Find your signature scent in 5 questions"
// Uses ML accord vectors + note matching to recommend perfumes.
'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn, inr } from '@/lib/utils';
import { Button, Card, SectionHeading, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';
import { loadML, isMLReady, accordMatchScore, noteMatchScore, predictPerfume } from '@/lib/ml/engine';

interface P {
  id: string; slug: string; name: string; house: string; gender: string;
  lowestPriceInr: number | null; concentration?: string;
}

// Map quiz answers to accord targets
const VIBE_ACCORDS: Record<string, Record<string, number>> = {
  fresh: { Citrus: 80, Fresh: 85, Aquatic: 60, Green: 40 },
  cozy: { Ambery: 75, Sweet: 70, 'Warm Spicy': 60, Woody: 50 },
  bold: { Woody: 80, Leathery: 70, Tobacco: 65, Smoky: 60, Ambery: 55 },
  floral: { Floral: 85, Sweet: 40, Musky: 50, Citrus: 30 },
};

const NOTE_QUIZ_MAP: Record<string, string[]> = {
  citrus: ['Bergamot', 'Lemon', 'Mandarin Orange', 'Grapefruit'],
  woody: ['Sandalwood', 'Cedar', 'Vetiver', 'Oud'],
  sweet: ['Vanilla', 'Tonka Bean', 'Amber'],
  floral: ['Rose', 'Jasmine', 'Lavender'],
  spicy: ['Cardamom', 'Pink Pepper', 'Cinnamon'],
  aquatic: ['Sea Notes', 'Calone', 'Bergamot'],
};

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
    q: 'What\'s your budget?',
    options: [
      { v: '1000', label: 'Under ₹1,000', desc: 'Affordable gems' },
      { v: '2000', label: '₹1,000 – ₹2,000', desc: 'Mid-range quality' },
      { v: '5000', label: '₹2,000 – ₹5,000', desc: 'Premium picks' },
      { v: 'any', label: '💎 No limit', desc: 'Show me the best' },
    ],
  },
];

export default function QuizPage() {
  const [perfumes, setPerfumes] = useState<P[]>([]);
  const [mlReady, setMlReady] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetch('/api/perfumes').then((r) => r.json()).then((j) => setPerfumes(j.perfumes ?? [])).catch(() => {});
    loadML().then(() => setMlReady(true)).catch(() => {});
  }, []);

  const answer = (qid: string, v: string) => {
    setAnswers((a) => ({ ...a, [qid]: v }));
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  const results = useMemo(() => {
    if (!showResults || !mlReady || !isMLReady()) return [];

    const vibeAccords = VIBE_ACCORDS[answers.vibe] || {};
    const lovedNotes = NOTE_QUIZ_MAP[answers.notes] || [];
    const maxPrice = answers.budget === 'any' ? Infinity : Number(answers.budget);
    const wantStrong = answers.projection === 'strong';
    const wantIntimate = answers.projection === 'intimate';

    // Occasion adjustments
    const occasionBoost: Record<string, number> = {};
    if (answers.occasion === 'evening') { occasionBoost['Ambery'] = 20; occasionBoost['Woody'] = 15; }
    if (answers.occasion === 'office') { occasionBoost['Fresh'] = 15; occasionBoost['Citrus'] = 10; }
    if (answers.occasion === 'daily') { occasionBoost['Fresh'] = 10; occasionBoost['Citrus'] = 10; }

    const targetAccords = { ...vibeAccords };
    for (const [k, v] of Object.entries(occasionBoost)) {
      targetAccords[k] = Math.min(100, (targetAccords[k] || 50) + v);
    }

    return perfumes
      .filter((p) => (p.lowestPriceInr ?? Infinity) <= maxPrice)
      .map((p) => {
        const accord = accordMatchScore(targetAccords, p.id);
        const note = noteMatchScore(lovedNotes, [], p.id);
        const pred = predictPerfume(p.id, { concentration: p.concentration });

        // Projection preference scoring
        let projScore = 50;
        if (pred) {
          if (wantStrong) projScore = (pred.sillage.score / 5) * 100;
          else if (wantIntimate) projScore = (1 - pred.sillage.score / 5) * 100 + 30;
          else projScore = 100 - Math.abs(pred.sillage.score - 3) * 25;
        }

        // Combined: 50% accord, 30% notes, 20% projection
        const final = Math.round(accord.score * 0.5 + note.score * 0.3 + projScore * 0.2);
        return { p, score: final, accord, note, pred };
      })
      .filter((x) => x.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [showResults, mlReady, perfumes, answers]);

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <SectionHeading kicker="AI Scent Quiz" title="Your matches" />
        <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
          Based on your answers, our AI analyzed {perfumes.length.toLocaleString()} perfumes.
          Here are your top scent matches.
        </p>
        <Button variant="ghost" size="sm" onClick={reset} className="mb-6">← Retake quiz</Button>

        {results.length === 0 ? (
          <p className="text-stone-500">Loading AI recommendations...</p>
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
                      <Link href={`/perfume/${results[0].p.slug}`} className="hover:underline">
                        <h2 className="font-display text-3xl font-bold">{results[0].p.name}</h2>
                      </Link>
                      <p className="mt-1 text-stone-500">{results[0].p.house}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">
                          {results[0].score}% match
                        </span>
                        {results[0].p.lowestPriceInr && (
                          <span className="text-lg font-bold">{inr(results[0].p.lowestPriceInr)}</span>
                        )}
                      </div>
                      <p className="mt-3 max-w-lg text-sm text-stone-600 dark:text-stone-300">
                        {results[0].accord.explanation.length > 0 && (
                          <>Strong in {results[0].accord.explanation.join(', ')}. </>
                        )}
                        {results[0].pred && (
                          <>{results[0].pred.longevity.label} longevity · {results[0].pred.sillage.label} sillage.</>
                        )}
                      </p>
                      <Link href={`/perfume/${results[0].p.slug}`}>
                        <Button className="mt-4">View perfume →</Button>
                      </Link>
                    </div>
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-gold-600 text-4xl font-bold text-white">
                      {results[0].score}%
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <h3 className="mb-4 font-display text-xl font-semibold">More matches for you</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {results.slice(1).map(({ p, score }) => (
                <div key={p.slug} className="relative">
                  <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-stone-900/85 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur dark:bg-white/90 dark:text-stone-900">
                    {score}%
                  </span>
                  <PerfumeCard perfume={p as any} />
                </div>
              ))}
            </div>
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
        Answer 5 quick questions. Our AI — trained on 24,000+ perfumes — will find your perfect match.
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

      {perfumes.length === 0 && (
        <div className="mt-8"><Skeleton className="h-32" /></div>
      )}
    </div>
  );
}
