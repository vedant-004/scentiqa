// Client-side auth state: Supabase session via onAuthStateChange.
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthCtx { user: User | null; loading: boolean; signOut: () => Promise<void> }
const Ctx = createContext<AuthCtx>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) { setLoading(false); return; }
    sb.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    const sb = getSupabaseBrowser();
    try {
      if (sb) {
        // Never let a hanging/failed network call freeze the UI or leave a
        // half-signed-out state: cap the remote call at 8s, then move on.
        await Promise.race([
          sb.auth.signOut(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('signOut timeout')), 8000)),
        ]);
      }
    } catch {
      // Remote sign-out failed or timed out — cookies may already be cleared.
      // Either way, drop local auth state so the UI never lies about it.
    } finally {
      setUser(null);
    }
  };

  return <Ctx.Provider value={{ user, loading, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
