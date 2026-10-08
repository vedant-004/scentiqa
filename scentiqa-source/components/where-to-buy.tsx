import { RETAILERS, retailerRel } from '@/lib/affiliates';

/**
 * RetailerSearchLinks — shown on every perfume page under the verified price
 * table. These are honest *search* links to major Indian retailers, never
 * presented as product listings. They exist so every perfume page has a
 * legitimate buy path even when no verified seller link is on file.
 *
 * Affiliate tags are appended automatically once configured in
 * lib/affiliates.ts (via env vars). Until then the links are plain searches.
 */
export function RetailerSearchLinks({ perfumeName, houseName }: { perfumeName: string; houseName: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-stone-200/80 bg-cream-50/60 p-4 dark:border-ink-700/60 dark:bg-white/[0.02]">
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
        Can&rsquo;t find it above? Search trusted retailers
      </p>
      <p className="mt-1 text-xs leading-relaxed text-stone-400">
        These open a search for this exact fragrance on the retailer&rsquo;s site — not a verified listing.
        Always confirm the seller, size, and price before buying.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {RETAILERS.map((r) => (
          <a
            key={r.key}
            href={r.url(perfumeName, houseName)}
            target="_blank"
            rel={retailerRel(r.isAffiliate)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-stone-300/80 bg-white px-4 text-[13px] font-semibold text-stone-700 transition-all duration-200 select-none hover:border-gold-500 hover:text-gold-700 active:scale-[0.98] dark:border-white/15 dark:bg-white/5 dark:text-stone-200 dark:hover:border-gold-400 dark:hover:text-gold-300"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            Search {r.label}
          </a>
        ))}
      </div>
    </div>
  );
}
