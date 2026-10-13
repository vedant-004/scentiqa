// Client-side controls for /wardrobe.
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeWardrobe, setWardrobeVisibility } from '@/lib/actions';
import { useToast } from '@/components/ui';

export function RemoveWardrobeButton({ perfumeId, shelf, label }: { perfumeId: string; shelf: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      aria-label={`Remove from ${label}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await removeWardrobe(perfumeId, shelf);
        setBusy(false);
        if (r.ok) router.refresh();
      }}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900/70 text-sm text-white backdrop-blur transition-opacity hover:bg-red-600 disabled:opacity-50"
    >
      ✕
    </button>
  );
}

export function VisibilityControl({ initial }: { initial: 'private' | 'public' }) {
  const { toast } = useToast();
  const router = useRouter();
  const [value, setValue] = useState<'private' | 'public'>(initial);
  const [busy, setBusy] = useState(false);

  const change = async (v: 'private' | 'public') => {
    if (v === value || busy) return;
    setBusy(true);
    const r = await setWardrobeVisibility(v);
    setBusy(false);
    if (r.ok) {
      setValue(v);
      toast(v === 'public' ? 'Your wardrobe is now public.' : 'Your wardrobe is now private.', 'ok');
      router.refresh();
    } else {
      toast(r.error ?? 'Could not update visibility', 'err');
    }
  };

  return (
    <div>
      <div role="group" aria-label="Wardrobe visibility" className="inline-flex rounded-full border border-stone-200 bg-white p-1 dark:border-ink-700 dark:bg-white/[0.04]">
        {(['private', 'public'] as const).map((v) => (
          <button
            key={v}
            onClick={() => change(v)}
            disabled={busy}
            aria-pressed={value === v}
            className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize transition ${
              value === v
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            } disabled:opacity-50`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-1.5 max-w-xs text-xs text-stone-400 dark:text-stone-500">
        Public wardrobes are visible on your member profile. Private wardrobes are visible only to you.
      </p>
    </div>
  );
}
