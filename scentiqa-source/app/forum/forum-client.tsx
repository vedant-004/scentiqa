// Client-side forum interactions: reply composer + new-topic dialog.
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Dialog, DialogTitle, Input, Textarea, useToast } from '@/components/ui';
import { useAuth } from '@/components/auth';
import { createForumTopic, postForumReply } from '@/lib/actions';
import { cn } from '@/lib/utils';

/* ---------- Reply composer (topic page) ---------- */
export function ReplyComposer({ topicId, onPosted }: { topicId: string; onPosted: () => void }) {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const valid = wordCount >= 10;
  const showError = touched && !valid;

  if (loading) {
    return <Card className="mt-6 p-6 text-center"><p className="text-sm text-stone-500">Checking sign-in…</p></Card>;
  }
  if (!user) {
    return (
      <Card className="mt-6 p-6 text-center">
        <p className="text-sm text-stone-500">Join the conversation — <Link href={`/login?next=/forum`} className="font-semibold text-gold-700 hover:underline dark:text-gold-300">sign in</Link> to reply.</p>
      </Card>
    );
  }

  const submit = async () => {
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    const r = await postForumReply(topicId, body.trim());
    setBusy(false);
    if (r.demo) { toast('Demo mode — replies are disabled in the preview.', 'err'); return; }
    if (r.ok) {
      toast('Reply posted.');
      setBody('');
      setTouched(false);
      onPosted();
    } else {
      toast(r.error ?? 'Could not post reply', 'err');
    }
  };

  return (
    <Card className="mt-6 p-6">
      <label htmlFor="forum-reply" className="mb-2 block text-sm font-semibold">Your reply <span className="font-normal text-stone-400">(min 10 words)</span></label>
      <Textarea
        id="forum-reply"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Share your thoughts, experiences, or questions…"
        rows={4}
        maxLength={5000}
        aria-describedby="forum-reply-count"
        aria-invalid={showError}
      />
      <div className="mt-2 flex items-center justify-between">
        <p id="forum-reply-count" className={cn('text-xs', wordCount >= 10 ? 'text-emerald-600' : 'text-stone-400')}>
          {wordCount}/10 words min
        </p>
        {showError && <p className="text-xs text-red-600" role="alert">Write at least 10 words.</p>}
      </div>
      <Button onClick={submit} disabled={busy || (touched && !valid)} className="mt-3 w-full sm:w-auto">
        {busy ? 'Posting…' : 'Post reply'}
      </Button>
    </Card>
  );
}

/* ---------- Topic replies with composer ---------- */
export function TopicReplies({ topicId, initialPosts }: {
  topicId: string;
  initialPosts: Array<{ id: string; username: string; body: string }>;
}) {
  const router = useRouter();
  return (
    <>
      <div className="mt-6 space-y-4">
        {initialPosts.map((p, i) => (
          <Card key={p.id} className={i === 0 ? 'border-gold-600/40 p-6' : 'p-6'}>
            <div className="mb-3 flex items-center justify-between">
              <Link href={`/member/${p.username}`} className="font-bold text-gold-700 hover:underline dark:text-gold-300">@{p.username}</Link>
              {i === 0 && <span className="rounded-full bg-gold-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-gold-700 dark:text-gold-300">Original post</span>}
            </div>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{p.body}</p>
          </Card>
        ))}
      </div>
      <ReplyComposer topicId={topicId} onPosted={() => router.refresh()} />
    </>
  );
}
export function NewTopicButton({ categoryId, categorySlug }: { categoryId: string; categorySlug: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const titleValid = title.trim().length > 0 && title.length <= 120;
  const bodyValid = wordCount >= 10;
  const valid = titleValid && bodyValid;
  const showErrors = touched && !valid;

  const submit = async () => {
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    const r = await createForumTopic(categoryId, title.trim(), body.trim());
    setBusy(false);
    if (r.demo) { toast('Demo mode — new topics are disabled in the preview.', 'err'); return; }
    if (r.ok && r.topicId) {
      toast('Discussion started.');
      setOpen(false);
      router.push(`/forum/${categorySlug}/${r.topicId}`);
    } else {
      toast(r.error ?? 'Could not start discussion', 'err');
    }
  };

  if (loading) return null;
  if (!user) {
    return (
      <Link href={`/login?next=/forum/${categorySlug}`}>
        <Button variant="outline">Sign in to start a discussion</Button>
      </Link>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Start a discussion</Button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="new-topic-title">
        <DialogTitle id="new-topic-title">Start a discussion</DialogTitle>
        <div className="space-y-4">
          <div>
            <label htmlFor="new-topic-heading" className="mb-2 block text-sm font-semibold">Title</label>
            <Input
              id="new-topic-heading"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={120}
              aria-describedby="new-topic-title-count"
            />
            <p id="new-topic-title-count" className="mt-1 text-right text-xs text-stone-400">{title.length}/120</p>
            {showErrors && !titleValid && <p className="mt-1 text-xs text-red-600" role="alert">Give your discussion a title.</p>}
          </div>
          <div>
            <label htmlFor="new-topic-body" className="mb-2 block text-sm font-semibold">Details <span className="font-normal text-stone-400">(min 10 words)</span></label>
            <Textarea
              id="new-topic-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your question, experience, or recommendation…"
              rows={5}
              maxLength={5000}
              aria-describedby="new-topic-body-count"
              aria-invalid={showErrors && !bodyValid}
            />
            <p id="new-topic-body-count" className={cn('mt-1 text-right text-xs', wordCount >= 10 ? 'text-emerald-600' : 'text-stone-400')}>
              {wordCount}/10 words min
            </p>
            {showErrors && !bodyValid && <p className="mt-1 text-xs text-red-600" role="alert">Write at least 10 words.</p>}
          </div>
          <Button onClick={submit} disabled={busy || (touched && !valid)} className="w-full">
            {busy ? 'Starting…' : 'Start discussion'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
