# scentiqa.in Domain Migration Checklist

**Status:** Domain NOT yet purchased. Everything below is ready to execute the day Vedant buys it.

## Code readiness (already done)
- [x] `lib/site-url.ts` — single source of truth for the public URL
- [x] `app/layout.tsx` — metadataBase reads from SITE_URL
- [x] `app/sitemap.ts` — sitemap URLs read from SITE_URL
- [x] `app/robots.ts` — robots + sitemap reference read from SITE_URL
- [x] JSON-LD components use relative URLs (no hardcoded domain)

## Steps on migration day

### 1. Buy the domain
- Registrar: any (Namecheap, Cloudflare, GoDaddy). Prefer Cloudflare for free DNS + proxy.
- Buy `scentiqa.in` (and optionally `www.scentiqa.in`).

### 2. Add domain to Vercel
- Vercel dashboard → scentiqa project → Settings → Domains → Add `scentiqa.in`
- Also add `www.scentiqa.in`, set `scentiqa.in` as primary (redirect www → apex).
- Vercel will show the DNS records to add.

### 3. Configure DNS
- If using Vercel nameservers: change nameservers at registrar to Vercel's.
- If keeping registrar DNS: add the A record (76.76.21.21) for apex + CNAME for www → cname.vercel-dns.com.
- Wait for propagation (usually minutes, up to 24h).

### 4. Set the env var (this flips all URLs)
- Vercel → Settings → Environment Variables → add:
  - `NEXT_PUBLIC_SITE_URL` = `https://scentiqa.in`
- Redeploy (or it picks up on next push). This single change flips:
  - Canonical URLs, Open Graph URLs, sitemap.xml, robots.txt

### 5. Supabase Auth redirect URLs
- Supabase dashboard → Authentication → URL Configuration:
  - Site URL: `https://scentiqa.in`
  - Redirect URLs: add `https://scentiqa.in/auth/callback`
  - Keep the vercel.app URLs during transition, remove after.

### 6. Google OAuth
- Google Cloud Console → Credentials → OAuth client:
  - Authorized JavaScript origins: add `https://scentiqa.in`
  - Authorized redirect URIs: add `https://scentiqa.in/auth/callback`
- Supabase → Authentication → Providers → Google: no change needed (uses same client).

### 7. Redirects (preserve SEO juice)
- In `next.config.ts`, add:
  ```ts
  async redirects() {
    return [{
      source: '/:path*',
      has: [{ type: 'host', value: 'scentiqa.vercel.app' }],
      destination: 'https://scentiqa.in/:path*',
      permanent: true,
    }];
  }
  ```
- This gives 301s from every old URL to the new domain.

### 8. Google Search Console
- Add `scentiqa.in` as a property (Domain property recommended).
- Submit `https://scentiqa.in/sitemap.xml`.
- Use "Change of address" tool: old property (vercel.app) → new (scentiqa.in).

### 9. Post-migration verification
- [ ] `https://scentiqa.in` loads, `www` redirects to apex
- [ ] `https://scentiqa.in/sitemap.xml` shows scentiqa.in URLs
- [ ] Google login works on the new domain
- [ ] Old `scentiqa.vercel.app/perfume/x` 301-redirects to `scentiqa.in/perfume/x`
- [ ] No mixed-content warnings
- [ ] After 2 weeks: remove vercel.app from Supabase redirect URLs

## Estimated effort on the day
~1 hour active work + DNS propagation wait. All code changes are already in place.
