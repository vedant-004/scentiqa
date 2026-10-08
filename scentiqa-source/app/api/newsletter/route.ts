import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_SOURCES = new Set(['footer', 'homepage', 'site']);

// POST /api/newsletter — public email signup. Single opt-in; stores the
// address for the admin. No emails are sent yet.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`newsletter:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many signups — please try again later.' }, { status: 429 });
  }

  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const source = String(body.source || 'site').trim().slice(0, 40);
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const admin = getSupabaseServer(true);
  if (!admin) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { error } = await admin
    .from('newsletter_subscribers')
    .insert({ email, source: ALLOWED_SOURCES.has(source) ? source : 'site' });

  if (error) {
    // 23505 = unique violation: already subscribed. Treat as success so we
    // don't leak which addresses are on the list.
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, already: true });
    }
    return NextResponse.json({ error: 'Could not save — please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
