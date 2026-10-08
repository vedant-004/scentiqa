-- Scentiqa buy-link infrastructure: affiliate support flags on sellers.
-- Run in the Supabase SQL editor when ready. Safe to re-run (IF NOT EXISTS).
-- Until affiliate IDs are configured (see scentiqa-source/lib/affiliates.ts),
-- retailer links render as plain search links.

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS affiliate_supported boolean NOT NULL DEFAULT false;

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS affiliate_tag text;

COMMENT ON COLUMN sellers.affiliate_supported IS
  'True when Scentiqa holds a working affiliate/referral arrangement with this seller.';
COMMENT ON COLUMN sellers.affiliate_tag IS
  'Seller-specific affiliate identifier, if the program uses per-seller tags. Global tags live in lib/affiliates.ts env vars.';

-- Backfill: no seller is assumed affiliate-supported until confirmed.
-- UPDATE sellers SET affiliate_supported = true WHERE slug IN ('amazon-in', 'nykaa', 'flipkart');
-- (Uncomment and run only after affiliate enrollment is confirmed.)
