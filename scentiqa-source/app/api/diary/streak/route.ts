import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';

// GET /api/diary/streak — consecutive-day wear streak for the signed-in user
export async function GET() {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { data, error } = await sb
    .from('wear_logs')
    .select('worn_on')
    .eq('user_id', user.id)
    .order('worn_on', { ascending: false })
    .limit(400);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const days = new Set((data ?? []).map((r) => r.worn_on as string));
  let streak = 0;
  const today = new Date();
  // Allow the streak to be "alive" if yesterday was logged but not today yet
  for (let offset = 0; offset < 400; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; continue; }
    // Day 0 (today) missing is fine — streak counts from yesterday
    if (offset === 0) continue;
    break;
  }
  return NextResponse.json({ streak, total_logs: days.size });
}
