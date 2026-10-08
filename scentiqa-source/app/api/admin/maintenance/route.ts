import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Kill-switch state endpoint. Admin only.
 * GET  -> { enabled: boolean }
 * POST -> { enabled } in body sets the switch; returns the new state.
 */
async function readState(): Promise<boolean> {
  const c = getSupabaseServer(true);
  if (!c) return false;
  const { data } = await c.from('site_settings').select('value').eq('key', 'maintenance_mode').maybeSingle();
  const v = (data as { value?: { enabled?: boolean } } | null)?.value;
  return v?.enabled === true;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  return NextResponse.json({ enabled: await readState() });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  let enabled: boolean;
  try {
    const body = await req.json();
    if (typeof body?.enabled !== 'boolean')
      return NextResponse.json({ error: 'Body must be { enabled: boolean }' }, { status: 400 });
    enabled = body.enabled;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const c = getSupabaseServer(true);
  if (!c) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  const { error } = await c
    .from('site_settings')
    .upsert({ key: 'maintenance_mode', value: { enabled } }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: 'Could not save site status' }, { status: 500 });

  // Read back what was actually stored — the UI shows the DB truth, not the request.
  return NextResponse.json({ enabled: await readState() });
}
