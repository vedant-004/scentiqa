import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Block MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions policy — disable unused browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Force HTTPS (Vercel terminates TLS; max-age 1 year)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Basic XSS protection for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/house/attar-kannauj', destination: '/house/attarkannauj', permanent: true },
      { source: '/house/attarkannauj-kanyakubj', destination: '/house/attarkannauj', permanent: true },
      { source: '/house/bella-vita-luxury', destination: '/house/bella-vita', permanent: true },
      { source: '/house/by-kilian', destination: '/house/kilian', permanent: true },
      { source: '/house/cerruti', destination: '/house/cerruti-1881', permanent: true },
      { source: '/house/comme-des-gar-ons', destination: '/house/comme-des-garcons', permanent: true },
      { source: '/house/d-s-durga', destination: '/house/ds-durga', permanent: true },
      { source: '/house/herm-s', destination: '/house/hermes', permanent: true },
      { source: '/house/initio-parfums-prives', destination: '/house/initio', permanent: true },
      { source: '/house/lanc-me', destination: '/house/lancome', permanent: true },
      { source: '/house/rabanne', destination: '/house/paco-rabanne', permanent: true },
      { source: '/house/skinn', destination: '/house/skinn-by-titan', permanent: true },
      { source: '/house/skinn-titan', destination: '/house/skinn-by-titan', permanent: true },
      { source: '/perfume/1881men', destination: '/perfume/1881-men', permanent: true },
      { source: '/perfume/2man-commedesgarcons', destination: '/perfume/2-man', permanent: true },
      { source: '/perfume/amalfibleuforwomen', destination: '/perfume/amalfi-bleu-for-women', permanent: true },
      { source: '/perfume/attarkannauj-ruh-saffron', destination: '/perfume/ruh-saffron', permanent: true },
      { source: '/perfume/blessedbaraka', destination: '/perfume/blessed-baraka', permanent: true },
      { source: '/perfume/blu-man', destination: '/perfume/b-l-u-man', permanent: true },
      { source: '/perfume/bluman', destination: '/perfume/b-l-u-man', permanent: true },
      { source: '/perfume/calche', destination: '/perfume/caleche', permanent: true },
      { source: '/perfume/ceomanintense', destination: '/perfume/ceo-man-intense', permanent: true },
      { source: '/perfume/eliteman', destination: '/perfume/elite-man', permanent: true },
      { source: '/perfume/forbiddengames-kilian', destination: '/perfume/forbidden-games', permanent: true },
      { source: '/perfume/h24herbesvives', destination: '/perfume/h24-herbes-vives', permanent: true },
      { source: '/perfume/highfrequency-initio', destination: '/perfume/high-frequency', permanent: true },
      { source: '/perfume/hypnse', destination: '/perfume/hypnose', permanent: true },
      { source: '/perfume/idle', destination: '/perfume/idole', permanent: true },
      { source: '/perfume/idleaura', destination: '/perfume/idole-aura', permanent: true },
      { source: '/perfume/idlenectar', destination: '/perfume/idole-nectar', permanent: true },
      { source: '/perfume/kellycalche', destination: '/perfume/kelly-caleche', permanent: true },
      { source: '/perfume/lanuittresormuscdiamant', destination: '/perfume/la-nuit-tresor-musc-diamant', permanent: true },
      { source: '/perfume/lanuittresornude', destination: '/perfume/la-nuit-tresor-nude', permanent: true },
      { source: '/perfume/lanuittrsor', destination: '/perfume/la-nuit-tresor', permanent: true },
      { source: '/perfume/liaisonsdangereuses-kilian', destination: '/perfume/liaisons-dangereuses', permanent: true },
      { source: '/perfume/moonlightinheaven-kilian', destination: '/perfume/moonlight-in-heaven', permanent: true },
      { source: '/perfume/narcoticdelight-initio', destination: '/perfume/narcotic-delight', permanent: true },
      { source: '/perfume/oceanman', destination: '/perfume/ocean-man', permanent: true },
      { source: '/perfume/paragon-initio', destination: '/perfume/paragon', permanent: true },
      { source: '/perfume/sideeffect', destination: '/perfume/side-effect', permanent: true },
      { source: '/perfume/skinn-amalfi-bleu-women', destination: '/perfume/amalfi-bleu-for-women', permanent: true },
      { source: '/perfume/skinn-raw', destination: '/perfume/raw', permanent: true },
      { source: '/perfume/skinn-verge', destination: '/perfume/verge', permanent: true },
      { source: '/perfume/terre-dhermes-eau-givree', destination: '/perfume/terre-d-hermes-eau-givree', permanent: true },
      { source: '/perfume/terredhermeseaugivree', destination: '/perfume/terre-d-hermes-eau-givree', permanent: true },
      { source: '/perfume/trsor', destination: '/perfume/tresor', permanent: true },
      { source: '/perfume/trsorinlove', destination: '/perfume/tresor-in-love', permanent: true },
      { source: '/perfume/trsormidnightrose', destination: '/perfume/tresor-midnight-rose', permanent: true },
      { source: '/perfume/twilly-dhermes-eau-ginger', destination: '/perfume/twilly-d-hermes-eau-ginger', permanent: true },
      { source: '/perfume/twillydhermeseauginger', destination: '/perfume/twilly-d-hermes-eau-ginger', permanent: true },
      { source: '/perfume/womaningold-kilian', destination: '/perfume/woman-in-gold', permanent: true },
      { source: '/perfume/bleu-de-chanel-chanel', destination: '/perfume/bleu-de-chanel', permanent: true },
      { source: '/perfume/bleu-de-chanel-parfum-chanel', destination: '/perfume/bleu-de-chanel-parfum', permanent: true },
      { source: '/perfume/chanel-n-19-chanel', destination: '/perfume/chanel-n-19', permanent: true },
      { source: '/perfume/dior-addict-dior', destination: '/perfume/dior-addict', permanent: true },
      { source: '/perfume/dior-homme-dior', destination: '/perfume/dior-homme', permanent: true },
      { source: '/perfume/escada-especially-escada', destination: '/perfume/especially-escada', permanent: true },
      { source: '/perfume/gucci-bamboo-gucci', destination: '/perfume/gucci-bamboo', permanent: true },
      { source: '/perfume/gucci-bloom-gucci', destination: '/perfume/gucci-bloom', permanent: true },
      { source: '/perfume/gucci-guilty-gucci', destination: '/perfume/gucci-guilty', permanent: true },
      { source: '/perfume/gucci-premiere-gucci', destination: '/perfume/gucci-premiere', permanent: true },
      { source: '/perfume/gucci-rush-gucci', destination: '/perfume/gucci-rush', permanent: true },
      { source: '/perfume/joy-by-dior-dior', destination: '/perfume/joy-by-dior', permanent: true },
      { source: '/perfume/les-exclusifs-de-chanel-beige-chanel', destination: '/perfume/les-exclusifs-de-chanel-beige', permanent: true },
      { source: '/perfume/les-exclusifs-de-chanel-coromandel-chanel', destination: '/perfume/les-exclusifs-de-chanel-coromandel', permanent: true },
      { source: '/perfume/les-exclusifs-de-chanel-sycomore-chanel', destination: '/perfume/les-exclusifs-de-chanel-sycomore', permanent: true },
      { source: '/perfume/miss-dior-2012-dior', destination: '/perfume/miss-dior-2012', permanent: true },
      { source: '/perfume/miss-dior-cherie-dior', destination: '/perfume/miss-dior-cherie', permanent: true },
      { source: '/perfume/miss-dior-dior', destination: '/perfume/miss-dior', permanent: true },
      { source: '/perfume/versace-woman-versace', destination: '/perfume/versace-woman', permanent: true },
      { source: '/perfume/zino-davidoff-davidoff', destination: '/perfume/zino-davidoff', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Sitemap/robots: cache briefly so crawlers get fresh data
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' }],
      },
      // Perfume pages: static content, cache at edge for a day
      {
        source: '/perfume/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' }],
      },
      // House pages: static content, cache at edge for a day
      {
        source: '/house/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' }],
      },
    ];
  },
};

export default nextConfig;
