import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Kill-switch state endpoint. Admin only.
 * Modes: live | maintenance | ghost
 * GET  -> { mode }
 * POST -> { mode } in body sets the switch; accepts legacy { enabled: boolean }.
 * Returns the stored mode (DB truth, not the request).
 */
const MODES = ['live', 'maintenance', 'ghost'] as const;
type Mode = (typeof MODES)[number];

function normalizeMode(v: unknown): Mode {
  const o = v as { mode?: unknown; enabled?: unknown } | null;
  if (o && o.mode === 'ghost') return 'ghost';
  if (o && (o.mode === 'maintenance' || o.enabled === true)) return 'maintenance';
  return 'live';
}

async function readMode(): Promise<Mode> {
  const c = getSupabaseServer(true);
  if (!c) return 'live';
  const { data } = await c.from('site_settings').select('value').eq('key', 'maintenance_mode').maybeSingle();
  return normalizeMode((data as { value?: unknown } | null)?.value);
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  return NextResponse.json({ mode: await readMode() });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  let mode: Mode;
  try {
    const body = await req.json();
    if (typeof body?.mode === 'string' && (MODES as readonly string[]).includes(body.mode)) {
      mode = body.mode;
    } else if (typeof body?.enabled === 'boolean') {
      mode = body.enabled ? 'maintenance' : 'live'; // legacy shape
    } else {
      return NextResponse.json({ error: 'Body must be { mode: "live" | "maintenance" | "ghost" }' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const c = getSupabaseServer(true);
  if (!c) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  const { error } = await c
    .from('site_settings')
    .upsert({ key: 'maintenance_mode', value: { mode } }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: 'Could not save site status' }, { status: 500 });

  return NextResponse.json({ mode: await readMode() });
}
