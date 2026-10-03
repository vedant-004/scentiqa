# Scentiqa

An India-focused perfume discovery platform: blind-panel dupe similarity testing, verified INR prices from legitimate Indian sellers, and climate-tested reviews for Indian heat and humidity.

**Live demo:** `https://scentiqa.in` (demo build — see “Demo vs live” below)

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

The site runs in **demo mode** by default: all pages, search, filters, finder, compare, forum, awards, and giveaways work against bundled sample data in `data/seed.json`. No database or credentials needed.

## Commands

```bash
npm run dev        # development server
npm run build      # production build (174 static + dynamic pages)
npm run start      # serve the production build
npm run lint       # ESLint (0 errors expected)
npx tsc --noEmit   # TypeScript strict check
node scripts/generate-seed.mjs            # regenerate data/seed.json + supabase/seed.sql
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | live mode only | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | live mode only | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Server-side privileged writes (never expose client-side) |
| `NEXT_PUBLIC_ADMIN_EMAILS` | optional | Comma-separated admin emails for the `/admin` moderation console |

When **both** `NEXT_PUBLIC_*` variables are set, the app switches to live mode automatically (`isSupabaseConfigured()` in `lib/supabase.ts`). Without them, everything reads from demo data and write actions (reviews, votes, wardrobe, alerts) show a “connect Supabase” notice instead of failing.

## Supabase setup (live mode)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run **`supabase/schema.sql`** first (tables, enums, `pg_trgm`, indexes, similarity function, rating/house/price triggers, `verified_prices` view, RLS policies, helpful-vote RPC).
3. Then run **`supabase/seed.sql`** (generated sample data — label it as sample until you load real records).
4. Enable **Email (magic link)** auth in Authentication → Providers for `/login`.
5. Add the two `NEXT_PUBLIC_*` env vars to your hosting provider and redeploy.

### Schema highlights

- `houses`, `perfumes`, `sellers`, `prices`, `dupe_relationships`, `climate_scores`, `reviews`, `notes`, `articles`, `forum_categories/topics/posts`, `awards`, `giveaways`.
- User writes: `community_votes`, `wardrobe_items`, `price_alerts`, `reports`.
- Triggers keep `rating_avg`/`rating_count`, `house.perfume_count`, `house.avg_similarity_score`, and `perfume.lowest_price_inr` in sync.
- `note_similarity(a_id, b_id)` — note-overlap similarity (0–100) for editorial discovery; blind-panel scores live in `dupe_relationships.similarity_score`.
- RLS: public read on catalog tables; authenticated users can insert reviews, votes, wardrobe items, alerts, reports, and forum content.

## Demo vs live

| Feature | Demo mode | Live (Supabase) mode |
|---|---|---|
| All pages, search, filters, finder, compare | ✅ sample data | ✅ real data |
| Lab similarity scores | ✅ shown, clearly labeled “sample” | ✅ real test records |
| Prices | ✅ illustrative INR samples | ✅ live verified prices |
| Reviews, votes, wardrobe, alerts | ⚠️ read-only + friendly notice | ✅ full write support |
| Login | ⚠️ explains demo mode | ✅ magic-link auth |
| Admin | informational shell | connect to extend |

## Project structure

```
app/                    # Next.js 16 App Router routes
  (static)/             # methodology, trust-charter, fake-guide, about, legal…
  api/                  # search, dupes, perfumes, finder, notes endpoints
  perfume/[slug]/       # product page: dupes, prices, climate, reviews
  house/[slug]/         # house profile
  find-alternative/     # dupe finder results
  compare/  finder/     # side-by-side compare, recommendation quiz
  search/notes|accords/ # discovery libraries
  forum/  news/  awards/  giveaways/  member/
components/             # ui.tsx (shadcn-style), domain.tsx, layout.tsx
lib/                    # types, data adapters (demo/supabase), utils, actions
data/seed.json          # generated demo dataset
supabase/schema.sql     # full Postgres schema
supabase/seed.sql       # generated SQL seed
scripts/generate-seed.mjs # deterministic seed generator
```

## Data & trust policy (important)

Demo-mode similarity scores, tester counts, climate figures, prices, reviews, forum posts, and giveaway winners are **illustrative samples** — they are labeled as such in the UI (“Lab match · sample”, “Demo data” pill, footer notice). Genuine Scentiqa lab findings are only published after a real blind panel; the data model keeps `similarity_score` nullable and separates:

- **Brand-claimed similarity** (`claimed_accuracy_text`) — the house’s own marketing, never presented as our finding.
- **Community suggestions** (`tested_by = 'community'`) — user votes, shown as pending lab testing.
- **Scentiqa lab results** (`tested_by = 'lab'` + score) — only genuine blind-panel records in live mode.

Do not remove sample labels or present synthetic data as genuine findings. See `/methodology` and `/trust-charter` on the site.

### Real catalog enrichment (2026-09-30)

`data/real-houses.json` holds researched records from 20 Indian perfume sites (286 product records across 16 importable sites; 4 sites failed — see per-site `status`/`notes`). `scripts/generate-seed.mjs` merges them into `seed.json` + `seed.sql`:

- Real products are flagged `real: true` and carry a **“Real catalog data · researched 30 Sep 2026”** badge in the UI; demo fixtures carry a **“Sample data”** badge.
- `inspiredBy` is imported **only** when the brand's own site states it (inferred name-matches were nulled during preprocessing — see the research notes in the JSON).
- Real dupe relationships are `tested_by = 'community'`, **unscored** — never shown as lab findings.
- Real products get **no** synthetic ratings, reviews, or climate scores.
- Prices carry `provenance`: `live` (observed on a live fetch) | `mixed` | `indexed` | `stale` (needs re-verification — flagged in the UI) | `demo` (synthetic).
- Unknown bottle sizes stay `NULL` (`prices.size_ml` is nullable) — never invented. Johrimal attars are sold by weight (grams), recorded in the size note.
- Re-run `node scripts/generate-seed.mjs` after editing `real-houses.json`, then `npx tsc --noEmit && npm run build`.

## Deployment (Vercel)

```bash
npm run build
```

- Framework preset: Next.js. No extra config needed.
- Add env vars in Project Settings → Environment Variables for live mode.
- Demo mode deploys with zero configuration.

## TO VERIFY before real launch

Every item below is currently sample/placeholder data (the 286 real catalog records researched 2026-09-30 are flagged `real: true` and badged in the UI — they still need price re-verification where provenance is mixed/indexed/stale):

- All 96 original demo perfume descriptions, note pyramids, launch years, and concentration labels.
- All house profiles, histories, founded years, and website URLs.
- All INR prices, MRP values, seller listings, and seller “verified” flags.
- All lab similarity scores, tester counts, test dates, and climate test conditions.
- All 16 reviews, 3 member profiles, and forum threads/posts.
- All 5 news articles, awards votes, and giveaway details/winners.
- Placeholder contact emails in `/contact` (e.g. `hello@scentiqa.in` — not a real inbox).
- `/terms` and `/privacy` are drafts, not legal advice — have counsel review.
- PWA icon: `app/icon.svg` is a placeholder; add a 512×512 PNG for install quality.

## Limitations

- No visual/screenshot QA has been run at 360/768/1440px in this build session — verify responsive behavior before launch.
- Prices are not live-scraped; live mode shows whatever is in your `prices` table.
- `/admin` is an explanatory shell, not a functional admin panel.
- Email sending (auth, notifications) depends on Supabase Auth configuration.
