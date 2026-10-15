// Server-safe SEO helpers: JSON-LD structured data builders.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Scentarchy',
    url: 'https://scentarchy.com',
    slogan: 'Independent dupe finder, INR prices and heat-performance predictions for India.',
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Scentarchy',
    url: 'https://scentarchy.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://scentarchy.com/search?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  };
}
