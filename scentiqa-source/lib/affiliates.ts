/**
 * Central affiliate configuration for Scentiqa buy links.
 *
 * The site owner plugs real affiliate IDs in here (or via the env vars below)
 * and every perfume page's retailer links pick them up automatically.
 * No code changes needed when IDs arrive.
 *
 * Env vars (set in Vercel; all optional):
 *   NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG  e.g. scentiqa-21
 *   NEXT_PUBLIC_NYKAA_AFFILIATE_PARAM  e.g. the full network tracking param value
 *   NEXT_PUBLIC_FLIPKART_AFFILIATE_ID  e.g. your Flipkart affiliate id
 *
 * Until IDs are configured, retailer links render as plain (non-affiliate)
 * search links. Nothing is ever presented as an affiliate link when it isn't.
 */

export const AFFILIATE = {
  amazonTag: (process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? '').trim(),
  nykaaParam: (process.env.NEXT_PUBLIC_NYKAA_AFFILIATE_PARAM ?? '').trim(),
  flipkartId: (process.env.NEXT_PUBLIC_FLIPKART_AFFILIATE_ID ?? '').trim(),
} as const;

export const hasAmazonAffiliate = AFFILIATE.amazonTag.length > 0;
export const hasNykaaAffiliate = AFFILIATE.nykaaParam.length > 0;
export const hasFlipkartAffiliate = AFFILIATE.flipkartId.length > 0;

/** Search query used for retailer lookups: "<perfume> <house> perfume". */
export function retailerQuery(perfumeName: string, houseName: string): string {
  return `${perfumeName} ${houseName} perfume`.trim();
}

/** Amazon India search. Appends the associate tag only when configured. */
export function amazonSearchUrl(perfumeName: string, houseName: string): string {
  const q = encodeURIComponent(retailerQuery(perfumeName, houseName));
  const tag = hasAmazonAffiliate ? `&tag=${encodeURIComponent(AFFILIATE.amazonTag)}` : '';
  return `https://www.amazon.in/s?k=${q}${tag}`;
}

/**
 * Nykaa search.
 * NOTE: Nykaa's affiliate program runs through third-party networks with their
 * own redirect-link format. The NYKAA_AFFILIATE_PARAM is a placeholder hook:
 * replace the URL construction below with your network's link format once
 * enrolled. Until then this is a plain Nykaa search link.
 */
export function nykaaSearchUrl(perfumeName: string, houseName: string): string {
  const q = encodeURIComponent(retailerQuery(perfumeName, houseName));
  const aff = hasNykaaAffiliate ? `&aff_id=${encodeURIComponent(AFFILIATE.nykaaParam)}` : '';
  return `https://www.nykaa.com/search/result/?q=${q}${aff}`;
}

/**
 * Flipkart search.
 * NOTE: Flipkart's affiliate program has changed formats over time. The
 * FLIPKART_AFFILIATE_ID is a placeholder hook: replace the URL construction
 * below with the current program's link format once enrolled.
 */
export function flipkartSearchUrl(perfumeName: string, houseName: string): string {
  const q = encodeURIComponent(retailerQuery(perfumeName, houseName));
  const aff = hasFlipkartAffiliate ? `&affid=${encodeURIComponent(AFFILIATE.flipkartId)}` : '';
  return `https://www.flipkart.com/search?q=${q}${aff}`;
}

export interface RetailerLink {
  key: string;
  label: string;
  url: (perfumeName: string, houseName: string) => string;
  /** True only when a real affiliate ID is configured for this retailer. */
  isAffiliate: boolean;
}

/** Retailers shown under "Search these retailers" on every perfume page. */
export const RETAILERS: RetailerLink[] = [
  { key: 'amazon', label: 'Amazon.in', url: amazonSearchUrl, isAffiliate: hasAmazonAffiliate },
  { key: 'nykaa', label: 'Nykaa', url: nykaaSearchUrl, isAffiliate: hasNykaaAffiliate },
  { key: 'flipkart', label: 'Flipkart', url: flipkartSearchUrl, isAffiliate: hasFlipkartAffiliate },
];

/**
 * rel attribute for retailer links. `sponsored` is added only when the link
 * genuinely carries an affiliate tag, per Google's link guidance.
 */
export function retailerRel(isAffiliate: boolean): string {
  return isAffiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
}
