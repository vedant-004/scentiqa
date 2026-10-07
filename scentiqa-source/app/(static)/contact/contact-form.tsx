// Contact form: saves the message to the Scentiqa inbox (/admin/contact) via /api/contact.
'use client';
import { useState } from 'react';
import { Button, Card, Input } from '@/components';

const TOPICS = ['Correction', 'Lab partnership', 'Seller verification', 'Press', 'Feedback', 'Other'];

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Correction');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'delivery failed');
      setStatus('sent');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <Card className="mt-6 p-8 text-center">
        <p className="text-4xl">✉️</p>
        <h2 className="mt-3 font-display text-xl font-semibold">Message sent</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Thanks, {name.split(' ')[0] || 'there'} — your message is on its way. We usually reply within 2 working days.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-6 sm:p-8">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cf-name" className="mb-1.5 block text-sm font-semibold">Your name</label>
            <Input id="cf-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" />
          </div>
          <div>
            <label htmlFor="cf-email" className="mb-1.5 block text-sm font-semibold">Your email</label>
            <Input id="cf-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label htmlFor="cf-topic" className="mb-1.5 block text-sm font-semibold">Topic</label>
          <select
            id="cf-topic" value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold-500 dark:border-ink-700 dark:bg-ink-900"
          >
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cf-message" className="mb-1.5 block text-sm font-semibold">Message</label>
          <textarea
            id="cf-message" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind…"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold-500 dark:border-ink-700 dark:bg-ink-900"
          />
        </div>
        {status === 'error' && (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {errorMsg || 'Could not send just now — please try again.'}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </Button>
      </form>
    </Card>
  );
}
