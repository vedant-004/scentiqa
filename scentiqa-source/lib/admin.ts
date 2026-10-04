// Admin access control. Only emails in ADMIN_EMAILS (comma-separated env var)
// can reach /admin. All checks run server-side; server actions must call
// requireAdmin() before touching data.
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export function adminEmails(): string[] {
  // Accept both names: ADMIN_EMAILS (server-only, preferred) and the legacy
  // NEXT_PUBLIC_ADMIN_EMAILS. Either one unlocks /admin for those addresses.
  return `${process.env.ADMIN_EMAILS ?? ''},${process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ''}`
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminConfigured(): boolean {
  return adminEmails().length > 0;
}

export async function getAdminUser(): Promise<{ id: string; email: string } | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !isAdminConfigured()
  )
    return null;
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? '';
  if (!email || !adminEmails().includes(email)) return null;
  return { id: data.user!.id, email };
}

/** Use inside admin pages/layouts. Redirects non-admins away. */
export async function requireAdminPage() {
  const admin = await getAdminUser();
  if (!admin) {
    if (!isAdminConfigured()) redirect('/admin/setup');
    redirect('/login?next=/admin');
  }
  return admin;
}

/** Use at the top of every admin server action. Throws when not admin. */
export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error('Not authorized');
  return admin;
}
