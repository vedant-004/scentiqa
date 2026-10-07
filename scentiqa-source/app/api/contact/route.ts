import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/contact — public contact form. Stores the message for the admin inbox.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many messages — please try again later.' }, { status: 429 });
  }

  let body: { name?: string; email?: string; topic?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().slice(0, 200);
  const topic = String(body.topic || 'General').trim().slice(0, 60) || 'General';
  const message = String(body.message || '').trim().slice(0, 5000);

  if (name.length < 2) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (message.length < 10) return NextResponse.json({ error: 'Please write a message of at least 10 characters.' }, { status: 400 });

  const admin = getSupabaseServer(true);
  if (!admin) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { error } = await admin.from('contact_messages').insert({ name, email, topic, message });
  if (error) return NextResponse.json({ error: 'Could not save your message — please try again.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
