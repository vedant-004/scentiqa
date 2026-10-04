import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

/** Exchanges the OAuth code for a session after Google sign-in, persisting it in cookies. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const cookieStore = await cookies();

  if (code && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet: { name: string; value: string; options?: Partial<ResponseCookie> }[]) => {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      },
    );
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=oauth', url.origin));
}
