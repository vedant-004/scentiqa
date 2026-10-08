-- Scentiqa Awards 2026 nominees: market-researched, catalog-verified.
-- Every nominee below was verified to exist in the perfumes/houses tables.
-- Idempotent: safe to re-run (NOT EXISTS guards on each row).
-- Run in the Supabase SQL editor.

-- ============ PERFUME NOMINEES ============

-- Helper pattern:
-- INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
-- SELECT 2026, '<Category Name>', '<slug>', 'perfume', '<perfume_id>', 0, false
-- WHERE NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = '<slug>' AND nominee_perfume_id = '<perfume_id>');

-- ---- Ultimate Winner 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Ultimate Winner 2026', 'ultimate-winner-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_khamrahqahwa', 'perf_asad', 'perf_sauvage-elixir', 'perf_w_club-de-nuit-intense-man-armaf', 'perf_aventus', 'perf_supremacynotonlyintense')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'ultimate-winner-2026' AND nominee_perfume_id = p.id);

-- ---- Desi Scent of the Year 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Desi Scent of the Year 2026', 'desi-scent-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_zighrana-mitti-attar', 'perf_tatha-gulab-attar', 'perf_bombayoud', 'perf_attar-shamama-1460')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'desi-scent-2026' AND nominee_perfume_id = p.id);

-- ---- Best Attar 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Attar 2026', 'best-attar-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_tatha-gulab-attar', 'perf_zighrana-mitti-attar', 'perf_attar-shamama-1460', 'perf_attar-rajnigandha-1460', 'perf_rasasi-attar-mubakhar')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-attar-2026' AND nominee_perfume_id = p.id);

-- ---- Monsoon Beast 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Monsoon Beast 2026', 'monsoon-beast-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_hawasice', 'perf_lalique-encre-noire-a-lextreme', 'perf_y-eau-de-parfum', 'perf_rarereef', 'perf_em5-imagination')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'monsoon-beast-2026' AND nominee_perfume_id = p.id);

-- ---- Best Value Under ₹1,000 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Value Under ₹1,000 2026', 'budget-king-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_ajmal-oud-of-dubai', 'perf_applejuice', 'perf_em5-ocean-breeze', 'perf_em5-aqua', 'perf_dupify-sauvage')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'budget-king-2026' AND nominee_perfume_id = p.id);

-- ---- Shadi Season Star 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Shadi Season Star 2026', 'shadi-season-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_asad', 'perf_hawasfire', 'perf_club-de-nuit-precieux', 'perf_wisaldhahab')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'shadi-season-2026' AND nominee_perfume_id = p.id);

-- ---- Best Aventus Clone 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Aventus Clone 2026', 'best-aventus-clone-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_w_club-de-nuit-intense-man-armaf', 'perf_supremacynotonlyintense', 'perf_explorermontblanc', 'perf_dupify-aventus')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-aventus-clone-2026' AND nominee_perfume_id = p.id);

-- ---- Best Women's Fragrance 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Women''s Fragrance 2026', 'best-womens-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_designer_chance-eau-fraiche', 'perf_orpheon', 'perf_libreeaudetoilette', 'perf_voceviva', 'perf_lavieestbelle')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-womens-2026' AND nominee_perfume_id = p.id);

-- ---- Best Men's Fragrance 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Men''s Fragrance 2026', 'best-mens-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_sauvage-elixir', 'perf_bleu-de-chanel-parfum', 'perf_aventus', 'perf_boispacifique', 'perf_jazzclub')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-mens-2026' AND nominee_perfume_id = p.id);

-- ---- Best Unisex Fragrance 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Unisex Fragrance 2026', 'best-unisex-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_angham', 'perf_opulentdubai', 'perf_jean-lowe-vibe', 'perf_another13', 'perf_mojaveghost')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-unisex-2026' AND nominee_perfume_id = p.id);

-- ---- Best Niche Fragrance 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Niche Fragrance 2026', 'best-niche-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_naxos', 'perf_baccarat-rouge-540', 'perf_halfeti', 'perf_oud-for-greatness', 'perf_alexandria-ii')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-niche-2026' AND nominee_perfume_id = p.id);

-- ---- Best Designer Fragrance 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Designer Fragrance 2026', 'best-designer-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_designer_sauvage-parfum', 'perf_w_bleu-de-chanel-eau-de-parfum-chanel', 'perf_y-eau-de-parfum', 'perf_eros', 'perf_lhommeprada', 'perf_stronger-with-you-intensely')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-designer-2026' AND nominee_perfume_id = p.id);

-- ---- Best New Launch 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best New Launch 2026', 'best-newcomer-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_sugarblast-initio')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-newcomer-2026' AND nominee_perfume_id = p.id);

-- ---- Best Gourmand 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Gourmand 2026', 'best-gourmand-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_khamrahqahwa', 'perf_vanilla01', 'perf_chocomusk', 'perf_chocolategreedy')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-gourmand-2026' AND nominee_perfume_id = p.id);

-- ---- Best Oud Fragrance 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Oud Fragrance 2026', 'best-oud-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_oud-wood', 'perf_oud-satin-mood', 'perf_alexandria-ii', 'perf_w_royal-oud-creed', 'perf_amberoudgoldeditionextreme', 'perf_interlude-man')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-oud-2026' AND nominee_perfume_id = p.id);

-- ---- Best Bottle Design 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Best Bottle Design 2026', 'best-bottle-2026', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_designer_devotion', 'perf_w_miss-dior-eau-de-parfum-2021-dior', 'perf_goodgirl', 'perf_w_chanel-no-5-parfum-chanel')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-bottle-2026' AND nominee_perfume_id = p.id);

-- ---- Hall of Fame: All-Time Legends ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Hall of Fame: All-Time Legends', 'hall-of-fame', 'perfume', p.id, 0, false
FROM perfumes p
WHERE p.id IN ('perf_aventus', 'perf_baccarat-rouge-540', 'perf_w_sauvage-dior', 'perf_w_chanel-no-5-parfum-chanel', 'perf_shalimar', 'perf_diorhommeintense', 'perf_santal33')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'hall-of-fame' AND nominee_perfume_id = p.id);

-- ============ HOUSE NOMINEES ============

-- ---- Best Indian Clone House 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_house_id, vote_count, is_winner)
SELECT 2026, 'Best Indian Clone House 2026', 'best-indian-clone-house-2026', 'house', h.id, 0, false
FROM houses h
WHERE h.slug IN ('house-of-em5', 'bella-vita', 'rzler', 'dupify', 'xlnc-perfumery')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-indian-clone-house-2026' AND nominee_house_id = h.id);

-- ---- Best Fragrance House 2026 ----
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_house_id, vote_count, is_winner)
SELECT 2026, 'Best Fragrance House 2026', 'best-house-2026', 'house', h.id, 0, false
FROM houses h
WHERE h.slug IN ('lattafa', 'dior', 'xerjoff', 'amouage', 'maison-francis-kurkdjian', 'parfums-de-marly', 'chanel')
AND NOT EXISTS (SELECT 1 FROM awards WHERE year = 2026 AND category_slug = 'best-house-2026' AND nominee_house_id = h.id);

-- ============ VERIFICATION ============
-- Run after: counts per category
-- SELECT category_slug, count(*) FROM awards WHERE year = 2026 AND is_winner = false GROUP BY category_slug ORDER BY category_slug;
