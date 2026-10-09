-- Seed data for perfume_requests (community request board).
-- All four are team-created seeds (team_created=true) from Indian community trend research 2026-10-09.
-- Each was verified missing from the catalog (perfume page returns 404) before seeding.

INSERT INTO perfume_requests (perfume_name, house_name, reason, requester_name, vote_count, team_created, status) VALUES
('Le Male Elixir Absolu', 'Jean Paul Gaultier', 'Afnan''s 9PM Elixir — one of 2026''s most viral clones — is inspired by this. The original is among the most requested JPG scents in Indian fragrance communities right now.', 'Scentiqa Team', 12, true, 'open'),
('Hayaati Gold Elixir', 'Lattafa', '2026 viral hit inspired by Armani Code Profumo. Constantly recommended on r/DesiFragranceAddicts and Indian YouTube as the compliment magnet to beat.', 'Scentiqa Team', 10, true, 'open'),
('Liquid Brun', 'French Avenue', '2026''s breakout clone of Parfums de Marly Althair. Hugely discussed in clone communities for matching a Rs.25,000+ niche scent at a fraction of the price.', 'Scentiqa Team', 8, true, 'open'),
('Vulcan Feu', 'French Avenue', 'Clone of God of Fire by SHL 777. Part of 2026''s wave of Middle Eastern powerhouses delivering niche quality at budget prices.', 'Scentiqa Team', 6, true, 'open')
ON CONFLICT DO NOTHING;
