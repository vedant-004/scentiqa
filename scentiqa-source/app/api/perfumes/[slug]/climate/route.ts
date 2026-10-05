import { NextResponse } from 'next/server';
import { getPerfume } from '@/lib/data';
import { getClimateStats, predictHeatScore, heatVerdict } from '@/lib/climate';

// GET /api/perfumes/[slug]/climate — heat performance stats + AI prediction fallback
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stats = await getClimateStats(p.id);
  if (stats) {
    return NextResponse.json({
      ...stats,
      verdict: stats.heat_score !== null ? heatVerdict(stats.heat_score) : null,
    });
  }
  // No community tests yet — AI prediction from accord vectors
  const aiScore = predictHeatScore(p.accords ?? []);
  return NextResponse.json({
    test_count: 0,
    avg_hours: null, avg_projection: null, avg_sweat: null, avg_temp_c: null,
    heat_score: aiScore,
    ai_predicted: true,
    ai_heat_score: aiScore,
    verdict: heatVerdict(aiScore),
  });
}
