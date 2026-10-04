// Client-side controls for the account dashboard.
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';
import { Button } from '@/components';
import { removeWardrobe, removePriceAlert } from '@/lib/actions';

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOut();
        } finally {
          router.push('/');
          router.refresh();
        }
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}

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

export function RemoveAlertButton({ alertId }: { alertId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      aria-label="Remove price alert"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await removePriceAlert(alertId);
        setBusy(false);
        if (r.ok) router.refresh();
      }}
      className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-stone-400 transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
    >
      Remove
    </button>
  );
}
