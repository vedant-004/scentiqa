import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';

// PATCH /api/diary/entry/[id] — edit a wear log entry (notes, worn_on)
// DELETE /api/diary/entry/[id] — delete a wear log entry
// Both scoped to the signed-in user's own entries.

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = await params;
  let body: { notes?: string; worn_on?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const updates: { notes?: string | null; worn_on?: string } = {};
  if (body.notes !== undefined) updates.notes = body.notes.trim() || null;
  if (body.worn_on !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.worn_on)) {
      return NextResponse.json({ error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
    }
    updates.worn_on = body.worn_on;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await sb.from('wear_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = await params;
  const { error, count } = await sb.from('wear_logs')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!count) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
