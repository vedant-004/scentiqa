// Client-side controls for the account dashboard.
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';
import { Button, Input, Textarea } from '@/components';
import { removeWardrobe, removePriceAlert, updateProfile, exportUserData, deleteAccount } from '@/lib/actions';

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

export function SettingsSection({ initialUsername, initialBio, initialLocation }: {
  initialUsername: string; initialBio: string; initialLocation: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    const r = await updateProfile(username, bio, location);
    setSaving(false);
    if (r.ok) {
      setMessage({ ok: true, text: 'Profile updated.' });
      router.refresh();
    } else {
      setMessage({ ok: false, text: r.error ?? 'Could not save.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="profile-username" className="mb-2 block text-sm font-semibold">Username</label>
        <Input
          id="profile-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_username"
          maxLength={20}
          aria-describedby="username-hint"
        />
        <p id="username-hint" className="mt-1 text-xs text-stone-400">
          3-20 characters, letters/numbers/underscore. This is your public profile URL: /member/{username || 'username'}
        </p>
      </div>
      <div>
        <label htmlFor="profile-bio" className="mb-2 block text-sm font-semibold">Bio</label>
        <Textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the community about your fragrance journey…"
          maxLength={500}
          rows={3}
          aria-describedby="bio-count"
        />
        <p id="bio-count" className="mt-1 text-right text-xs text-stone-400">{bio.length}/500</p>
      </div>
      <div>
        <label htmlFor="profile-location" className="mb-2 block text-sm font-semibold">Location <span className="font-normal text-stone-400">(optional)</span></label>
        <Input
          id="profile-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Mumbai, India"
          maxLength={100}
        />
      </div>
      {message && (
        <p className={message.ok ? 'text-sm text-emerald-600' : 'text-sm text-red-600'} role="alert">
          {message.text}
        </p>
      )}
      <Button onClick={saveProfile} disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </div>
  );
}

export function ExportDataButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doExport = async () => {
    setBusy(true);
    setError(null);
    const r = await exportUserData();
    setBusy(false);
    if (!r.ok || !r.data) {
      setError(r.error ?? 'Could not export data.');
      return;
    }
    const blob = new Blob([r.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scentiqa-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        Download a JSON file with your profile, reviews, wardrobe, votes, price alerts, and diary entries.
      </p>
      <Button variant="outline" onClick={doExport} disabled={busy}>
        {busy ? 'Preparing…' : '⬇ Export my data (JSON)'}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

export function DeleteAccountSection() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setBusy(true);
    setError(null);
    const r = await deleteAccount();
    setBusy(false);
    if (r.ok) {
      // Sign out and redirect home
      router.push('/');
      router.refresh();
    } else {
      setError(r.error ?? 'Could not delete account.');
    }
  };

  if (step === 0) {
    return (
      <div>
        <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
          Permanently delete your account and all associated data.
        </p>
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete my account
        </Button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
        <h4 className="font-bold text-red-700 dark:text-red-300">Are you sure?</h4>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          This will permanently delete:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-300">
          <li>Your profile (username, bio, location)</li>
          <li>All your reviews</li>
          <li>Your entire wardrobe</li>
          <li>All votes you've cast</li>
          <li>All price alerts</li>
          <li>All diary entries</li>
          <li>Forum posts and topics</li>
        </ul>
        <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">
          This cannot be undone.
        </p>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={() => setStep(0)}>Cancel</Button>
          <Button
            onClick={() => setStep(2)}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Yes, continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
      <h4 className="font-bold text-red-700 dark:text-red-300">Final confirmation</h4>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
        Type <code className="rounded bg-stone-200 px-1.5 py-0.5 font-mono text-sm dark:bg-stone-800">DELETE</code> to confirm:
      </p>
      <Input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="mt-3"
        aria-label="Type DELETE to confirm account deletion"
      />
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={() => { setStep(0); setConfirmText(''); }}>Cancel</Button>
        <Button
          onClick={doDelete}
          disabled={confirmText !== 'DELETE' || busy}
          className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? 'Deleting…' : 'Delete my account permanently'}
        </Button>
      </div>
    </div>
  );
}
