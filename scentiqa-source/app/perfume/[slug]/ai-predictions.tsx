// AI Predictions panel for perfume pages — longevity, sillage, note evolution,
// and overall AI score. Trained on 24k Fragrantica perfumes.
'use client';
import { useEffect, useState } from 'react';
import { Card, SectionHeading, Skeleton } from '@/components';
import { loadML, predictPerfume, type AIPrediction } from '@/lib/ml/engine';

function Meter({ label, score, max = 5 }: { label: string; score: number; max?: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold text-gold-700 dark:text-gold-300">{score.toFixed(1)} / {max}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-ink-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-rose-500 transition-all duration-700"
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function AIPredictions({ perfumeId, concentration }: { perfumeId: string; concentration?: string }) {
  const [pred, setPred] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadML()
      .then(() => {
        setPred(predictPerfume(perfumeId, { concentration }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [perfumeId, concentration]);

  if (loading) {
    return (
      <section>
        <SectionHeading kicker="Artificial Intelligence" title="AI Predictions" />
        <Skeleton className="h-64" />
      </section>
    );
  }

  if (!pred) return null;

  return (
    <section>
      <SectionHeading
        kicker="Artificial Intelligence"
        title="AI Predictions"
        action={
          <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-bold text-violet-600 dark:text-violet-300">
            {pred.confidence} confidence
          </span>
        }
      />
      <Card className="p-6 sm:p-8">
        {/* Overall AI Score */}
        <div className="mb-6 flex items-center gap-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-gold-500/10 p-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-gold-600 text-2xl font-bold text-white">
            {pred.overallScore}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Scentiqa AI Score</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Composite rating from longevity, projection, and composition richness — learned from 24,000+ fragrances.
            </p>
          </div>
        </div>

        {/* Longevity & Sillage */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <Meter label="⏱️ Longevity" score={pred.longevity.score} />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{pred.longevity.label}</p>
            <p className="text-xs text-stone-500">Predicted wear time from base-note tenacity and concentration.</p>
          </div>
          <div className="space-y-4">
            <Meter label="📢 Sillage (projection)" score={pred.sillage.score} />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{pred.sillage.label}</p>
            <p className="text-xs text-stone-500">Predicted scent trail from top-note volatility patterns.</p>
          </div>
        </div>

        {/* Note evolution */}
        <div className="mt-6 border-t border-stone-200/70 pt-6 dark:border-ink-700/50">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-stone-400">Predicted scent evolution</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-stone-100/70 p-4 dark:bg-white/[0.04]">
              <p className="mb-2 text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Opening <span className="normal-case font-normal">(0–15 min)</span></p>
              <p className="text-sm leading-relaxed">{pred.opening.length > 0 ? pred.opening.join(' · ') : '—'}</p>
            </div>
            <div className="rounded-xl bg-stone-100/70 p-4 dark:bg-white/[0.04]">
              <p className="mb-2 text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Heart <span className="normal-case font-normal">(15 min – 3 hrs)</span></p>
              <p className="text-sm leading-relaxed">{pred.heart.length > 0 ? pred.heart.join(' · ') : '—'}</p>
            </div>
            <div className="rounded-xl bg-stone-100/70 p-4 dark:bg-white/[0.04]">
              <p className="mb-2 text-xs font-bold uppercase text-rose-600 dark:text-rose-400">Dry-down <span className="normal-case font-normal">(3 hrs+)</span></p>
              <p className="text-sm leading-relaxed">{pred.base.length > 0 ? pred.base.join(' · ') : '—'}</p>
            </div>
          </div>
        </div>

        <p className="mt-5 border-t border-stone-200/70 pt-4 text-xs leading-relaxed text-stone-400 dark:border-ink-700/50">
          🤖 {pred.source}. Longevity and sillage are AI estimates from note chemistry patterns across 24,063 fragrances —
          not lab measurements. Individual skin chemistry varies.
        </p>
      </Card>
    </section>
  );
}
