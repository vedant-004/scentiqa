// Climate Performance Lab — data helpers for heat/humidity wear-test stats
// and AI heat-score prediction from accord vectors.
import { getSupabaseServer } from '@/lib/supabase';

export interface ClimateStats {
  test_count: number;
  avg_hours: number | null;
  avg_projection: number | null;
  avg_sweat: number | null;
  avg_temp_c: number | null;
  heat_score: number | null; // 0-100 composite
  ai_predicted: boolean;
  ai_heat_score?: number;
}

/** Fetch aggregated climate stats for a perfume (from perfume_climate_stats). */
export async function getClimateStats(perfumeId: string): Promise<ClimateStats | null> {
  const c = getSupabaseServer();
  if (!c) return null;
  const { data } = await c.from('perfume_climate_stats').select('*').eq('perfume_id', perfumeId).single();
  if (!data || !data.test_count) return null;
  return {
    test_count: data.test_count,
    avg_hours: data.avg_hours,
    avg_projection: data.avg_projection,
    avg_sweat: data.avg_sweat,
    avg_temp_c: data.avg_temp_c,
    heat_score: data.heat_score,
    ai_predicted: false,
  };
}

/**
 * AI heat-performance prediction from accord vectors (0-100).
 * Heavy, resinous accords (oud, amber, leather, tobacco, smoky) survive heat;
 * light citrus/aquatic/fresh accords evaporate fast. Derived from accord
 * prominence — no invented data, clearly labeled as predicted.
 */
export function predictHeatScore(accords: Array<{ name: string; strength: number | null }>): number {
  if (!accords.length) return 50;
  // Accord heat-affinity weights (higher = better heat survival)
  const HEAT_AFFINITY: Record<string, number> = {
    oud: 95, amber: 90, leather: 88, tobacco: 88, smoky: 85, incense: 85,
    'warm spicy': 80, woody: 78, balsamic: 75, vanilla: 70, sweet: 65,
    powdery: 60, musky: 58, floral: 50, fruity: 48, rose: 55,
    aromatic: 52, 'fresh spicy': 45, green: 42, herbal: 42,
    citrus: 30, aquatic: 28, marine: 28, ozonic: 25, fresh: 30, aldehydic: 35,
  };
  let weighted = 0, total = 0;
  for (const a of accords) {
    const nl = a.name.toLowerCase();
    let w = 50; // neutral default
    for (const [key, val] of Object.entries(HEAT_AFFINITY)) {
      if (nl.includes(key)) { w = val; break; }
    }
    const s = a.strength || 50;
    weighted += w * s;
    total += s;
  }
  const raw = total > 0 ? weighted / total : 50;
  return Math.round(Math.min(98, Math.max(5, raw)));
}

/** Heat verdict label from a 0-100 score. */
export function heatVerdict(score: number): string {
  if (score >= 80) return 'Heat beast';
  if (score >= 65) return 'Summer-safe';
  if (score >= 45) return 'Moderate heat';
  if (score >= 30) return 'Struggles in heat';
  return 'Winter-only';
}

/** Recompute aggregated stats for a perfume after a new wear test. */
export async function recomputeClimateStats(perfumeId: string): Promise<void> {
  const c = getSupabaseServer(true);
  if (!c) return;
  const { data: tests } = await c.from('wear_tests').select('hours_lasted, projection, sweat_survival, temp_c').eq('perfume_id', perfumeId);
  if (!tests || !tests.length) return;
  const n = tests.length;
  const avg = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => x !== null && Number.isFinite(Number(x))).map(Number);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const avgHours = avg(tests.map((t) => t.hours_lasted));
  const avgProj = avg(tests.map((t) => t.projection));
  const avgSweat = avg(tests.map((t) => t.sweat_survival));
  const avgTemp = avg(tests.map((t) => t.temp_c));
  // Composite heat score 0-100: hours (40%) + projection (30%) + sweat (30%)
  const heatScore = avgHours !== null && avgProj !== null
    ? Math.round(Math.min(100, (avgHours / 12) * 40 + (avgProj / 5) * 30 + ((avgSweat ?? 3) / 5) * 30))
    : null;
  await c.from('perfume_climate_stats').upsert({
    perfume_id: perfumeId,
    test_count: n,
    avg_hours: avgHours !== null ? Math.round(avgHours * 100) / 100 : null,
    avg_projection: avgProj !== null ? Math.round(avgProj * 100) / 100 : null,
    avg_sweat: avgSweat !== null ? Math.round(avgSweat * 100) / 100 : null,
    avg_temp_c: avgTemp !== null ? Math.round(avgTemp * 10) / 10 : null,
    heat_score: heatScore,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'perfume_id' });
}
