# Scentiqa full-site audit: coverage map (2026-10-07, ~10:15 IST)

Vedant asked for a literally-every-feature audit with fixes. This file maps what the
morning audit batches already touched, and what has NOT shown up in any commit message yet.
Main agent: use this to make sure nothing is skipped before reporting back.

Audit batches so far (from git log in this repo):
- 7354a93 Fix search, diary, collection, compare, forum, member, heat lab
- c97140d Member spotlight: real leaderboard + working member pages
- d93d7bd Fix votes + reviews: real meter distributions, 10-char review minimum, surfaced vote errors
- 7187c04 Awards: static pre-render for instant category pages, layout-wide cache invalidation
- 80b8737 Awards: 20 categories, public pages, admin manager
- c31318d Fix /blindbuy 22s lag; /search/accords + /search/notes full-catalog downloads
- 280e3c5 Audit fixes: finder accords + speed, magic-link auth, account scent profile, quiz, house fan-out
- c56f63d Audit fixes batch 3: hidden-gems, battles, sellers, giveaways, articles
- 2b65097 Finder scoring speedup (precomputed accord index map)
- 07560ec Seed October Discovery Set giveaway row

## Covered (per commit messages above)
- /search (all search bars + /api/search), /search/accords, /search/notes
- /diary, /collection, /compare, /forum (+ index, category, topic), /climate (heat lab)
- /member/[username], /members, /account (scent profile), /login (magic link redirect to /auth/callback)
- /quiz (server-side /api/quiz/recommend), /finder (+ /api/finder/recommend speed), /house/[slug]
- /hidden-gems, /battles (vote race-safety + status checks), /sellers, /giveaways (live entries)
- /news/[slug], /news admin (articles), DupeCard label bug, /auth/callback route exists
- Awards: /awards/2026, /awards/[year], /awards/[year]/[category] (categories fixed, instant loads; note: no /awards index page exists)

## NOT in any audit commit message yet (verify whether audited; check manually)
/                       homepage (Perfume of the Day, hero search, layout)
/perfume/[slug]         perfume detail page (notes list rendering, accord display, price section)
/accords, /accords/[slug]   accord encyclopedia pages
/notes, /notes/[slug]       note encyclopedia pages (401 in sitemap)
/houses                 houses index page (distinct from /house/[slug])
/house                  house index/landing (check what this route renders)
/news                   news index page (article page done, index not mentioned)
/menu                   mobile menu page (links /awards/2026 directly, fine)
/find-alternative       dupe finder page
/admin/*                private admin (dashboard, perfumes, houses, sellers, prices, dupes, reviews, reports, users, battles, health, export, settings)

## Known open issues from history (re-check during this audit)
1. Mobile header: hamburger was rebuilt as full-screen overlay but rendered at the very bottom of
   the page on his phone (2026-10-05). Header search bar was removed to fix layout; hero search is
   the only mobile search. Verify the overlay is actually fixed on a real phone-size viewport.
2. /api/perfumes returns accords:[] by design; catalog-wide empty-field audit still pending.
3. Debug route status: was to recheck after the Finder /api/houses fix (2026-10-06).
4. Perfume pages: "No prices listed yet" despite price rows (getPerfume column mismatch with live
   verified_prices shape). Older known issue; verify fixed.
5. Finder ML vector rebuild for wave-3 rows: pending (commit 3329f37 counts are DB-live, but the
   ML accord vectors may still exclude the new rows).
6. Wave-3 scent story coverage: not yet checked (stories were 6,639/6,639 before wave-3).
7. 241 deleted perf_designer_ rows still unaudited (backup at data/audit/fictional-rows-backup.json).
8. Seller "verified" flags: 31 new sellers marked verified heuristically; conservative audit pending.
9. Perfume of the Day: uses real data with daily revalidate; sanity-check it does not repeat or 404.
10. Magic-link auth: emailRedirectTo now points at /auth/callback; end-to-end login not yet verified live.

## Auth-gated routes to spot-check while signed in
/account (voting history, wardrobe, scent profile), /admin (dashboard loads without errors),
/giveaways (enter flow one-entry-per-user), battle voting, review posting (10-char minimum),
diary logging (perfume_id now sent correctly), vote buttons on perfume pages.

## Live-verification discipline
Nothing counts as done until checked on the production build (scentiqa.vercel.app).
Keep counts honest; do not claim fixed before deploy finishes.
