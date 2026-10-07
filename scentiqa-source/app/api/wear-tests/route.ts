import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';
import { recomputeClimateStats } from '@/lib/climate';

// POST /api/wear-tests — log a climate wear test for a perfume
export async function POST(req: Request) {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const perfume_id = String(b.perfume_id ?? '').trim();
  const temp_c = Number(b.temp_c);
  const hours_lasted = Number(b.hours_lasted);
  const projection = Number(b.projection);
  if (!perfume_id) return NextResponse.json({ error: 'perfume_id required' }, { status: 400 });
  if (!Number.isFinite(temp_c) || temp_c < 10 || temp_c > 50) return NextResponse.json({ error: 'temp_c must be 10-50' }, { status: 400 });
  if (!Number.isFinite(hours_lasted) || hours_lasted < 0 || hours_lasted > 24) return NextResponse.json({ error: 'hours_lasted must be 0-24' }, { status: 400 });
  if (!Number.isFinite(projection) || projection < 1 || projection > 5) return NextResponse.json({ error: 'projection must be 1-5' }, { status: 400 });

  const humidity_pct = b.humidity_pct !== undefined && b.humidity_pct !== null ? Number(b.humidity_pct) : null;
  const sweat_survival = b.sweat_survival !== undefined && b.sweat_survival !== null ? Number(b.sweat_survival) : null;

  const { data: perf } = await sb.from('perfumes').select('id').eq('id', perfume_id).limit(1).single();
  if (!perf) return NextResponse.json({ error: 'Perfume not found' }, { status: 404 });

  const { error } = await sb.from('wear_tests').insert({
    user_id: user.id,
    perfume_id,
    temp_c,
    humidity_pct: humidity_pct !== null && Number.isFinite(humidity_pct) ? Math.round(humidity_pct) : null,
    hours_lasted,
    projection: Math.round(projection),
    sweat_survival: sweat_survival !== null && Number.isFinite(sweat_survival) ? Math.round(sweat_survival) : null,
    city: typeof b.city === 'string' ? b.city.trim().slice(0, 60) || null : null,
    notes: typeof b.notes === 'string' ? b.notes.trim().slice(0, 500) || null : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Recompute aggregates before responding so the client's refetch sees fresh stats.
  try { await recomputeClimateStats(perfume_id); } catch { /* non-fatal */ }
  return NextResponse.json({ ok: true });
}
