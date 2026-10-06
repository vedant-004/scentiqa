# Scentiqa Future-Proofing: Security, Traffic, Speed & SEO

**Date:** 2026-10-06 | **Status:** Phase 1 implemented, rest planned

---

## 1. SECURITY

### Implemented (2026-10-06)
- **Security headers** in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, X-XSS-Protection.
- **Rate limiting** on `/api/finder/recommend` (20 req/min per IP) via `lib/rate-limit.ts`. This endpoint scores all 8,598 perfumes per request and was completely unprotected.
- **Debug stack traces removed** from finder error responses (was leaking internals).
- **Admin panel** already gated behind ADMIN_EMAILS check (verified live: unauthenticated → 307 to /login).

### Still to do
- [ ] **Supabase RLS audit**: verify Row Level Security is enabled on all tables. The anon key is public by design; RLS is the real gate. Check: `perfumes`, `houses`, `prices`, `reviews`, `wear_logs`, `battle_votes` — writes should require auth, reads can be public.
- [ ] **Rotate exposed credentials** (Supabase service_role, GitHub PAT, Vercel token from 2026-10-04) — still pending on Vedant.
- [ ] **Rate limit other write endpoints**: `/api/diary`, `/api/battles/vote`, `/api/wear-tests`, review submission. Same `rateLimit()` helper works.
- [ ] **CSP header**: currently not set because inline scripts (theme script) would break. When ready, add `Content-Security-Policy` with nonces.
- [ ] **Vercel Firewall**: on Pro plan, enable managed rulesets (OWASP, bot filtering).

---

## 2. HANDLING LARGE TRAFFIC

### Architecture (already good)
- **Frontend**: Vercel auto-scales to zero config. No action needed.
- **Database**: Supabase handles connection pooling via PgBouncer (transaction mode). Verify pooler is enabled in Supabase dashboard → Database → Pooling.

### Bottlenecks identified
1. **`/api/finder/recommend`** — scores 8,598 perfumes per request, ~10s on cold start. This is the #1 scaling risk.
   - Mitigations in place: rate limiting (20/min/IP).
   - Future: cache results by answer-hash (most users pick similar notes), or precompute archetype-based shortlists.
2. **`/api/perfumes`** — returns all 8,598 perfumes. Only used by legacy code now; the finder uses `/api/houses` instead. Consider deprecating or paginating.
3. **Sitemap generation** — fetches all slugs on every crawler hit. Add `revalidate` caching (currently uncached).

### When traffic spikes
- Vercel: automatic. Watch Function Duration in dashboard.
- Supabase: watch "Database connections" and "API requests" in dashboard. If connections saturate, enable the Supabase read replica (paid) or add Redis caching for hot paths.
- Quick lever: increase ISR `revalidate` times to reduce origin hits.

---

## 3. SPEED

### Implemented (2026-10-06)
- **`/api/houses`** (new): 199 houses in ~1s, ~5KB. Replaces the finder downloading all 8,598 perfumes (~2MB+) just to build the house picker. This was the "Favorite houses?" step being slow.
- **Perfume pages**: `revalidate = 3600` (hourly ISR) — fresh data without rebuilds, cached at the edge.
- **Static assets**: `Cache-Control: immutable` on `/images/*`.
- **Sitemap/robots**: cached 1 hour at the edge.

### Still to do
- [ ] **Image optimization**: verify `next/image` is used for product photos (not raw `<img>`). 584+ product photos + 2,000 new ones — unoptimized images are the biggest mobile speed killer.
- [ ] **Bundle audit**: run `next/bundle-analyzer`, check for heavy deps in the finder page.
- [ ] **Font loading**: already using `display: swap` — good.
- [ ] **`/api/notes`**: check payload size (400 notes should be small, but verify).
- [ ] **Lighthouse CI**: add to CI pipeline to catch regressions.

---

## 4. SEO

### Implemented (2026-10-06)
- **Canonical URL fix**: `metadataBase`, sitemap, and robots now read from `SITE_URL` (`lib/site-url.ts`), which defaults to `https://scentiqa.vercel.app` and flips to `https://scentiqa.in` via the `NEXT_PUBLIC_SITE_URL` env var on migration day. Previously all canonicals pointed to a non-existent domain — actively harmful.
- **Dynamic sitemap**: all 8,598 perfumes + 199 houses + notes + articles. Cached 1h at edge.
- **robots.txt**: allows all, disallows `/admin` and `/api/`.

### Already existed (verified)
- JSON-LD structured data on perfume pages (`JsonLd` component).
- Semantic HTML, meta descriptions, Open Graph tags.
- Descriptive URLs (`/perfume/skinn-raw`, `/house/skinn`, `/notes/bergamot`).

### Still to do
- [ ] **Google Search Console**: add property, submit sitemap. Do this NOW on vercel.app, then use Change of Address on migration.
- [ ] **Sitemap index**: split into multiple sitemaps if generation gets slow (currently one file, ~9k URLs — fine, but watch it).
- [ ] **`lastmod` dates**: add `lastModified` to sitemap entries from `updated_at` so Google prioritizes fresh pages.
- [ ] **Breadcrumb JSON-LD**: add to perfume pages (Home → House → Perfume).
- [ ] **FAQ/Review schema**: add `aggregateRating` JSON-LD once reviews grow.
- [ ] **Internal linking**: house pages → perfumes, notes pages → perfumes (already exist, verify depth).
- [ ] **Core Web Vitals**: monitor in Search Console after migration.

---

## 5. DOMAIN MIGRATION → scentiqa.in

Full checklist: `docs/domain-migration-scentiqa-in.md`

**TL;DR:** Buy domain → add to Vercel → set DNS → set `NEXT_PUBLIC_SITE_URL=https://scentiqa.in` → update Supabase redirect URLs → update Google OAuth → add 301 redirects → Search Console change of address. All code is ready; ~1 hour active work on the day.

---

## Priority order when Vedant says go
1. Google Search Console setup (do now, takes 5 min)
2. Supabase RLS audit (security — do before any traffic spike)
3. Credential rotation (overdue since 2026-10-04)
4. Image optimization audit (biggest speed win)
5. Domain migration (when he buys scentiqa.in)
